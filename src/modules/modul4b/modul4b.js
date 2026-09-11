import { BaseModuleView } from '../../core/base-module.js';
import { courseProgress } from '../../core/progress.js';
import { xapi } from '../../core/xapi.js';

export class Modul4bView extends BaseModuleView {
  constructor(container) {
    super(container, 'src/data/modul4b-hotspots.json');
    this.currentHotspotId = null;
    this.visitedHotspots = new Set();
    this.currentActiveTab = 'tab-modus';
    this.currentZoom = 1.0;
    this.isModalOpen = false;
    this.glightboxInstance = null;
    this.cardPages = [
      { id: 'tab-modus', num: 1, title: 'Modus Operandi' },
      { id: 'tab-photos', num: 2, title: 'Foto Gambar Real' },
      { id: 'tab-detection', num: 3, title: 'Ciri Pelaku & SOP' },
      { id: 'tab-risk', num: 4, title: 'Indikator Risiko' }
    ];
    this.currentCardPageIndex = 0;
  }

  async render() {
    await this.loadData();
    if (!this.moduleData) return;

    this.container.innerHTML = this.getTemplateHTML();

    this.initInteractiveViewer();
    this.initModals();
    this.updateProgressUI();
  }

  getTemplateHTML() {
    return `
      <div id="modul4b-app-root">
        <!-- ─── MAIN VIEWPORT ─── -->
        <div id="modul4b-viewport">

          <!-- Sub Header Bar (Stitch Forensic Module Strip) -->
          <div id="modul4b-top-bar" class="modul1-top-bar">
            <div class="nav-left">
              <div class="header-breadcrumb">
                <span class="modul-code-badge font-code-tech">MODUL 04B</span>
                <span class="course-main-title">Pemeriksaan Sarana Pengangkut Laut (Cargo Ship & Container)</span>
                <span class="breadcrumb-separator">•</span>
                <span class="modul-ref-tag font-code-tech">UU 17/2006 & PER-8/BC/2024</span>
              </div>
            </div>

            <div class="nav-right">
              <!-- Angle Instruction Tag (di sebelah kiri tombol panduan) -->
              <div class="angle-instruction-tag">
                <span class="instruction-dot">●</span>
                <span>Klik zona 01–10 untuk zoom kamera & analisis bukti pemeriksaan</span>
              </div>

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

            <!-- Vessel Canvas Wrapper with Technical Forensic Grid & HUD Overlay -->
            <div class="body-canvas-wrapper" id="m4b-canvas-wrapper">

              <!-- Technical Forensic Grid Background Overlay -->
              <div class="forensic-grid-background" aria-hidden="true"></div>

              <!-- HUD Telemetry Watermark Overlay -->
              <div class="forensic-hud-telemetry" aria-hidden="true">
                <div class="forensic-hud-top-left font-code-tech">
                  <div class="hud-line-title">STASIUN PEMINDAIAN SARANA PENGANGKUT LAUT // 10 INSPECTION ZONES</div>
                  <div class="hud-line-sub">SUBJEK ID: VESSEL-KM-SAMUDRA-09 / CONTAINER CARGO SHIP</div>
                </div>
                <div class="forensic-hud-top-right font-code-tech">
                  <div class="hud-line-azimuth" id="hud-azimuth-text">MODE AKTIF: INTERACTIVE INSPECTION MAP // 10 ZONES</div>
                  <div class="hud-line-status">METODE: RISK-BASED INSPECTION & CAMERA ZOOM FOCUS</div>
                </div>
              </div>

              <!-- Central Active Vessel Image Container with Hotspots Layer -->
              <div class="body-image-container" id="m4b-image-container" style="max-width:960px; aspect-ratio: auto; margin:0 auto;">
                <img id="m4b-central-image" src="assets/images/central/m4b_ship_cutaway.jpeg" 
                     alt="Interactive Inspection Map Kapal Kargo" 
                     class="main-body-img"
                     style="max-height: 68vh; filter: drop-shadow(0 12px 32px rgba(0, 37, 59, 0.16)); pointer-events:none;" />
                <div class="body-pedestal-platform"></div>
                <div id="m4b-hotspots-layer" class="hotspots-layer"></div>
              </div>

              <!-- Floating HUD Segmented Pill Controls Dock (Center Bottom) -->
              <div class="pedestal-rotation-dock" id="pedestal-rotation-dock">
                <div class="pedestal-carousel-controls">
                  <!-- Inspection Focus Pill Button -->
                  <button id="btn-view-ship" class="hud-pill-action-btn active" title="Tampilan Penuh Kapal (Reset Zoom)">
                    <span class="hud-btn-icon">🚢</span>
                    <span class="hud-btn-text">CUTAWAY KAPAL (RESET)</span>
                  </button>

                  <div class="hud-pill-divider"></div>

                  <!-- Quick Zone Navigator Pills (01–10) -->
                  <div class="dock-zone-pills" id="dock-zone-pills" title="Pilih Zona Pemeriksaan (01–10)"></div>

                  <div class="hud-pill-divider"></div>

                  <!-- Zoom Controls integrated into segmented dock -->
                  <button id="btn-zoom-out" class="pedestal-ctrl-btn hud-zoom-btn" title="Perkecil (Zoom Out)" aria-label="Zoom Out">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                  </button>
                  <span id="zoom-level-text" class="zoom-level-badge font-code-tech">100%</span>
                  <button id="btn-zoom-in" class="pedestal-ctrl-btn hud-zoom-btn" title="Perbesar (Zoom In)" aria-label="Zoom In">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                  </button>
                  <button id="btn-zoom-reset" class="pedestal-ctrl-btn hud-zoom-btn reset-btn" title="Reset Zoom (100%)" aria-label="Reset Zoom">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><polyline points="3 3 3 8 8 8"></polyline></svg>
                  </button>
                </div>
              </div>

            </div>

          </div>

        </div>

        <!-- ─── TABBED HOTSPOT CALLOUT CARD (MODUL 4A STANDARD) ─── -->
        <div id="hotspot-card-modal-overlay" class="modal-overlay hidden" role="dialog" aria-modal="true">
          <div id="hotspot-modal-card" class="modal-card tabbed-hotspot-modal hotspot-callout-card">
            <div class="modal-header tabbed-modal-header" title="Tahan dan geser untuk memindahkan kartu callout">
              <div class="modal-header-left">
                <div class="detail-badge-row">
                  <span class="floating-card-drag-indicator" title="Geser posisi kartu">⋮⋮</span>
                  <span id="detail-tag-badge" class="detail-tag-badge">MODUS #01</span>
                </div>
                <h3 id="detail-title" class="detail-title">Detail Pemeriksaan</h3>
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
                  <div class="detail-illustration-box" title="Klik untuk melihat gambar ukuran penuh">
                    <img id="detail-main-img" src="assets/mockup/image_placeholder.svg" alt="Visualisasi Modus" class="detail-main-img" />
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
              </div>

              <!-- TAB 3: DETEKSI & SOP -->
              <div class="tab-pane" id="tab-detection">
                <div class="detection-two-columns">
                  <div class="info-block-col block-warning" id="block-indicators">
                    <div class="block-header">
                      <span class="block-icon warning-icon">⚠️</span>
                      <span class="block-title">Indikator Anomali Pemeriksaan</span>
                    </div>
                    <ul id="detail-indicators-list" class="block-list"></ul>
                  </div>
                  <div class="info-block-col block-procedure" id="block-detection">
                    <div class="block-header">
                      <span class="block-icon procedure-icon">📋</span>
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
                    <span id="risk-score-val" class="risk-meter-score">TINGGI (85/100)</span>
                  </div>
                  <div class="risk-meter-bar-track">
                    <div id="risk-meter-bar-fill" class="risk-meter-bar-fill" style="width: 85%;"></div>
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
                    <span class="hazard-title">Bahaya Ruang Terbatas (Confined Space):</span>
                    <p id="detail-medical-risk" class="hazard-desc"></p>
                  </div>
                </div>
                <div class="hazard-alert-box hazard-officer">
                  <div class="hazard-icon">🛡️</div>
                  <div class="hazard-content">
                    <span class="hazard-title">Protokol Keselamatan Petugas:</span>
                    <p id="detail-officer-safety" class="hazard-desc">
                      Wajib gunakan Self-Contained Breathing Apparatus (SCBA) & Gas Detector portabel sebelum memasuki tangki balas atau ruang palka kargo tertutup.
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

        <!-- High-Res Forensic Photo Lightbox Modal Popup -->
        <div id="m4b-image-popup-modal" class="m4a-image-popup-overlay hidden" role="dialog" aria-modal="true">
          <div class="m4a-image-popup-dialog">
            <div class="m4a-image-popup-header">
              <span id="m4b-popup-img-title" class="m4a-img-popup-title">Foto Barang Bukti</span>
              <button id="btn-close-m4b-popup" class="m4a-img-popup-close-btn" aria-label="Tutup Foto" title="Tutup">✕</button>
            </div>
            <div class="m4a-image-popup-body">
              <img id="m4b-popup-img-el" src="" alt="Bukti Forensik Penuh" class="m4a-img-popup-main" />
            </div>
          </div>
        </div>

        <!-- Help Guide Overlay Modal -->
        <div id="help-overlay" class="modal-overlay hidden" role="dialog" aria-modal="true">
          <div class="modal-card help-modal-card">
            <div class="modal-header">
              <h3>Panduan Interactive Inspection Map Kapal Kargo (Modul 04B)</h3>
              <button id="btn-close-help" class="modal-close-btn" aria-label="Tutup Panduan">✕</button>
            </div>
            <div class="modal-body help-content">
              <div class="help-item">
                <strong>1. 10 Inspection Zones:</strong> Kapal kargo dibagi ke dalam 10 Inspection Zones sistematis (01–10) berbasis risiko pabean sesuai PER-8/BC/2024 dan PER-11/BC/2024.
              </div>
              <div class="help-item">
                <strong>2. Fitur Zoom Kamera Cerdas:</strong> Klik nomor zona 01–10 pada badan kapal atau dock kontrol bawah. Kamera akan secara otomatis melakukan <em>animated zoom focus</em> langsung ke area kompartemen terpilih.
              </div>
              <div class="help-item">
                <strong>3. Floating Inspection Card:</strong> Kartu inspeksi melayang memuat 4 tab terpadu: Modus Operandi & Prosedur, Foto Real Bukti Sitaan, Indikator Anomali & SOP, serta Indikator Risiko & Keselamatan Kerja. Kartu dapat digeser (draggable) agar tidak menutupi visual kapal.
              </div>
              <div class="help-item">
                <strong>4. Navigasi Cepat & Reset:</strong> Gunakan tombol panah ← / → pada kartu untuk menjelajahi zona berikutnya dengan pergerakan kamera dinamis, atau klik tombol <em>CUTAWAY KAPAL (RESET)</em> untuk kembali ke tampilan kapal utuh (100%).
              </div>
            </div>
            <div class="modal-footer">
              <button id="btn-help-ok" class="btn btn-primary">Mengerti & Mulai Simulasi</button>
            </div>
          </div>
        </div>

      </div>
    `;
  }

