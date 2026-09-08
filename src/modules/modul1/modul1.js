import { BaseModuleView } from '../../core/base-module.js';
import { Anatomy3DViewer } from '../../components/anatomy-3d-viewer.js';

export class Modul1View extends BaseModuleView {
  constructor(container) {
    super(container, 'src/data/modul1-hotspots.json');
    this.anatomy3D = null;
  }

  async render() {
    await super.render();
    this.init3DAnatomyViewer();
  }

  init3DAnatomyViewer() {
    const sceneContainer = this.container.querySelector('.scene-container');
    if (!sceneContainer) return;

    // Create 3D Canvas Container overlay inside scene
    let canvas3DContainer = sceneContainer.querySelector('#anatomy-3d-canvas-container');
    if (!canvas3DContainer) {
      canvas3DContainer = document.createElement('div');
      canvas3DContainer.id = 'anatomy-3d-canvas-container';
      canvas3DContainer.style.position = 'absolute';
      canvas3DContainer.style.inset = '0';
      canvas3DContainer.style.zIndex = '5';
      sceneContainer.prepend(canvas3DContainer);
    }

    // Map 3D body parts to hotspot IDs
    const partToHotspotMap = {
      'head': 'hs-m1-adjacent-kancing',
      'chest': 'hs-m1-adjacent-kancing',
      'abdomen': 'hs-m1-ingestion',
      'lowerBack': 'hs-m1-strap-perut',
      'hip': 'hs-m1-insertion',
      'leftLeg': 'hs-m1-strap-paha',
      'rightLeg': 'hs-m1-strap-betis',
      'leftArm': 'hs-m1-adjacent-pembalut',
      'rightArm': 'hs-m1-adjacent-pembalut'
    };

    // Instantiate 3D Anatomy Viewer
    this.anatomy3D = new Anatomy3DViewer(canvas3DContainer, {
      onPartSelect: (partId) => {
        const hotspotId = partToHotspotMap[partId] || 'hs-m1-ingestion';
        const hotspotData = (this.moduleData.hotspots || []).find(h => h.id === hotspotId);
        if (hotspotData && this.infoPanel) {
          this.hotspotLayer.markVisited(hotspotId);
          this.infoPanel.show(hotspotData);
          if (this.carousel) this.carousel.render(this.moduleData.hotspots, hotspotId);
        }
      },
      onAngleChange: (angleDeg) => {
        if (this.rotationControl) {
          this.rotationControl.setAngle(angleDeg);
        }
      }
    });

    // Hook view toggle to show/hide 3D GLB canvas
    const sceneImg = this.container.querySelector('#central-scene-image');
    if (this.viewToggle) {
      const origOnViewChange = this.viewToggle.onViewChange;
      this.viewToggle.onViewChange = (viewKey) => {
        if (origOnViewChange) origOnViewChange(viewKey);
        
        if (viewKey === 'anatomy3d') {
          canvas3DContainer.style.display = 'block';
          if (sceneImg) sceneImg.style.opacity = '0.15';
        } else {
          canvas3DContainer.style.display = 'none';
          if (sceneImg) sceneImg.style.opacity = '1';
        }
      };
    }
  }
}
