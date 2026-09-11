import { BaseModuleView } from '../../core/base-module.js';
import { scorm } from '../../core/scorm.js';
import { xapi } from '../../core/xapi.js';
import { courseProgress } from '../../core/progress.js';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';

export class Modul4aView extends BaseModuleView {
  constructor(container) {
    super(container, 'src/data/modul4a-hotspots.json');
    this.currentHotspotId = 'hs-m4a-mesin';
    this.visitedHotspots = new Set();
    this.currentActiveTab = 'tab-modus';
    this.activeFilter = 'all';
    this.isModalOpen = false;
    this.isAutoRotating = false;
    this.currentZoomFactor = 2.5;
    this.cardPages = [
      { id: 'tab-modus', num: 1, title: 'Modus Operandi' },
      { id: 'tab-photos', num: 2, title: 'Foto Gambar Real' },
      { id: 'tab-detection', num: 3, title: 'Ciri Pelaku & SOP' },
      { id: 'tab-risk', num: 4, title: 'Indikator Risiko' }
    ];
    this.currentCardPageIndex = 0;

    // 3D Three.js objects
    this.threeScene = null;
    this.threeCamera = null;
    this.threeRenderer = null;
    this.threeControls = null;
    this.vehicleGroup = null;
    this.animFrameId = null;
    this.glightboxInstance = null;
  }

  async render() {
    await this.loadData();
    if (!this.moduleData) return;

    this.container.innerHTML = this.getTemplateHTML();

    // Setup 3D Viewer & Interactivity
    this.init3DViewer();
    this.initInteractiveViewer();
    this.initModals();
    this.updateProgressUI();

    // Track xAPI module view
    xapi.trackModuleView('modul4a', 'Modul 4A: Penyelundupan Melalui Sarana Pengangkut Darat (SUV / Passenger Vehicle)');
  }