  initInteractiveViewer() {
    this.renderHotspots();
    this.renderDockPills();

    // Reset Full Cutaway View Button
    const btnViewShip = this.container.querySelector('#btn-view-ship');
    btnViewShip?.addEventListener('click', () => {
      this.closeModal();
    });

    // Zoom Controls
    const btnZoomIn = this.container.querySelector('#btn-zoom-in');
    const btnZoomOut = this.container.querySelector('#btn-zoom-out');
    const btnZoomReset = this.container.querySelector('#btn-zoom-reset');

    btnZoomIn?.addEventListener('click', () => this.applyZoom(this.currentZoom + 0.2));
    btnZoomOut?.addEventListener('click', () => this.applyZoom(this.currentZoom - 0.2));
    btnZoomReset?.addEventListener('click', () => this.resetCameraZoom());
  }

  applyZoom(val) {
    this.currentZoom = Math.min(2.5, Math.max(0.7, parseFloat(val.toFixed(2))));
    const container = this.container.querySelector('#m4b-image-container');
    const zoomText = this.container.querySelector('#zoom-level-text');

    if (container) {
      container.style.transform = `scale(${this.currentZoom})`;
    }

    const counterScale = (1 / this.currentZoom).toFixed(4);
    if (container) {
      container.style.setProperty('--body-zoom', this.currentZoom);
      container.style.setProperty('--tooltip-counter-scale', counterScale);
    }
    document.documentElement.style.setProperty('--body-zoom', this.currentZoom);
    document.documentElement.style.setProperty('--tooltip-counter-scale', counterScale);

    if (zoomText) {
      zoomText.textContent = `${Math.round(this.currentZoom * 100)}%`;
    }
  }

