import { HotspotLayer } from '../components/hotspot-layer.js';
import { InfoPanel } from '../components/info-panel.js';
import { ViewToggle } from '../components/view-toggle.js';
import { Carousel } from '../components/carousel.js';
import { RotationControl } from '../components/rotation.js';
import { xapi } from './xapi.js';

export class BaseModuleView {
  constructor(container, jsonPath) {
    this.container = container;
    this.jsonPath = jsonPath;
    this.moduleData = null;
    this.activeView = '';
    this.activeFilter = 'all';
    this.currentAngle = 0;
  }

  async loadData() {
    try {
      const resp = await fetch(this.jsonPath);
      this.moduleData = await resp.json();
    } catch (e) {
      console.error(`[BaseModule] Failed to load JSON ${this.jsonPath}`, e);
    }
  }

  async render() {
    if (!this.moduleData) {
      await this.loadData();
    }
    if (!this.moduleData) return;

    const data = this.moduleData;
    const viewKeys = Object.keys(data.centralImages || {});
    this.activeView = viewKeys[0] || 'front';
    this.currentAngle = 0;

    const html = `
      <div class="inspection-workspace">
        <!-- Floating Filter Category Bar -->
        <div class="filter-category-bar">
          ${(data.filterCategories || []).map(cat => `
            <button class="filter-btn ${cat.id === 'all' ? 'active' : ''}" data-filter="${cat.id}">
              ${cat.label}
            </button>
          `).join('')}
        </div>

        <!-- Floating Viewport Controls (X-Ray / Normal) -->
        <div id="view-toggle-container"></div>

        <!-- Central Inspection Viewport Scene -->
        <div class="scene-viewport">
          <div class="scene-container">
            <img id="central-scene-image" class="scene-image" 
                 src="${data.centralImages[this.activeView].url}" 
                 alt="${data.centralImages[this.activeView].label}">
            
            <!-- Hotspots Interactive Layer -->
            <div id="hotspot-layer-root"></div>
          </div>
        </div>

        <!-- 360 Rotation Controller Container -->
        <div id="rotation-control-root"></div>

        <!-- Right Side Info Drawer -->
        <aside id="info-panel-drawer"></aside>
      </div>
    `;

    this.container.innerHTML = html;

    // Initialize sub-components
    this.initComponents();

    // Track xAPI module view
    xapi.trackModuleView(data.moduleId, data.moduleTitle);
  }

  initComponents() {
    const data = this.moduleData;
    const sceneImg = document.getElementById('central-scene-image');
    const drawerEl = document.getElementById('info-panel-drawer');
    const hotspotRoot = document.getElementById('hotspot-layer-root');
    const viewToggleRoot = document.getElementById('view-toggle-container');
    const rotationRoot = document.getElementById('rotation-control-root');

    this.infoPanel = new InfoPanel(drawerEl);

    this.hotspotLayer = new HotspotLayer(hotspotRoot, {
      onHotspotClick: (hotspot) => {
        this.infoPanel.show(hotspot);
        xapi.trackHotspotClick(data.moduleId, hotspot.id, hotspot.label, hotspot.category);
      }
    });

    this.viewToggle = new ViewToggle(viewToggleRoot, {
      onViewChange: (viewKey) => {
        this.activeView = viewKey;
        if (data.centralImages[viewKey]) {
          sceneImg.src = data.centralImages[viewKey].url;
          sceneImg.alt = data.centralImages[viewKey].label;
        }
        this.hotspotLayer.render(data.hotspots, this.activeView, this.activeFilter, this.currentAngle);
      }
    });

    // Rotation Control if supported by module
    if (data.supportsRotation) {
      this.rotationControl = new RotationControl(rotationRoot, {
        onAngleChange: (angle) => {
          this.currentAngle = angle;
          
          // Switch view angle image automatically if mapped
          if (data.angleImages) {
            if (angle >= 315 || angle < 45) {
              if (data.angleImages.front) sceneImg.src = data.angleImages.front;
            } else if (angle >= 45 && angle < 135) {
              if (data.angleImages.side) sceneImg.src = data.angleImages.side;
            } else if (angle >= 135 && angle < 225) {
              if (data.angleImages.back) sceneImg.src = data.angleImages.back;
            } else if (angle >= 225 && angle < 315) {
              if (data.angleImages.side2) sceneImg.src = data.angleImages.side2;
            }
          }

          this.hotspotLayer.render(data.hotspots, this.activeView, this.activeFilter, this.currentAngle);
        }
      });
      this.rotationControl.render(0);
    }

    // Render initial sub-components state
    this.viewToggle.render(data.centralImages, this.activeView);
    this.hotspotLayer.render(data.hotspots, this.activeView, this.activeFilter, this.currentAngle);

    // Attach Category Filter Buttons Listeners
    const filterBtns = this.container.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const filterId = btn.getAttribute('data-filter');
        this.activeFilter = filterId;
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.hotspotLayer.render(data.hotspots, this.activeView, this.activeFilter, this.currentAngle);
      });
    });
  }
}