  getTemplateHTML() {
    const modPct = courseProgress.getModuleProgress('modul4a');
    const categories = this.moduleData.filterCategories || [];

    return `
      <div id="modul4a-app-root">
        <!-- ─── MAIN VIEWPORT ─── -->
        <div id="modul4a-viewport">

          <!-- Sub Header Bar (Stitch Forensic Module Strip) -->
          <div id="modul4a-top-bar" class="modul1-top-bar">
            <div class="nav-left">
              <div class="header-breadcrumb">
                <span class="modul-code-badge font-code-tech">MODUL 04A</span>
                <span class="course-main-title">Pemeriksaan Kendaraan Darat (SUV / Passenger Vehicle)</span>
                <span class="breadcrumb-separator">•</span>
                <span class="modul-ref-tag font-code-tech">PMK-188/2021 & S-39/BC/2023</span>
              </div>
            </div>

            <div class="nav-right">
              <!-- Help Button -->
              <button id="btn-help-modal" class="icon-btn circle-btn" title="Panduan Penggunaan">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                  <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>
              </button>
            </div>
          </div>

          <!-- Inspection View Stage -->
          <div class="rotatable-body-view">

            <!-- Angle / View Header Bar -->
            <div class="angle-header-bar">
              <div class="current-angle-badge" id="current-angle-badge">
                <span class="angle-deg font-code-tech" id="view-mode-badge">3D MODEL</span>
                <span class="angle-sep">•</span>
                <span class="angle-name" id="view-mode-title">KIA Carnival 2023</span>
                <span class="angle-sub" id="view-mode-sub">(Inspeksi 3D Interaktif 360°)</span>
              </div>
              <div class="angle-instruction-tag">
                <span class="instruction-dot">●</span>
                <span>Klik hotspot bernomor pada kendaraan untuk menganalisis modus operandi & bukti forensik</span>
              </div>
            </div>

            <!-- Vehicle Canvas Wrapper with Technical Forensic Grid & HUD Overlay -->
            <div class="body-canvas-wrapper" id="vehicle-canvas-wrapper">

              <!-- Technical Forensic Grid Background Overlay -->
              <div class="forensic-grid-background" aria-hidden="true"></div>

              <!-- HUD Telemetry Watermark Overlay -->
              <div class="forensic-hud-telemetry" aria-hidden="true">
                <div class="forensic-hud-top-left font-code-tech">
                  <div class="hud-line-title">STASIUN PEMINDAIAN KENDARAAN DARAT 3D</div>
                  <div class="hud-line-sub">SUBJEK ID: VEHICLE-MPV-KC23 / KIA CARNIVAL 2023</div>
                </div>
                <div class="forensic-hud-top-right font-code-tech">
                  <div class="hud-line-azimuth" id="hud-azimuth-text">MODE AKTIF: 3D INTERACTIVE INSPECTION</div>
                  <div class="hud-line-status">SENSOR: DUAL-ENERGY TRANSMISSION & 3D WEBGL</div>
                </div>
              </div>

              <!-- Central Active 3D Vehicle Container with Hotspots Layer -->
              <div class="body-image-container" id="vehicle-image-container" style="max-width:1150px; width:100%; aspect-ratio: auto; margin:0 auto; position:relative;">
                <div id="m4a-3d-canvas-wrapper" style="width:100%; height:74vh; min-height:520px; position:relative; display:flex; align-items:center; justify-content:center;">
                  <img id="m4a-central-image" src="assets/images/central/m4a_suv_cutaway.png" alt="KIA Carnival 2023" class="main-body-img" style="display:none; max-height:72vh; object-fit:contain; filter:drop-shadow(0 12px 32px rgba(0,37,59,0.16)); pointer-events:none;" />
                  <div id="three-canvas-container" style="width:100%; height:100%; position:absolute; inset:0; z-index:2;"></div>
                  <div id="m4a-hotspots-layer" class="hotspots-layer" style="position:absolute; inset:0; z-index:30; pointer-events:none;"></div>
                </div>
                <div class="body-pedestal-platform"></div>
              </div>

              <!-- Floating HUD Segmented Pill Controls Dock (Center Bottom) -->
              <div class="pedestal-rotation-dock" id="pedestal-rotation-dock">
                <div class="pedestal-carousel-controls">
                  <!-- Step Carousel Prev / Play / Next Controls -->
                  <button id="btn-carousel-prev" class="pedestal-ctrl-btn" title="Putar Kiri (360°)" aria-label="Putar Kiri">‹</button>
                  <button id="btn-carousel-play" class="pedestal-ctrl-btn btn-play" title="Toggle Rotasi Otomatis 360°" aria-label="Auto-Play 360°">
                    <span id="play-pause-icon">▶</span>
                  </button>
                  <button id="btn-carousel-next" class="pedestal-ctrl-btn" title="Putar Kanan (360°)" aria-label="Putar Kanan">›</button>

                  <div class="hud-pill-divider"></div>

                  <!-- Zoom Controls integrated into segmented dock -->
                  <button id="btn-zoom-out" class="pedestal-ctrl-btn hud-zoom-btn" title="Perkecil (Zoom Out)" aria-label="Zoom Out">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                  </button>
                  <button id="btn-zoom-reset" class="pedestal-ctrl-btn hud-zoom-btn font-code-tech" title="Reset Zoom (250%)">250%</button>
                  <button id="btn-zoom-in" class="pedestal-ctrl-btn hud-zoom-btn" title="Perbesar (Zoom In)" aria-label="Zoom In">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                  </button>

                </div>
              </div>

            </div>

          </div>

        </div>

        <!-- ─── TABBED HOTSPOT CALLOUT CARD ─── -->
        <div id="hotspot-card-modal-overlay" class="modal-overlay hidden" role="dialog" aria-modal="true">
          <div id="hotspot-modal-card" class="modal-card tabbed-hotspot-modal hotspot-callout-card">
            <div class="modal-header tabbed-modal-header" title="Tahan dan geser untuk memindahkan kartu callout">
              <div class="modal-header-left">
                <div class="detail-badge-row">
                  <span class="floating-card-drag-indicator" title="Geser posisi kartu">⋮⋮</span>
                  <span id="detail-tag-badge" class="detail-tag-badge">MODUS #01</span>
                </div>
                <h3 id="detail-title" class="detail-title">1. Interior: Dashboard & Rongga Jok</h3>
              </div>
              <div class="modal-header-right">
                <div class="card-quick-nav">
                  <button id="btn-prev-hotspot" class="card-nav-arrow-btn" title="Modus Sebelumnya">←</button>
                  <span id="card-nav-counter" class="card-nav-counter">1 / 5</span>
                  <button id="btn-next-hotspot" class="card-nav-arrow-btn" title="Modus Berikutnya">→</button>
                </div>
                <button id="btn-close-detail-modal" class="modal-close-btn" aria-label="Tutup Kartu" title="Tutup Kartu">✕</button>
              </div>
            </div>

            <!-- Compact Segmented Tab Navigation -->
            <div class="card-tabs-nav" id="card-tabs-nav">
              <button class="tab-btn active" data-tab="tab-modus" title="Halaman 1: Modus Operandi">
                <span class="tab-label">Modus Operandi</span>
              </button>
              <button class="tab-btn" data-tab="tab-photos" title="Halaman 2: Foto Gambar Real">
                <span class="tab-label">Foto Real</span>
              </button>
              <button class="tab-btn" data-tab="tab-detection" title="Halaman 3: Ciri Pelaku & SOP">
                <span class="tab-label">Ciri Pelaku & SOP</span>
              </button>
              <button class="tab-btn" data-tab="tab-risk" title="Halaman 4: Indikator Risiko">
                <span class="tab-label">Indikator Risiko</span>
              </button>
            </div>

            <div class="tab-content-container" id="tab-content-container">
              <!-- TAB 1: MODUS -->
              <div class="tab-pane active" id="tab-modus">
                <div class="detail-media-row">
                  <div class="detail-illustration-box">
                    <img id="detail-main-img" src="assets/images/hotspots/hs_door_panel_compartment.png" alt="Visualisasi Modus Kendaraan" class="detail-main-img" />
                  </div>
                  <div class="detail-desc-box">
                    <p id="detail-desc" class="detail-desc-text"></p>
                  </div>
                </div>
                <div class="modus-params-grid">
                  <div class="param-box">
                    <span class="param-label">Metode:</span>
                    <p id="detail-concealment-method" class="param-val"></p>
                  </div>
                  <div class="param-box">
                    <span class="param-label">Lokasi:</span>
                    <p id="detail-body-location" class="param-val"></p>
                  </div>
                  <div class="param-box">
                    <span class="param-label">Narkotika:</span>
                    <p id="detail-drug-types" class="param-val"></p>
                  </div>
                  <div class="param-box">
                    <span class="param-label">Kemasan:</span>
                    <p id="detail-packaging" class="param-val"></p>
                  </div>
                </div>
                <div class="deep-modus-note">
                  <span class="note-label">Detail Teknis Modus:</span>
                  <p id="detail-modus-narrative" class="note-text"></p>
                </div>
                <div class="inspection-guideline-box">
                  <span class="guide-title">📋 Catatan Penindakan DJBC:</span>
                  <p id="detail-inspection-note" class="guide-text"></p>
                </div>
              </div>

              <!-- TAB 2: FOTO REAL -->
              <div class="tab-pane" id="tab-photos">
                <div class="photos-tab-header">
                  <span class="photos-tab-title">Barang Bukti Sitaan & Citra Forensik:</span>
                  <span class="photos-tab-hint">Klik gambar untuk melihat resolusi penuh & zoom</span>
                </div>
                <div class="findings-thumbnails-grid" id="findings-thumbnails-grid"></div>
                <div class="gallery-case-note">
                  <strong>Penting:</strong> Dokumentasi penindakan riil dan citra radiologis forensik resmi DJBC.
                </div>
              </div>

              <!-- TAB 3: DETEKSI & SOP -->
              <div class="tab-pane" id="tab-detection">
                <div class="detection-two-columns">
                  <div class="info-block-col block-warning" id="block-indicators">
                    <div class="block-header">
                      <span class="block-icon warning-icon">⚠️</span>
                      <span class="block-title">Indikator Anomali Kendaraan</span>
                    </div>
                    <ul id="detail-indicators-list" class="block-list"></ul>
                  </div>
                  <div class="info-block-col block-procedure" id="block-detection">
                    <div class="block-header">
                      <span class="block-icon procedure-icon"></span>
                      <span class="block-title">Standar Prosedur Pemeriksaan (SOP)</span>
                    </div>
                    <ul id="detail-detection-list" class="block-list"></ul>
                  </div>
                </div>
              </div>

              <!-- TAB 4: INDIKATOR RISIKO -->
              <div class="tab-pane" id="tab-risk">
                <div class="risk-meter-widget">
                  <div class="risk-meter-header">
                    <span class="risk-meter-title">Tingkat Bahaya Penyelundupan:</span>
                    <span id="risk-score-val" class="risk-meter-score">KRITIS (100/100)</span>
                  </div>
                  <div class="risk-meter-bar-track">
                    <div id="risk-meter-bar-fill" class="risk-meter-bar-fill" style="width: 100%;"></div>
                  </div>
                  <div class="risk-meter-scale">
                    <span>Rendah (0)</span>
                    <span>Sedang (50)</span>
                    <span>Tinggi (75)</span>
                    <span>Kritis (100)</span>
                  </div>
                </div>
                <div class="hazard-alert-box hazard-medical">
                  <div class="hazard-icon">🚨</div>
                  <div class="hazard-content">
                    <span class="hazard-title">Bahaya Kargo / Bahan Kimia:</span>
                    <p id="detail-medical-risk" class="hazard-desc"></p>
                  </div>
                </div>
                <div class="hazard-alert-box hazard-officer">
                  <div class="hazard-icon">🛡️</div>
                  <div class="hazard-content">
                    <span class="hazard-title">Protokol Keselamatan Petugas:</span>
                    <p class="hazard-desc">
                      Gunakan APD lengkap, masker medis, dan sarung tangan nitril. Gunakan car-lift & boroskop untuk inspeksi kompartemen kendaraan.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Bottom Carousel Pagination Bar -->
            <div class="card-pagination-bar" id="card-pagination-bar">
              <button id="btn-page-prev" class="card-page-nav-btn" title="Halaman Tab Sebelumnya" disabled>&lt;</button>

              <div class="card-page-pills" id="card-page-pills">
                <button class="page-pill active" data-page="0" title="1. Modus Operandi"></button>
                <button class="page-pill" data-page="1" title="2. Foto Gambar Real"></button>
                <button class="page-pill" data-page="2" title="3. Ciri Pelaku & SOP"></button>
                <button class="page-pill" data-page="3" title="4. Indikator Risiko"></button>
              </div>

              <button id="btn-page-next" class="card-page-nav-btn" title="Halaman Tab Selanjutnya">&gt;</button>
            </div>
          </div>
        </div>

        <!-- ─── HELP MODAL ─── -->
        <div id="help-overlay" class="modal-overlay hidden" role="dialog" aria-modal="true">
          <div class="modal-card help-box">
            <div class="modal-header">
              <h2 class="modal-heading">Panduan Penggunaan Modul Kendaraan Darat</h2>
              <button id="btn-close-help" class="modal-close-btn">✕</button>
            </div>
            <div class="modal-body help-content">
              <div class="help-item">
                <strong>1. Navigasi 3D Kendaraan:</strong> Usap/drag pada kendaraan 3D untuk memutar sudut pandang 360°, scroll mouse untuk zoom in/out.
              </div>
              <div class="help-item">
                <strong>2. Filter Kategori Modus:</strong> Filter titik-titik hotspot berdasarkan Interior, Bagasi, Kolong, Kompartemen, atau Struktur melalui dock bawah.
              </div>
              <div class="help-item">
                <strong>3. Titik Hotspot Interaktif:</strong> Klik nomor callout pada kendaraan untuk menginspeksi rincian modus penyembunyian & barang bukti.
              </div>
              <div class="help-item">
                <strong>4. Format Tabbed Card:</strong> Pelajari rincian lengkap melalui 4 tab: <em>Modus Operandi</em>, <em>Foto Gambar Real</em>, <em>Ciri Pelaku & SOP</em>, dan <em>Indikator Risiko</em>.
              </div>
            </div>
            <div class="modal-footer">
              <button id="btn-help-ok" class="btn-primary-action">Mengerti</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  init3DViewer() {
    const container = this.container.querySelector('#three-canvas-container');
    const fallbackImg = this.container.querySelector('#m4a-central-image');
    if (!container) return;

    try {
      const width = container.clientWidth || 800;
      const height = container.clientHeight || 500;

      // 1. Scene & Camera
      this.threeScene = new THREE.Scene();

      this.threeCamera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
      this.threeCamera.position.set(1.8, 0.88, 2.0);

      // 2. Renderer
      this.threeRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      this.threeRenderer.setSize(width, height);
      this.threeRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      this.threeRenderer.shadowMap.enabled = true;
      this.threeRenderer.shadowMap.type = THREE.PCFSoftShadowMap;
      container.appendChild(this.threeRenderer.domElement);

      // 3. Orbit Controls — Allow Zooming via Mouse Wheel and HUD buttons
      this.threeControls = new OrbitControls(this.threeCamera, this.threeRenderer.domElement);
      this.threeControls.enableDamping = true;
      this.threeControls.dampingFactor = 0.05;
      this.threeControls.maxPolarAngle = Math.PI / 2 + 0.05;
      this.threeControls.enableZoom = true;
      this.threeControls.minDistance = 1.775; // Max 400% zoom (7.1 / 4.0)
      this.threeControls.maxDistance = 7.1;   // Min 100% zoom (7.1 / 1.0)

      this.threeControls.addEventListener('change', () => {
        if (!this.threeControls || !this.threeCamera) return;
        const distance = this.threeCamera.position.distanceTo(this.threeControls.target);
        if (distance > 0) {
          const factor = 7.1 / distance;
          this.currentZoomFactor = Math.min(4.0, Math.max(1.0, factor));
          const zoomResetBtn = this.container.querySelector('#btn-zoom-reset');
          if (zoomResetBtn) {
            zoomResetBtn.textContent = `${Math.round(this.currentZoomFactor * 100)}%`;
          }
        }
      });

      // 4. Lighting
      const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
      this.threeScene.add(ambientLight);

      const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.8);
      dirLight1.position.set(8, 12, 8);
      dirLight1.castShadow = true;
      this.threeScene.add(dirLight1);

      const dirLight2 = new THREE.DirectionalLight(0xfdbb24, 0.8);
      dirLight2.position.set(-8, 6, -8);
      this.threeScene.add(dirLight2);

      const hemiLight = new THREE.HemisphereLight(0xffffff, 0x00253b, 0.6);
      this.threeScene.add(hemiLight);

      // 5. Vehicle Group
      this.vehicleGroup = new THREE.Group();
      this.threeScene.add(this.vehicleGroup);

      // Load GLB model
      const loader = new GLTFLoader();
      loader.setMeshoptDecoder(MeshoptDecoder);

      const modelPaths = [
        'assets/models/kia_carnival.glb',
        'assets/images/central/kia_carnival.glb'
      ];

      const loadModel = (index) => {
        if (index >= modelPaths.length) {
          console.warn('GLB 3D model not loaded, showing fallback image');
          if (fallbackImg) fallbackImg.style.display = 'block';
          return;
        }

        loader.load(
          modelPaths[index],
          (gltf) => {
            const model = gltf.scene;

            const box = new THREE.Box3().setFromObject(model);
            const center = box.getCenter(new THREE.Vector3());
            const size = box.getSize(new THREE.Vector3());
            const maxDim = Math.max(size.x, size.y, size.z);

            model.position.sub(center);
            const scale = 4.2 / (maxDim || 1);
            model.scale.set(scale, scale, scale);

            this.vehicleGroup.add(model);
            this.init3DHotspotAnchors();
            if (fallbackImg) fallbackImg.style.display = 'none';
          },
          undefined,
          (err) => {
            console.warn(`Attempt ${index + 1} failed loading GLB:`, err.message);
            loadModel(index + 1);
          }
        );
      };

      loadModel(0);

      // Raycasting for direct clicks on 3D hotspot objects or vehicle mesh surface
      const raycaster = new THREE.Raycaster();
      const mouse = new THREE.Vector2();
      let pointerDownPos = { x: 0, y: 0 };
      container.addEventListener('pointerdown', (e) => {
        pointerDownPos = { x: e.clientX, y: e.clientY };
      });

      container.addEventListener('pointerup', (e) => {
        if (!this.threeCamera || !this.vehicleGroup) return;

        const distMoved = Math.hypot(e.clientX - pointerDownPos.x, e.clientY - pointerDownPos.y);
        if (distMoved > 8) return; // Ignore drag rotation movements

        const rect = container.getBoundingClientRect();
        mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

        raycaster.setFromCamera(mouse, this.threeCamera);
        const intersects = raycaster.intersectObjects(this.vehicleGroup.children, true);

        const hotspots = this.moduleData?.hotspots || [];
        if (hotspots.length === 0) return;

        if (intersects.length > 0) {
          for (let hit of intersects) {
            let obj = hit.object;
            while (obj && obj !== this.vehicleGroup) {
              if (obj.userData?.isHotspotAnchor) {
                this.openHotspotDetail(obj.userData.hotspotId);
                return;
              }
              obj = obj.parent;
            }
          }

          // If clicking vehicle mesh surface, open closest hotspot (or first hotspot)
          let closestHs = hotspots[0];
          let minDistance = Infinity;

          for (let hs of hotspots) {
            const anchor = this.vehicleGroup.getObjectByName(`hotspot-anchor-${hs.id}`);
            if (anchor) {
              const anchorWorldPos = new THREE.Vector3();
              anchor.getWorldPosition(anchorWorldPos);
              const dist = intersects[0].point.distanceTo(anchorWorldPos);
              if (dist < minDistance) {
                minDistance = dist;
                closestHs = hs;
              }
            }
          }

          if (closestHs) {
            this.openHotspotDetail(closestHs.id);
          }
        }
      });

      // Animation loop
      const animate = () => {
        this.animFrameId = requestAnimationFrame(animate);

        if (this.isAutoRotating && this.vehicleGroup) {
          this.vehicleGroup.rotation.y += 0.005;
        }

        if (this.threeControls) {
          this.threeControls.update();
        }

        // Project 3D hotspot positions to 2D screen coordinates on every frame
        this.updateHotspotPositions3D();

        if (this.threeRenderer && this.threeScene && this.threeCamera) {
          this.threeRenderer.render(this.threeScene, this.threeCamera);
        }
      };

      animate();

      // Resize listener
      const handleResize = () => {
        if (!container || !this.threeRenderer || !this.threeCamera) return;
        const w = container.clientWidth;
        const h = container.clientHeight;
        this.threeCamera.aspect = w / h;
        this.threeCamera.updateProjectionMatrix();
        this.threeRenderer.setSize(w, h);
      };

      window.addEventListener('resize', handleResize);

    } catch (err) {
      console.warn('Three.js initialization warning:', err.message);
      if (fallbackImg) fallbackImg.style.display = 'block';
    }
  }

  init3DHotspotAnchors() {
    if (!this.vehicleGroup || !this.moduleData?.hotspots) return;

    this.vehicleGroup.updateMatrixWorld(true);

    // Clear previous 3D hotspot anchors from vehicleGroup
    const existingAnchors = [];
    this.vehicleGroup.traverse(child => {
      if (child.userData?.isHotspotAnchor) {
        existingAnchors.push(child);
      }
    });
    existingAnchors.forEach(child => child.parent?.remove(child));

    const hotspots = this.moduleData.hotspots || [];

    hotspots.forEach(hs => {
      const wp = hs.worldPos || { x: -2.00, y: 0.00, z: -1.0 };

      const anchorGroup = new THREE.Group();
      anchorGroup.name = `hotspot-anchor-${hs.id}`;

      // Surface raycast directly at specified worldPos (wp)
      const localRayStart = new THREE.Vector3(wp.x, wp.y + 2.0, wp.z);
      const localRayDir = new THREE.Vector3(0, -1, 0);

      const worldRayStart = localRayStart.clone().applyMatrix4(this.vehicleGroup.matrixWorld);
      const worldRayDir = localRayDir.clone().transformDirection(this.vehicleGroup.matrixWorld).normalize();

      const surfaceRaycaster = new THREE.Raycaster();
      surfaceRaycaster.set(worldRayStart, worldRayDir);
      const hits = surfaceRaycaster.intersectObjects(this.vehicleGroup.children, true);

      let bestHit = null;
      for (let hit of hits) {
        const localP = this.vehicleGroup.worldToLocal(hit.point.clone());
        if (localP.y > 0.05) {
          bestHit = localP;
          break;
        }
      }

      if (bestHit) {
        anchorGroup.position.copy(bestHit);
      } else {
        anchorGroup.position.set(wp.x, wp.y, wp.z);
      }

      anchorGroup.userData = {
        isHotspotAnchor: true,
        hotspotId: hs.id,
        label: hs.label
      };

      // Add hitMesh sphere for 3D raycast detection
      const hitMesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.5, 16, 16),
        new THREE.MeshBasicMaterial({ visible: false })
      );
      hitMesh.userData = {
        isHotspotAnchor: true,
        hotspotId: hs.id,
        label: hs.label
      };
      anchorGroup.add(hitMesh);

      // Add 3D hotspot object directly to vehicleGroup mesh hierarchy
      this.vehicleGroup.add(anchorGroup);
    });
  }

  updateHotspotPositions3D() {
    if (!this.threeCamera || !this.container || !this.vehicleGroup) return;
    const container = this.container.querySelector('#m4a-3d-canvas-wrapper');
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;
    if (!width || !height) return;

    const layerEl = this.container.querySelector('#m4a-hotspots-layer');
    if (!layerEl) return;

    const pins = layerEl.querySelectorAll('.body-hotspot-pin');
    const worldVec = new THREE.Vector3();

    pins.forEach(pin => {
      const hsId = pin.dataset.id;
      const anchor = this.vehicleGroup.getObjectByName(`hotspot-anchor-${hsId}`);

      if (anchor) {
        // Query exact world space position of embedded 3D hotspot object
        anchor.getWorldPosition(worldVec);

        // Project world vector to Normalized Device Coordinates (-1 to +1)
        worldVec.project(this.threeCamera);

        // Convert NDC to screen pixel coordinates relative to container
        const x = (worldVec.x * 0.5 + 0.5) * width;
        const y = (-worldVec.y * 0.5 + 0.5) * height;

        // Check if inside camera view frustum
        const isVisible = worldVec.z < 1;

        if (isVisible) {
          const clampedX = Math.max(30, Math.min(width - 30, x));
          const clampedY = Math.max(30, Math.min(height - 30, y));

          pin.style.display = 'flex';
          pin.style.left = `${clampedX}px`;
          pin.style.top = `${clampedY}px`;
        } else {
          pin.style.display = 'none';
        }
      }
    });
  }

  initInteractiveViewer() {
    this.renderHotspots();

    // Category Filter Pills
    const filterBtns = this.container.querySelectorAll('.m2-dock-filter-btn, .filter-btn');
    filterBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        filterBtns.forEach(b => b.classList.remove('active'));
        e.currentTarget.classList.add('active');
        this.activeFilter = e.currentTarget.dataset.filter;
        this.renderHotspots();
      });
    });

    // Step Carousel Prev (<), Play (▶/⏸), Next (>) Rotate Controls
    const btnPrev = this.container.querySelector('#btn-carousel-prev');
    const btnPlay = this.container.querySelector('#btn-carousel-play');
    const btnNext = this.container.querySelector('#btn-carousel-next');
    const playIcon = this.container.querySelector('#play-pause-icon');

    btnPrev?.addEventListener('click', () => {
      if (this.vehicleGroup) {
        this.vehicleGroup.rotation.y -= 0.25;
      }
    });

    btnNext?.addEventListener('click', () => {
      if (this.vehicleGroup) {
        this.vehicleGroup.rotation.y += 0.25;
      }
    });

    btnPlay?.addEventListener('click', () => {
      this.isAutoRotating = !this.isAutoRotating;
      btnPlay.classList.toggle('playing', this.isAutoRotating);
      if (playIcon) {
        playIcon.textContent = this.isAutoRotating ? '⏸' : '▶';
      }
    });

    // Zoom Controls: Zoom Out (-), Reset Zoom, Zoom In (+)
    const btnZoomOut = this.container.querySelector('#btn-zoom-out');
    const btnZoomReset = this.container.querySelector('#btn-zoom-reset');
    const btnZoomIn = this.container.querySelector('#btn-zoom-in');

    btnZoomOut?.addEventListener('click', () => {
      this.currentZoomFactor = Math.max(1.0, (this.currentZoomFactor || 2.5) - 0.5);
      this.updateZoomLevel();
    });

    btnZoomIn?.addEventListener('click', () => {
      this.currentZoomFactor = Math.min(4.0, (this.currentZoomFactor || 2.5) + 0.5);
      this.updateZoomLevel();
    });

    btnZoomReset?.addEventListener('click', () => {
      this.currentZoomFactor = 2.5;
      this.updateZoomLevel();
    });
  }

  updateZoomLevel() {
    if (!this.threeControls || !this.threeCamera) return;
    const factor = this.currentZoomFactor || 2.5;
    // Base 100% zoom distance is 7.1
    const distance = 7.1 / factor;

    const dir = this.threeCamera.position.clone().sub(this.threeControls.target).normalize();
    if (dir.length() === 0) dir.set(0, 0, 1);

    this.threeCamera.position.copy(this.threeControls.target).add(dir.multiplyScalar(distance));
    this.threeControls.minDistance = 1.775;
    this.threeControls.maxDistance = 7.1;
    this.threeControls.update();

    const zoomResetBtn = this.container.querySelector('#btn-zoom-reset');
    if (zoomResetBtn) {
      zoomResetBtn.textContent = `${Math.round(factor * 100)}%`;
    }
  }

  renderHotspots() {
    const layerEl = this.container.querySelector('#m4a-hotspots-layer');
    if (!layerEl || !this.moduleData) return;

    if (this.vehicleGroup) {
      this.init3DHotspotAnchors();
    }

    const hotspots = this.moduleData.hotspots || [];
    layerEl.innerHTML = '';

    hotspots.forEach((hs, idx) => {
      if (this.activeFilter !== 'all' && hs.category !== this.activeFilter && hs.categoryId !== this.activeFilter) {
        return;
      }

      const isVisited = this.visitedHotspots.has(hs.id);
      const isActive = this.isModalOpen && hs.id === this.currentHotspotId;

      const pin = document.createElement('div');
      pin.className = `body-hotspot-pin ${isActive ? 'active' : ''} ${isVisited ? 'visited' : ''}`;
      pin.dataset.id = hs.id;

      const coords = hs.position || { x: 50, y: 50 };
      pin.style.left = `${coords.x}%`;
      pin.style.top = `${coords.y}%`;
      pin.style.position = 'absolute';
      pin.style.transform = 'translate(-50%, -50%)';

      const num = hs.num || (idx + 1);
      const label = hs.label || `Hotspot #${num}`;

      pin.innerHTML = `
        <div class="pin-point"></div>
        <div class="pin-tooltip" role="tooltip">
          <span class="pin-tooltip-num">${num}</span>
          <span class="pin-tooltip-name">${label}</span>
        </div>
      `;

      pin.setAttribute('tabindex', '0');
      pin.setAttribute('role', 'button');
      pin.setAttribute('aria-label', `Hotspot ${num}: ${label}`);

      pin.addEventListener('pointerenter', () => pin.classList.add('is-hovered'));
      pin.addEventListener('pointerleave', () => pin.classList.remove('is-hovered'));

      pin.addEventListener('click', (e) => {
        e.stopPropagation();
        this.openHotspotDetail(hs.id);
      });

      layerEl.appendChild(pin);
    });
  }

  openHotspotDetail(hotspotId) {
    const hotspots = this.moduleData?.hotspots || [];
    const hs = hotspots.find(h => h.id === hotspotId) || hotspots[0];
    if (!hs) return;

    this.currentHotspotId = hs.id;
    this.visitedHotspots.add(hs.id);
    this.isModalOpen = true;

    courseProgress.markHotspotVisited('modul4a', hs.id, hotspots.length);
    this.updateProgressUI();

    this.renderModalContent(hs, hotspots);

    const overlay = this.container.querySelector('#hotspot-card-modal-overlay');
    if (overlay) {
      overlay.classList.remove('hidden');
      overlay.style.display = 'flex';
      overlay.style.opacity = '1';
      overlay.style.visibility = 'visible';
      overlay.style.zIndex = '9999';
    }

    const card = this.container.querySelector('#hotspot-modal-card');
    if (card) {
      card.style.display = 'flex';
      card.style.opacity = '1';
      card.style.visibility = 'visible';
      card.style.transform = 'none';
      card.style.pointerEvents = 'auto';
    }

    this.renderHotspots();
    this.switchCardPage(0);
  }

  renderModalContent(hs, hotspots) {
    const idx = hotspots.findIndex(h => h.id === hs.id);
    const total = hotspots.length;

    const tagBadge = this.container.querySelector('#detail-tag-badge');
    const title = this.container.querySelector('#detail-title');
    const navCounter = this.container.querySelector('#card-nav-counter');

    if (tagBadge) tagBadge.textContent = `MODUS #${hs.badgeNum || hs.num || (idx + 1)}`;
    if (title) title.textContent = hs.label;
    if (navCounter) navCounter.textContent = `${idx + 1} / ${total}`;

    // TAB 1: Modus
    const mainImg = this.container.querySelector('#detail-main-img');
    const desc = this.container.querySelector('#detail-desc');
    const concealmentMethod = this.container.querySelector('#detail-concealment-method');
    const bodyLocation = this.container.querySelector('#detail-body-location');
    const drugTypes = this.container.querySelector('#detail-drug-types');
    const packaging = this.container.querySelector('#detail-packaging');
    const narrative = this.container.querySelector('#detail-modus-narrative');
    const note = this.container.querySelector('#detail-inspection-note');

    if (mainImg) {
      mainImg.src = hs.mainIllustration || hs.mainImage || 'assets/images/hotspots/hs_door_panel_compartment.png';
      mainImg.alt = hs.label;
    }
    if (desc) desc.textContent = hs.description;
    if (concealmentMethod) concealmentMethod.textContent = hs.badge || 'Vehicle Concealment';
    if (bodyLocation) bodyLocation.textContent = hs.label;
    if (drugTypes) drugTypes.textContent = hs.drugTypes || 'Sabu, Ekstasi, Heroin';
    if (packaging) packaging.textContent = hs.packagingTechnique || 'Plastik Vakum Kedap Udara';
    if (narrative) narrative.textContent = hs.description;
    if (note) note.textContent = hs.inspectionNote || 'SOP DJBC Pemeriksaan Kendaraan Darat';

    // TAB 2: Foto Real
    const findingsGrid = this.container.querySelector('#findings-thumbnails-grid');
    if (findingsGrid) {
      findingsGrid.innerHTML = '';
      const findingsList = (hs.galleryImages && hs.galleryImages.length > 0)
        ? hs.galleryImages.map(img => ({ full: img, thumb: img, caption: hs.label, tag: hs.badge }))
        : [{ full: hs.mainImage || 'assets/images/hotspots/hs_door_panel_compartment.png', caption: hs.label, tag: hs.badge }];

      findingsList.forEach(f => {
        const a = document.createElement('a');
        a.href = f.full;
        a.className = 'finding-thumb-item glightbox';
        a.setAttribute('data-gallery', `findings-gallery-${hs.id}`);
        a.setAttribute('data-title', `${f.caption} — [${f.tag || 'Barang Bukti'}]`);
        a.innerHTML = `
          <img src="${f.full}" alt="${f.caption}" onerror="this.src='assets/images/hotspots/hs_door_panel_compartment.png'" />
          <span class="finding-thumb-label">${f.tag || 'Barang Bukti'}</span>
        `;
        findingsGrid.appendChild(a);
      });

      try {
        if (typeof window.GLightbox !== 'undefined') {
          if (this.glightboxInstance) this.glightboxInstance.destroy();
          this.glightboxInstance = window.GLightbox({
            selector: '.glightbox',
            touchNavigation: true,
            loop: true
          });
        }
      } catch (gErr) {
        console.warn('GLightbox warning:', gErr);
      }
    }

    // TAB 3: Deteksi & SOP
    const indicatorsList = this.container.querySelector('#detail-indicators-list');
    const detectionList = this.container.querySelector('#detail-detection-list');

    if (indicatorsList) {
      indicatorsList.innerHTML = (hs.riskIndicators || [])
        .map(ind => `<li><span>${ind}</span></li>`)
        .join('');
    }

    if (detectionList) {
      detectionList.innerHTML = (hs.inspectionActions || [])
        .map(act => `<li><span>${act}</span></li>`)
        .join('');
    }

    // TAB 4: Indikator Risiko
    const riskScoreVal = this.container.querySelector('#risk-score-val');
    const riskBarFill = this.container.querySelector('#risk-meter-bar-fill');
    const medRisk = this.container.querySelector('#detail-medical-risk');

    const score = hs.riskScore || 85;
    const level = (hs.badgeType || 'HIGH').toUpperCase();
    if (riskScoreVal) riskScoreVal.textContent = `${level} (${score}/100)`;
    if (riskBarFill) riskBarFill.style.width = `${score}%`;
    if (medRisk) medRisk.textContent = 'BAHAYA KENDARAAN: Waspadai barang bukti tersembunyi di tangki bensin, sasis, atau kompartemen bermuatan listrik/mesin.';
  }

  initModals() {
    const btnHelp = this.container.querySelector('#btn-help-modal');
    const helpOverlay = this.container.querySelector('#help-overlay');
    const btnCloseHelp = this.container.querySelector('#btn-close-help');
    const btnOkHelp = this.container.querySelector('#btn-help-ok');

    btnHelp?.addEventListener('click', () => helpOverlay?.classList.remove('hidden'));
    btnCloseHelp?.addEventListener('click', () => helpOverlay?.classList.add('hidden'));
    btnOkHelp?.addEventListener('click', () => helpOverlay?.classList.add('hidden'));

    const overlay = this.container.querySelector('#hotspot-card-modal-overlay');
    const closeBtn = this.container.querySelector('#btn-close-detail-modal');
    const prevBtn = this.container.querySelector('#btn-prev-hotspot');
    const nextBtn = this.container.querySelector('#btn-next-hotspot');
    const btnPagePrev = this.container.querySelector('#btn-page-prev');
    const btnPageNext = this.container.querySelector('#btn-page-next');

    if (closeBtn && overlay) {
      closeBtn.addEventListener('click', () => {
        overlay.classList.add('hidden');
        overlay.style.display = '';
        this.isModalOpen = false;
        this.renderHotspots();
      });
    }

    if (overlay) {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          overlay.classList.add('hidden');
          overlay.style.display = '';
          this.isModalOpen = false;
          this.renderHotspots();
        }
      });
    }

    const hotspots = this.moduleData.hotspots || [];
    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        const currentIdx = hotspots.findIndex(h => h.id === this.currentHotspotId);
        const prevIdx = (currentIdx - 1 + hotspots.length) % hotspots.length;
        this.openHotspotDetail(hotspots[prevIdx].id);
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        const currentIdx = hotspots.findIndex(h => h.id === this.currentHotspotId);
        const nextIdx = (currentIdx + 1) % hotspots.length;
        this.openHotspotDetail(hotspots[nextIdx].id);
      });
    }

    const tabBtns = Array.from(this.container.querySelectorAll('.card-tabs-nav .tab-btn'));
    tabBtns.forEach((btn, idx) => {
      btn.addEventListener('click', () => {
        this.switchCardPage(idx);
      });
    });

    const pagePills = Array.from(this.container.querySelectorAll('.card-page-pills .page-pill'));

    btnPagePrev?.addEventListener('click', () => {
      if (this.currentCardPageIndex > 0) {
        this.switchCardPage(this.currentCardPageIndex - 1);
      }
    });

    btnPageNext?.addEventListener('click', () => {
      if (this.currentCardPageIndex < this.cardPages.length - 1) {
        this.switchCardPage(this.currentCardPageIndex + 1);
      } else {
        const idx = hotspots.findIndex(h => h.id === this.currentHotspotId);
        const nextIdx = (idx + 1) % hotspots.length;
        this.openHotspotDetail(hotspots[nextIdx].id);
      }
    });

    pagePills.forEach((pill, idx) => {
      pill.addEventListener('click', () => {
        this.switchCardPage(idx);
      });
    });

    this.initCardDraggable();
  }

  switchCardPage(pageIndex) {
    if (pageIndex < 0) pageIndex = 0;
    if (pageIndex >= this.cardPages.length) pageIndex = this.cardPages.length - 1;
    this.currentCardPageIndex = pageIndex;
    const page = this.cardPages[pageIndex];
    this.currentActiveTab = page.id;

    this.container.querySelectorAll('.card-tabs-nav .tab-btn').forEach((b, idx) => {
      if (idx === pageIndex) b.classList.add('active');
      else b.classList.remove('active');
    });

    this.container.querySelectorAll('.tab-content-container .tab-pane').forEach(p => {
      if (p.id === page.id) p.classList.add('active');
      else p.classList.remove('active');
    });

    this.container.querySelectorAll('.card-page-pills .page-pill').forEach((pill, idx) => {
      if (idx === pageIndex) pill.classList.add('active');
      else pill.classList.remove('active');
    });

    const btnPagePrev = this.container.querySelector('#btn-page-prev');
    if (btnPagePrev) {
      btnPagePrev.disabled = (pageIndex === 0);
    }

    const content = this.container.querySelector('#tab-content-container');
    if (content) content.scrollTop = 0;
  }

  initCardDraggable() {
    const card = this.container.querySelector('#hotspot-modal-card');
    const header = this.container.querySelector('.tabbed-modal-header');
    if (!card || !header) return;

    let isDragging = false;
    let startMouseX = 0, startMouseY = 0;
    let initialTransformX = 0, initialTransformY = 0;

    const onMouseDown = (e) => {
      if (e.target.closest('button') || e.target.closest('.card-quick-nav')) return;
      isDragging = true;
      startMouseX = e.clientX;
      startMouseY = e.clientY;

      const transform = window.getComputedStyle(card).transform;
      if (transform && transform !== 'none') {
        const matrix = new DOMMatrixReadOnly(transform);
        initialTransformX = matrix.m41;
        initialTransformY = matrix.m42;
      } else {
        initialTransformX = 0;
        initialTransformY = 0;
      }

      header.style.cursor = 'grabbing';
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
      e.preventDefault();
    };

    const onMouseMove = (e) => {
      if (!isDragging) return;
      const dx = e.clientX - startMouseX;
      const dy = e.clientY - startMouseY;
      card.style.transform = `translate(${initialTransformX + dx}px, ${initialTransformY + dy}px)`;
    };

    const onMouseUp = () => {
      if (!isDragging) return;
      isDragging = false;
      header.style.cursor = 'grab';
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    header.addEventListener('mousedown', onMouseDown);
  }

  updateProgressUI() {
    const total = this.moduleData?.hotspots?.length || 5;
    const progress = Math.min(100, Math.round((this.visitedHotspots.size / total) * 100));
    courseProgress.setModuleProgress('modul4a', progress);

    this.currentProgressPct = progress;
    window.currentCourseProgressPct = progress;

    if (window.trackCourseProgress) {
      window.trackCourseProgress(progress);
    }
  }
}