  zoomToZone(hs, zoomLevel = 2.0) {
    this.currentZoom = zoomLevel;
    const container = this.container.querySelector('#m4b-image-container');
    const zoomText = this.container.querySelector('#zoom-level-text');

    if (container) {
      // Smooth focus to target zone coordinates
      container.style.transformOrigin = `${hs.position.x}% ${hs.position.y}%`;
      container.style.transform = `scale(${this.currentZoom})`;

      const counterScale = (1 / this.currentZoom).toFixed(4);
      container.style.setProperty('--body-zoom', this.currentZoom);
      container.style.setProperty('--tooltip-counter-scale', counterScale);
    }

    document.documentElement.style.setProperty('--body-zoom', this.currentZoom);
    document.documentElement.style.setProperty('--tooltip-counter-scale', (1 / this.currentZoom).toFixed(4));

    if (zoomText) {
      zoomText.textContent = `${Math.round(this.currentZoom * 100)}%`;
    }

    this.updateDockPills(hs.id);
  }

  resetCameraZoom() {
    this.currentZoom = 1.0;
    const container = this.container.querySelector('#m4b-image-container');
    const zoomText = this.container.querySelector('#zoom-level-text');

    if (container) {
      container.style.transformOrigin = 'center center';
      container.style.transform = 'scale(1.0)';
      container.style.setProperty('--body-zoom', 1.0);
      container.style.setProperty('--tooltip-counter-scale', 1.0);
    }

    document.documentElement.style.setProperty('--body-zoom', 1.0);
    document.documentElement.style.setProperty('--tooltip-counter-scale', 1.0);

    if (zoomText) {
      zoomText.textContent = '100%';
    }

    this.updateDockPills(null);
  }

  renderDockPills() {
    const pillsContainer = this.container.querySelector('#dock-zone-pills');
    if (!pillsContainer || !this.moduleData) return;
    pillsContainer.innerHTML = '';

    const hotspots = this.moduleData.hotspots || [];
    hotspots.forEach((hs, idx) => {
      const btn = document.createElement('button');
      btn.className = 'dock-zone-pill-btn font-code-tech';
      btn.setAttribute('data-id', hs.id);
      btn.setAttribute('title', hs.label);
      const displayNum = hs.code || (idx < 9 ? `0${idx + 1}` : `${idx + 1}`);
      btn.textContent = displayNum;

      if (this.currentHotspotId === hs.id) {
        btn.classList.add('active');
      }
      if (this.visitedHotspots.has(hs.id)) {
        btn.classList.add('visited');
      }

      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.openHotspotDetail(hs.id);
      });

      pillsContainer.appendChild(btn);
    });
  }

  updateDockPills(activeId = this.currentHotspotId) {
    const pills = this.container.querySelectorAll('.dock-zone-pill-btn');
    pills.forEach(p => {
      const id = p.getAttribute('data-id');
      if (id === activeId) {
        p.classList.add('active');
      } else {
        p.classList.remove('active');
      }
      if (this.visitedHotspots.has(id)) {
        p.classList.add('visited');
      }
    });
  }

  renderHotspots() {
    const layer = this.container.querySelector('#m4b-hotspots-layer');
    if (!layer || !this.moduleData) return;
    layer.innerHTML = '';

    const hotspots = this.moduleData.hotspots || [];

    // 1. Create SVG layer for callout lines
    const svgNS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('class', 'm4b-callout-lines-svg');
    svg.setAttribute('viewBox', '0 0 100 100');
    svg.setAttribute('preserveAspectRatio', 'none');

    // Store references for synchronized hover
    const groupMap = new Map();

    hotspots.forEach((hs, idx) => {
      const isCurrentActive = this.currentHotspotId === hs.id;
      const isVisited = this.visitedHotspots.has(hs.id);
      const displayNum = hs.code || (idx < 9 ? `0${idx + 1}` : `${idx + 1}`);

      const callout = hs.callout || {
        title: hs.label.split(':')[1]?.split('(')[0]?.trim() || hs.label,
        anchor: hs.position,
        elbow: { x: hs.position.x - 5, y: hs.position.y - 10 },
        badge: { x: hs.position.x - 12, y: hs.position.y - 12 },
        lineEnd: { x: hs.position.x - 12, y: hs.position.y - 10 }
      };

      const title = callout.title || hs.label;
      const anchor = callout.anchor || hs.position;
      const elbow = callout.elbow || anchor;
      const badge = callout.badge || anchor;
      const lineEnd = callout.lineEnd || elbow;

      // SVG Line
      const polyline = document.createElementNS(svgNS, 'polyline');
      polyline.setAttribute('class', `m4b-callout-line ${isCurrentActive ? 'active' : ''}`);
      polyline.setAttribute('points', `${anchor.x},${anchor.y} ${elbow.x},${elbow.y} ${lineEnd.x},${elbow.y}`);
      polyline.setAttribute('data-id', hs.id);
      svg.appendChild(polyline);

      // HTML Anchor Dot button at ship coordinate
      const anchorBtn = document.createElement('button');
      anchorBtn.className = `m4b-callout-anchor ${isCurrentActive ? 'active' : ''} ${isVisited ? 'visited' : ''}`;
      anchorBtn.style.left = `${anchor.x}%`;
      anchorBtn.style.top = `${anchor.y}%`;
      anchorBtn.setAttribute('data-id', hs.id);
      anchorBtn.setAttribute('title', `${displayNum} ${title}`);
      anchorBtn.setAttribute('aria-label', `${displayNum} ${title}`);
      anchorBtn.innerHTML = `<span class="m4b-callout-anchor-dot"></span>`;

      // HTML Callout Pill (badge + label text)
      const pill = document.createElement('div');
      pill.className = `m4b-callout-item ${isCurrentActive ? 'active' : ''} ${isVisited ? 'visited' : ''}`;
      pill.style.left = `${badge.x}%`;
      pill.style.top = `${badge.y}%`;
      pill.setAttribute('data-id', hs.id);
      pill.setAttribute('role', 'button');
      pill.setAttribute('tabindex', '0');
      pill.setAttribute('title', `${displayNum} ${title}`);
      pill.innerHTML = `
        <div class="m4b-callout-badge">${displayNum}</div>
        <span class="m4b-callout-text">${title}</span>
      `;

      groupMap.set(hs.id, [polyline, anchorBtn, pill]);

      const onEnter = () => {
        const elems = groupMap.get(hs.id);
        elems?.forEach(el => el.classList.add('is-hovered'));
      };
      const onLeave = () => {
        const elems = groupMap.get(hs.id);
        elems?.forEach(el => el.classList.remove('is-hovered'));
      };
      const onClick = (e) => {
        e.stopPropagation();
        this.openHotspotDetail(hs.id);
      };

      [polyline, anchorBtn, pill].forEach(el => {
        el.addEventListener('pointerenter', onEnter);
        el.addEventListener('pointerleave', onLeave);
        el.addEventListener('click', onClick);
      });

      layer.appendChild(anchorBtn);
      layer.appendChild(pill);
    });

    layer.insertBefore(svg, layer.firstChild);
  }

  openHotspotDetail(hotspotId) {
    const hotspots = this.moduleData?.hotspots || [];
    const hs = hotspots.find(h => h.id === hotspotId);
    if (!hs) return;

    this.currentHotspotId = hotspotId;
    this.isModalOpen = true;
    this.visitedHotspots.add(hotspotId);

    // Smooth camera animated zoom into zone
    this.zoomToZone(hs, 2.0);

    const overlay = this.container.querySelector('#hotspot-card-modal-overlay');
    if (overlay) {
      overlay.classList.remove('hidden');
      overlay.style.display = 'flex';
    }

    this.renderModalContent(hs);
    this.switchCardPage(0);
    this.renderHotspots();
    this.updateDockPills(hs.id);

    this.updateProgressUI();
    xapi.trackHotspotClick(this.moduleData.moduleId || 'modul4b', hs.id, hs.label, hs.category || 'all');
  }

  closeModal() {
    const overlay = this.container.querySelector('#hotspot-card-modal-overlay');
    if (overlay) {
      overlay.classList.add('hidden');
      overlay.style.display = 'none';
    }
    this.isModalOpen = false;
    this.currentHotspotId = null;

    // Reset camera zoom back to 100% overview
    this.resetCameraZoom();
    this.renderHotspots();
    this.updateDockPills(null);
  }

  renderModalContent(hs) {
    const hotspots = this.moduleData?.hotspots || [];
    const totalCount = hotspots.length;
    const currentIdx = hotspots.findIndex(h => h.id === hs.id);

    const tagBadge = this.container.querySelector('#detail-tag-badge');
    const title = this.container.querySelector('#detail-title');
    const counter = this.container.querySelector('#card-nav-counter');

    if (tagBadge) tagBadge.textContent = (hs.badge || `ZONE ${hs.code || currentIdx + 1}`).toUpperCase();
    if (title) title.textContent = hs.label;
    if (counter) counter.textContent = `${currentIdx >= 0 ? currentIdx + 1 : 1} / ${totalCount}`;

    // TAB 1: Modus Operandi
    const mainImg = this.container.querySelector('#detail-main-img');
    const desc = this.container.querySelector('#detail-desc');
    const paramMethod = this.container.querySelector('#detail-concealment-method');
    const paramLocation = this.container.querySelector('#detail-body-location');
    const paramDrug = this.container.querySelector('#detail-drug-types');
    const paramPackaging = this.container.querySelector('#detail-packaging');
    const narrative = this.container.querySelector('#detail-modus-narrative');
    const note = this.container.querySelector('#detail-inspection-note');

    if (mainImg) {
      mainImg.src = hs.mainImage || 'assets/mockup/image_placeholder.svg';
      mainImg.alt = hs.label;
    }
    if (desc) desc.textContent = hs.description || '';
    if (paramMethod) paramMethod.textContent = hs.concealmentMethod || hs.badge || 'Kompartemen Kapal';
    if (paramLocation) paramLocation.textContent = hs.bodyLocation || (hs.category ? hs.category.replace('_', ' ').toUpperCase() : 'STRUKTUR KAPAL');
    if (paramDrug) paramDrug.textContent = hs.drugTypes || 'Kokain / Metamfetamin / Heroin';
    if (paramPackaging) paramPackaging.textContent = hs.packaging || 'Plastik Kedap Air, Lakban, Bungkusan Karung';
    if (narrative) narrative.textContent = hs.modusNarrative || hs.description || 'Penyembunyian pada ruang palka, dinding kargo, atau tangki kapal.';
    if (note) note.textContent = hs.inspectionNote || (hs.inspectionActions ? hs.inspectionActions.join(' ') : 'Lakukan pemeriksaan gabungan bersama Tim K-9 dan teknisi kapal.');

    // TAB 2: Foto Real
    const findingsGrid = this.container.querySelector('#findings-thumbnails-grid');
    if (findingsGrid) {
      const photos = hs.galleryImages || (hs.mainImage ? [hs.mainImage] : []);
      findingsGrid.innerHTML = photos.map((imgSrc, pIdx) => `
        <div class="finding-thumb-card" data-idx="${pIdx}" title="Klik untuk memperbesar bukti sitaan">
          <div class="finding-thumb-wrapper">
            <img src="${imgSrc}" alt="Bukti ${pIdx + 1}" class="finding-thumb-img" />
          </div>
          <span class="finding-thumb-caption">Barang Bukti #${pIdx + 1}</span>
        </div>
      `).join('');

      findingsGrid.querySelectorAll('.finding-thumb-card').forEach((card, idx) => {
        card.addEventListener('click', () => {
          this.openImagePopup(photos[idx], `${hs.label} (Foto #${idx + 1})`);
        });
      });
    }

    // TAB 3: Deteksi & SOP
    const indicatorsList = this.container.querySelector('#detail-indicators-list');
    const detectionList = this.container.querySelector('#detail-detection-list');

    if (indicatorsList) {
      indicatorsList.innerHTML = (hs.riskIndicators || [])
        .map(ind => `<li><span class="bullet-dot">⚠️</span><span>${ind}</span></li>`)
        .join('');
    }

    if (detectionList) {
      detectionList.innerHTML = (hs.inspectionActions || [])
        .map(act => `<li><span class="bullet-dot">✔</span><span>${act}</span></li>`)
        .join('');
    }

    // TAB 4: Indikator Risiko & Keselamatan
    const riskScoreVal = this.container.querySelector('#risk-score-val');
    const riskBarFill = this.container.querySelector('#risk-meter-bar-fill');
    const medRisk = this.container.querySelector('#detail-medical-risk');
    const officerSafety = this.container.querySelector('#detail-officer-safety');

    const score = hs.riskScore || 90;
    const level = score >= 90 ? 'KRITIS' : (score >= 75 ? 'TINGGI' : 'SEDANG');
    if (riskScoreVal) riskScoreVal.textContent = `${level} (${score}/100)`;
    if (riskBarFill) riskBarFill.style.width = `${score}%`;
    if (medRisk) medRisk.textContent = hs.medicalHazard || 'BAHAYA RUANG TERBATAS: Risiko kekurangan oksigen (asfiksia) dan gas beracun hidrokarbon/H2S di dasar palka & tangki bahan bakar/balas.';
    if (officerSafety) officerSafety.textContent = hs.officerSafety || 'Wajib gunakan Self-Contained Breathing Apparatus (SCBA) & Gas Detector portabel sebelum memasuki tangki balas atau ruang palka kargo tertutup.';
  }

  initModals() {
    // Help Modal
    const btnHelp = this.container.querySelector('#btn-help-modal');
    const helpOverlay = this.container.querySelector('#help-overlay');
    const btnCloseHelp = this.container.querySelector('#btn-close-help');
    const btnOkHelp = this.container.querySelector('#btn-help-ok');

    const storageKey = 'tutorial_seen_modul4b';

    const markSeen = () => {
      try {
        localStorage.setItem(storageKey, 'true');
      } catch (e) {}
      helpOverlay?.classList.add('hidden');
    };

    btnHelp?.addEventListener('click', () => helpOverlay?.classList.remove('hidden'));
    btnCloseHelp?.addEventListener('click', markSeen);
    btnOkHelp?.addEventListener('click', markSeen);
    helpOverlay?.addEventListener('click', (e) => {
      if (e.target === helpOverlay) markSeen();
    });

    // Auto-show tutorial on first visit
    try {
      if (!localStorage.getItem(storageKey)) {
        setTimeout(() => {
          helpOverlay?.classList.remove('hidden');
        }, 400);
      }
    } catch (e) {}

    // Hotspot Callout Modal
    const overlay = this.container.querySelector('#hotspot-card-modal-overlay');
    const closeBtn = this.container.querySelector('#btn-close-detail-modal');
    const prevBtn = this.container.querySelector('#btn-prev-hotspot');
    const nextBtn = this.container.querySelector('#btn-next-hotspot');
    const btnPagePrev = this.container.querySelector('#btn-page-prev');
    const btnPageNext = this.container.querySelector('#btn-page-next');

    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.closeModal());
    }

    if (overlay) {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) this.closeModal();
      });
    }

    const hotspots = this.moduleData?.hotspots || [];
    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        const currentIdx = hotspots.findIndex(h => h.id === this.currentHotspotId);
        const prevIdx = (currentIdx - 1 + hotspots.length) % hotspots.length;
        if (hotspots[prevIdx]) this.openHotspotDetail(hotspots[prevIdx].id);
      });
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        const currentIdx = hotspots.findIndex(h => h.id === this.currentHotspotId);
        const nextIdx = (currentIdx + 1) % hotspots.length;
        if (hotspots[nextIdx]) this.openHotspotDetail(hotspots[nextIdx].id);
      });
    }

    // Tabs
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
        if (hotspots[nextIdx]) this.openHotspotDetail(hotspots[nextIdx].id);
      }
    });

    pagePills.forEach((pill, idx) => {
      pill.addEventListener('click', () => {
        this.switchCardPage(idx);
      });
    });

    // Lightbox image click on Tab 1
    const mainImgBox = this.container.querySelector('.detail-illustration-box');
    if (mainImgBox) {
      mainImgBox.addEventListener('click', () => {
        const hs = (this.moduleData?.hotspots || []).find(h => h.id === this.currentHotspotId);
        if (hs) {
          this.openImagePopup(hs.mainImage || 'assets/mockup/image_placeholder.svg', hs.label);
        }
      });
    }

    // Popup Lightbox Close listeners
    const popupOverlay = this.container.querySelector('#m4b-image-popup-modal');
    const btnClosePopup = this.container.querySelector('#btn-close-m4b-popup');

    if (btnClosePopup) {
      btnClosePopup.addEventListener('click', () => this.closeImagePopup());
    }
    if (popupOverlay) {
      popupOverlay.addEventListener('click', (e) => {
        if (e.target === popupOverlay) this.closeImagePopup();
      });
    }

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (popupOverlay && !popupOverlay.classList.contains('hidden')) {
          this.closeImagePopup();
        } else if (this.isModalOpen) {
          this.closeModal();
        }
      }
    });

    this.initCardDraggable();
  }

  openImagePopup(src, title) {
    const popup = this.container.querySelector('#m4b-image-popup-modal');
    const imgEl = this.container.querySelector('#m4b-popup-img-el');
    const titleEl = this.container.querySelector('#m4b-popup-img-title');
    if (popup && imgEl) {
      imgEl.src = src;
      if (titleEl) titleEl.textContent = title || 'Foto Real Forensik';
      popup.classList.remove('hidden');
    }
  }

  closeImagePopup() {
    const popup = this.container.querySelector('#m4b-image-popup-modal');
    if (popup) {
      popup.classList.add('hidden');
    }
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
    courseProgress.setModuleProgress('modul4b', progress);

    this.currentProgressPct = progress;
    window.currentCourseProgressPct = progress;

    if (window.trackCourseProgress) {
      window.trackCourseProgress(progress);
    }
  }
}

