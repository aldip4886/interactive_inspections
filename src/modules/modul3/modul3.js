import { BaseModuleView } from '../../core/base-module.js';
import { scorm } from '../../core/scorm.js';
import { xapi } from '../../core/xapi.js';
import { courseProgress } from '../../core/progress.js';
import { XRayMagnifier } from '../../components/xray-magnifier.js';
import modul3HotspotsData from '../../data/modul3-hotspots.json';

export class Modul3View extends BaseModuleView {
  constructor(container) {
    super(container, 'src/data/modul3-hotspots.json');
    this.moduleData = modul3HotspotsData; // Initial bundle fallback
    this.currentHotspotId = 'hs-m3-makanan-pouch';
    this.visitedHotspots = new Set();
    this.currentActiveTab = 'tab-modus';
    this.currentViewMode = 'lens'; // 'lens', 'xray', or 'normal'
    this.lensRadius = 92;
    this.activeFilter = 'all';
    this.isModalOpen = false;
    this.audioFeedback = false;
    this.audioCtx = null;
    this.magnifier = null;
    this.lastBeepTime = 0;
    this.currentZoom = 1.2;
    this.panX = 0;
    this.panY = 0;

    this.cardPages = [
      { id: 'tab-modus', num: 1, title: 'Modus Operandi' },
      { id: 'tab-detection', num: 2, title: 'Ciri Pelaku & SOP' },
      { id: 'tab-risk', num: 3, title: 'Indikator Risiko' }
    ];
    this.currentCardPageIndex = 0;
  }

  async loadData() {
    try {
      await super.loadData();
    } catch (e) {
      console.warn('[Modul3] Fetch loadData error, using bundled json data:', e);
    }
    if (!this.moduleData) {
      this.moduleData = modul3HotspotsData;
    }
  }

  async render() {
    await this.loadData();
    if (!this.moduleData) return;

    this.container.innerHTML = this.getTemplateHTML();

    // Setup interactive elements, components & listeners
    this.initInteractiveViewer();
    this.initModals();
    this.updateProgressUI();

    // Track xAPI module view
    xapi.trackModuleView('modul3', 'Modul 3: Penyelundupan Melalui Barang Kiriman (Postal & Courier Cargo)');
  }

  getTemplateHTML() {
    const meta = this.moduleData?.meta || {};
    const telemetry = this.moduleData?.telemetry || {};
    const guide = this.moduleData?.guide || {};
    const densityLegend = this.moduleData?.densityLegend || [
      { id: 'organic', colorClass: 'orange', name: 'Organik / Narkotika', label: 'Oranye / Cokelat' },
      { id: 'inorganic', colorClass: 'green', name: 'Campuran / Anorganik', label: 'Hijau' },
      { id: 'heavy', colorClass: 'blue', name: 'Logam Tebal', label: 'Biru / Hitam' }
    ];
    const codeBadge = meta.codeBadge || 'MODUL 03';
    const courseTitle = meta.title || 'Pemeriksaan Barang Kiriman (Postal & Courier Cargo)';
    const legalRef = meta.legalRef || 'PMK-188/2021 & S-39/BC/2023';
    const instructionTag = meta.instructionTag || 'Hover lensa kaca pembesar atau klik hotspot untuk menganalisis anomali kargo';
    const subjectId = telemetry.subjectId || 'TARGET ID: PARCEL-EXP-9912 / KARTON POS & CARGO';
    const activeModeText = telemetry.activeModeText || 'MODE: SCANNER DUAL-ENERGY';
    const sensor = telemetry.sensor || 'DETEKTOR: TRANSMISSION X-RAY & SPECTRAL ANALYZER';

    return `
      <div id="modul3-app-root">
        <!-- ─── MAIN VIEWPORT ─── -->
        <div id="modul3-viewport">

          <!-- Sub Header Bar (Stitch Forensic Module Strip) -->
          <div id="modul3-top-bar" class="modul1-top-bar">
            <div class="nav-left">
              <div class="header-breadcrumb">
                <span class="modul-code-badge font-code-tech">${codeBadge}</span>
                <span class="course-main-title">${courseTitle}</span>
                <span class="breadcrumb-separator">•</span>
                <span class="modul-ref-tag font-code-tech">${legalRef}</span>
              </div>
            </div>

            <div class="nav-right">
              <!-- Angle Instruction Tag -->
              <div class="angle-instruction-tag">
                <span class="instruction-dot">●</span>
                <span>${instructionTag}</span>
              </div>

              <!-- Help Button -->
              <button id="btn-help-modal" class="icon-btn circle-btn" title="Panduan Penggunaan Simulator">
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

            <!-- Cargo Canvas Wrapper with Technical Forensic Grid & HUD Overlay -->
            <div class="body-canvas-wrapper" id="cargo-canvas-wrapper">

              <!-- Technical Forensic Grid Background Overlay -->
              <div class="forensic-grid-background" aria-hidden="true"></div>

              <!-- HUD Telemetry Watermark Overlay -->
              <div class="forensic-hud-telemetry" aria-hidden="true">
                <div class="forensic-hud-top-left font-code-tech">
                  <div class="hud-line-sub">${subjectId}</div>
                </div>
                <div class="forensic-hud-top-right font-code-tech">
                  <div class="hud-line-azimuth" id="hud-sensor-text">${sensor}</div>
                  <div class="hud-line-status" id="hud-coords-text">${activeModeText}</div>
                </div>
              </div>

              <!-- Floating Top Controls Dock (Above Central Image) -->
              <div class="m3-top-controls-dock" id="m3-top-controls-dock">
                <div class="pedestal-carousel-controls">
                  <!-- Mode Switcher Pill Buttons -->
                  <button id="btn-view-lens" class="hud-pill-action-btn active" title="Tampilan Lensa Pembesar X-Ray">
                    <span class="hud-btn-icon">🔍</span>
                    <span class="hud-btn-text">LENSA X-RAY</span>
                  </button>
                  <button id="btn-view-xray" class="hud-pill-action-btn mode-btn-secondary" title="Tampilan Pemindai X-Ray Penuh">
                    <span class="hud-btn-icon">⚡</span>
                    <span class="hud-btn-text">FULL X-RAY</span>
                  </button>
                  <button id="btn-view-normal" class="hud-pill-action-btn mode-btn-secondary" title="Tampilan Tampak Luar Karton">
                    <span class="hud-btn-icon">📦</span>
                    <span class="hud-btn-text">TAMPAK LUAR</span>
                  </button>

                  <div class="hud-pill-divider"></div>

                  <!-- Slider Ukuran Lensa -->
                  <div class="lens-slider-group" title="Atur Radius Lensa Kaca Pembesar">
                    <span class="hud-btn-text" style="font-size:11px; font-family:'JetBrains Mono'; color:#94A3B8;">RADIUS:</span>
                    <input type="range" id="lens-radius-slider" min="80" max="220" value="92" />
                    <span id="lens-radius-label" class="hud-angle-indicator font-code-tech" style="min-width:38px;">92px</span>
                  </div>

                  <div class="hud-pill-divider"></div>

                  <!-- Audio Bip Toggle Button -->
                  <button id="btn-toggle-audio" class="pedestal-ctrl-btn" title="Aktifkan / Nonaktifkan Efek Suara Sensor Pemindai" aria-label="Suara Pemindai">
                    <span id="audio-icon">🔊</span>
                  </button>
                </div>
              </div>

              <!-- Central Stage Area (Central Image + Vertical Zoom Slider Beside It) -->
              <div class="m3-central-stage-area" id="m3-central-stage-area">
                <!-- Central Active Cargo Image Container with Magnifier Stage -->
                <div class="body-image-container" id="cargo-image-container">
                  <div class="cargo-scanner-stage-wrapper" id="m3-scanner-stage"></div>
                  <div class="body-pedestal-platform"></div>
                </div>

                <!-- Vertical Zoom Slider Dock (Beside Central Image) -->
                <div class="m3-vertical-zoom-dock" id="m3-vertical-zoom-dock" title="Kontrol Zoom Gambar">
                  <button id="btn-zoom-in" class="m3-vzoom-btn" title="Perbesar Gambar (Zoom In)" aria-label="Zoom In">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                  </button>
                  <div class="m3-vzoom-slider-wrap">
                    <span id="zoom-level-text" class="m3-vzoom-badge font-code-tech">120%</span>
                    <input type="range" id="m3-zoom-slider" class="m3-vertical-slider" min="100" max="250" step="5" value="120" orient="vertical" aria-label="Tingkat Zoom Gambar" />
                  </div>
                  <button id="btn-zoom-out" class="m3-vzoom-btn" title="Perkecil Gambar (Zoom Out)" aria-label="Zoom Out">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                  </button>
                  <button id="btn-zoom-reset" class="m3-vzoom-btn reset-btn" title="Reset Zoom (120%)" aria-label="Reset Zoom">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><polyline points="3 3 3 8 8 8"></polyline></svg>
                  </button>
                </div>
              </div>

              <!-- Bottom Legend Dock (Center Bottom - 1 Row Density Palette Strip) -->
              <div class="m3-bottom-legend-dock" id="m3-bottom-legend-dock">
                <div class="density-palette-strip" aria-label="Legenda Warna Densitas Material X-Ray">
                  <span class="density-title">DENSITAS MATERIAL:</span>
                  ${densityLegend.map(item => `
                    <div class="density-palette-item" title="${item.desc || ''}">
                      <span class="density-dot ${item.id === 'organic' ? 'orange' : (item.id === 'inorganic' ? 'green' : 'blue')}"></span>
                      <span class="density-item-text">${item.label || item.name}: <strong>${item.name}</strong></span>
                    </div>
                  `).join('')}
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
                <h3 id="detail-title" class="detail-title">1. Paket Narkotika Organik #1</h3>
              </div>
              <div class="modal-header-right">
                <div class="card-quick-nav">
                  <button id="btn-prev-hotspot" class="card-nav-arrow-btn" title="Modus Sebelumnya">←</button>
                  <span id="card-nav-counter" class="card-nav-counter">1 / 7</span>
                  <button id="btn-next-hotspot" class="card-nav-arrow-btn" title="Modus Berikutnya">→</button>
                </div>
                <button id="btn-close-detail-modal" class="modal-close-btn" aria-label="Tutup Kartu" title="Tutup Kartu">✕</button>
              </div>
            </div>

            <!-- Tab Navigation Header (3 Tabs) -->
            <div class="card-tabs-nav" id="card-tabs-nav">
              <button class="tab-btn active" data-tab="tab-modus" title="Halaman 1: Modus Operandi">
                <span class="tab-icon">📋</span>
                <span class="tab-label">Modus Operandi</span>
              </button>
              <button class="tab-btn" data-tab="tab-detection" title="Halaman 2: Ciri Pelaku & SOP">
                <span class="tab-icon">🛡️</span>
                <span class="tab-label">Ciri Pelaku & SOP</span>
              </button>
              <button class="tab-btn" data-tab="tab-risk" title="Halaman 3: Indikator Risiko">
                <span class="tab-icon">⚠️</span>
                <span class="tab-label">Indikator Risiko</span>
              </button>
            </div>

            <!-- Card Body Scrollable Viewport -->
            <div class="tabbed-card-body" id="tabbed-card-body">
              <!-- TAB 1: MODUS OPERANDI -->
              <div class="tab-pane active" id="tab-modus">
                <div class="pane-media-lead">
                  <div class="lead-img-wrapper" id="lead-img-container" style="cursor:zoom-in;">
                    <img id="detail-real-img" src="" alt="Bukti Forensik X-Ray" class="lead-forensic-img" />
                    <div class="img-magnify-hint">🔍 Klik untuk Pembesaran</div>
                  </div>
                  <div id="m3-gallery-thumbnails-grid" class="findings-thumbnails-grid" style="display: flex; gap: 8px; margin-top: 10px; flex-wrap: wrap;"></div>
                  <p id="detail-desc" class="lead-caption-text"></p>
                </div>
                <div class="kv-details-grid">
                  <div class="kv-item"><span class="kv-label">METODE:</span><span id="detail-method" class="kv-val"></span></div>
                  <div class="kv-item"><span class="kv-label">LOKASI:</span><span id="detail-location" class="kv-val"></span></div>
                  <div class="kv-item"><span class="kv-label">NARKOTIKA:</span><span id="detail-narcotics" class="kv-val highlight"></span></div>
                  <div class="kv-item"><span class="kv-label">KEMASAN:</span><span id="detail-packaging" class="kv-val"></span></div>
                </div>
                <div class="modus-breakdown-box">
                  <span class="box-title-label">Detail Teknis Modus:</span>
                  <p id="detail-modus-detail" class="box-desc-text"></p>
                </div>
              </div>

              <!-- TAB 2: CIRI PELAKU & SOP -->
              <div class="tab-pane" id="tab-detection">
                <div class="dual-info-blocks">
                  <div class="info-block traits-block">
                    <div class="block-header">
                      <span class="block-icon traits-icon"></span>
                      <span class="block-title">Indikator Anomali & Profil</span>
                    </div>
                    <ul id="detail-traits-list" class="block-list"></ul>
                  </div>
                  <div class="info-block procedure-block">
                    <div class="block-header">
                      <span class="block-icon procedure-icon"></span>
                      <span class="block-title">Standar Prosedur Pemeriksaan (SOP)</span>
                    </div>
                    <ul id="detail-detection-list" class="block-list"></ul>
                  </div>
                </div>
              </div>

              <!-- TAB 3: INDIKATOR RISIKO -->
              <div class="tab-pane" id="tab-risk">
                <div class="risk-meter-widget">
                  <div class="risk-meter-header">
                    <span class="risk-meter-title">Tingkat Bahaya Kargo:</span>
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
                      Gunakan sarung tangan nitril tebal & masker standar gas/partikel. Dilarang menghirup atau mencicipi serbuk secara langsung.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Bottom Carousel Pagination Bar (<, dot, >) -->
            <div class="card-pagination-bar" id="card-pagination-bar">
              <button id="btn-page-prev" class="card-page-nav-btn" title="Halaman Tab Sebelumnya" disabled>&lt;</button>

              <div class="card-page-pills" id="card-page-pills">
                <button class="page-pill active" data-page="0" title="1. Modus Operandi"></button>
                <button class="page-pill" data-page="1" title="2. Ciri Pelaku & SOP"></button>
                <button class="page-pill" data-page="2" title="3. Indikator Risiko"></button>
              </div>

              <button id="btn-page-next" class="card-page-nav-btn" title="Halaman Tab Selanjutnya">&gt;</button>
            </div>
          </div>
        </div>

        <!-- ─── HELP MODAL ─── -->
        <div id="help-overlay" class="modal-overlay hidden" role="dialog" aria-modal="true">
          <div class="modal-card help-box">
            <div class="modal-header">
              <h2 class="modal-heading">${guide.title || 'Panduan Penggunaan Modul Kargo Pos & PJT'}</h2>
              <button id="btn-close-help" class="modal-close-btn" aria-label="Tutup Panduan">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <div class="modal-body help-content">
              ${(guide.items || [
                { num: 1, title: 'Lensa Kaca Pembesar X-Ray', text: 'Arahkan kursor mouse (atau usap/drag jari pada tablet/ponsel) ke atas kardus kargo untuk memindai isi dalam paket secara interaktif.' },
                { num: 2, title: 'Titik Hotspot Anomali', text: 'Klik titik hotspot bernomor untuk membuka kartu analisis modus operandi, bukti forensik, dan SOP penindakan Bea Cukai.' },
                { num: 3, title: 'Mode Tampilan & Kontrol Pembesar', text: 'Gunakan tombol dok bawah untuk berpindah ke mode Full X-Ray atau sesuaikan radius lensa pembesar melalui slider vertikal.' },
                { num: 4, title: 'Format Tabbed Card', text: 'Pelajari rincian lengkap melalui 3 tab: <em>Modus Operandi</em>, <em>Ciri Pelaku & SOP</em>, dan <em>Indikator Risiko</em>.' }
              ]).map(item => `
                <div class="help-item">
                  <strong>${item.num}. ${item.title}:</strong> ${item.text}
                </div>
              `).join('')}
            </div>
            <div class="modal-footer">
              <button id="btn-help-ok" class="btn-primary-action">Mengerti</button>
            </div>
          </div>
        </div>

        <!-- ─── IMAGE POPUP VIEWER MODAL ─── -->
        <div id="image-popup-overlay" class="modal-overlay hidden" role="dialog" aria-modal="true" style="z-index: 1200;">
          <div class="image-popup-card" style="background: rgba(2, 8, 16, 0.95); border: 1px solid var(--djbc-gold); border-radius: var(--radius-lg); padding: 14px; max-width: 90vw; max-height: 90vh; display: flex; flex-direction: column; box-shadow: 0 20px 60px rgba(0,0,0,0.85);">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 10px;">
              <h4 id="image-popup-title" style="color:#FFF; font-family:'Poppins', sans-serif; font-size:14px; margin:0;">Foto Barang Bukti</h4>
              <button id="btn-close-img-popup" class="modal-close-btn" style="width:28px; height:28px; font-size:13px;">✕</button>
            </div>
            <div style="flex:1; overflow:hidden; display:flex; align-items:center; justify-content:center;">
              <img id="image-popup-img" src="" alt="Popup Preview" style="max-width:100%; max-height:75vh; object-fit:contain; border-radius:var(--radius-sm);" />
            </div>
          </div>
        </div>

      </div>
    `;
  }

  initInteractiveViewer() {
    const stageContainer = this.container.querySelector('#m3-scanner-stage');
    if (!stageContainer) return;

    const normalImgUrl = 'assets/images/central/m3_parcel_normal.jpeg';
    const xrayImgUrl = 'assets/images/central/m3_parcel_xray.jpeg';

    // Inisialisasi komponen XRayMagnifier
    this.magnifier = new XRayMagnifier({
      container: stageContainer,
      normalSrc: normalImgUrl,
      xraySrc: xrayImgUrl,
      initialRadius: this.lensRadius,
      initialMode: this.currentViewMode,
      onPositionChange: (pctX, pctY) => this.handleLensMovement(pctX, pctY)
    });

    // Render Pin Hotspot ke dalam overlay lensa
    this.renderHotspots();

    // Mode Buttons Listeners
    const btnLens = this.container.querySelector('#btn-view-lens');
    const btnXray = this.container.querySelector('#btn-view-xray');
    const btnNormal = this.container.querySelector('#btn-view-normal');
    const sensorText = this.container.querySelector('#hud-sensor-text');

    btnLens?.addEventListener('click', () => {
      this.currentViewMode = 'lens';
      this.updateModePills(btnLens);
      this.magnifier.setMode('lens');
      if (sensorText) sensorText.textContent = 'SENSOR: DUAL-ENERGY TRANSMISSION (160 kV)';
      this.playScannerBeep(900, 0.05);
    });

    btnXray?.addEventListener('click', () => {
      this.currentViewMode = 'xray';
      this.updateModePills(btnXray);
      this.magnifier.setMode('xray');
      if (sensorText) sensorText.textContent = 'MODE AKTIF: PEMINDAI FULL X-RAY SCAN';
      this.playScannerBeep(1100, 0.06);
    });

    btnNormal?.addEventListener('click', () => {
      this.currentViewMode = 'normal';
      this.updateModePills(btnNormal);
      this.magnifier.setMode('normal');
      if (sensorText) sensorText.textContent = 'MODE AKTIF: INSPEKSI FISIK TAMPAK NORMAL';
      this.playScannerBeep(750, 0.05);
    });

    // Slider Radius Listener
    const radiusSlider = this.container.querySelector('#lens-radius-slider');
    const radiusLabel = this.container.querySelector('#lens-radius-label');
    radiusSlider?.addEventListener('input', (e) => {
      this.lensRadius = parseInt(e.target.value, 10);
      if (radiusLabel) radiusLabel.textContent = `${this.lensRadius}px`;
      if (this.magnifier) this.magnifier.setRadius(this.lensRadius);
    });

    // Audio Bip Toggle
    const btnAudio = this.container.querySelector('#btn-toggle-audio');
    const audioIcon = this.container.querySelector('#audio-icon');
    btnAudio?.addEventListener('click', () => {
      this.audioFeedback = !this.audioFeedback;
      if (this.audioFeedback) {
        btnAudio.classList.add('active');
        if (audioIcon) audioIcon.textContent = '🔊';
        this.playScannerBeep(1200, 0.1);
      } else {
        btnAudio.classList.remove('active');
        if (audioIcon) audioIcon.textContent = '🔇';
      }
    });

    // Setup Vertical Zoom Slider & Controls
    this.setupZoomControls();
  }

  setupZoomControls() {
    const btnZoomIn = this.container.querySelector('#btn-zoom-in');
    const btnZoomOut = this.container.querySelector('#btn-zoom-out');
    const btnZoomReset = this.container.querySelector('#btn-zoom-reset');
    const zoomSlider = this.container.querySelector('#m3-zoom-slider');
    const canvasWrap = this.container.querySelector('#cargo-canvas-wrapper');

    zoomSlider?.addEventListener('input', (e) => {
      this.applyZoom(Number(e.target.value) / 100);
    });

    btnZoomIn?.addEventListener('click', () => {
      this.applyZoom(this.currentZoom + 0.15);
    });

    btnZoomOut?.addEventListener('click', () => {
      this.applyZoom(this.currentZoom - 0.15);
    });

    btnZoomReset?.addEventListener('click', () => {
      this.resetZoom();
    });

    // Mouse wheel zoom on canvas wrapper
    canvasWrap?.addEventListener('wheel', (e) => {
      e.preventDefault();
      const step = 0.1;
      if (e.deltaY < 0) {
        this.applyZoom(this.currentZoom + step);
      } else {
        this.applyZoom(this.currentZoom - step);
      }
    }, { passive: false });

    // Drag / Pan when zoomed in
    let isDragging = false;
    let startX = 0;
    let startY = 0;

    canvasWrap?.addEventListener('mousedown', (e) => {
      if (this.currentZoom <= 1.0) return;
      if (e.target.closest('button') || e.target.closest('input') || e.target.closest('.modal-card') || e.target.closest('.body-hotspot-pin')) {
        return;
      }
      // If clicking inside scanner stage in lens mode with left-click, let lens reveal work
      if (this.currentViewMode === 'lens' && e.target.closest('#cargo-image-container') && e.button === 0) {
        return;
      }
      isDragging = true;
      startX = e.clientX - this.panX;
      startY = e.clientY - this.panY;
      canvasWrap.style.cursor = 'grabbing';
    });

    window.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      this.panX = e.clientX - startX;
      this.panY = e.clientY - startY;
      const container = this.container.querySelector('#cargo-image-container');
      if (container) {
        container.style.transform = `translate(${this.panX}px, ${this.panY}px) scale(${this.currentZoom})`;
      }
    });

    window.addEventListener('mouseup', () => {
      if (isDragging) {
        isDragging = false;
        if (canvasWrap) canvasWrap.style.cursor = 'default';
      }
    });

    this.applyZoom(1.2);
  }

  applyZoom(val) {
    this.currentZoom = Math.min(2.5, Math.max(1.0, parseFloat(val.toFixed(2))));
    const container = this.container.querySelector('#cargo-image-container');
    const zoomText = this.container.querySelector('#zoom-level-text');
    const slider = this.container.querySelector('#m3-zoom-slider');

    if (container) {
      if (this.panX === 0 && this.panY === 0) {
        container.style.transformOrigin = 'center center';
        container.style.transform = `scale(${this.currentZoom})`;
      } else {
        container.style.transformOrigin = 'center center';
        container.style.transform = `translate(${this.panX}px, ${this.panY}px) scale(${this.currentZoom})`;
      }
    }

    const counterScale = (1 / this.currentZoom).toFixed(4);
    if (container) {
      container.style.setProperty('--body-zoom', this.currentZoom);
      container.style.setProperty('--tooltip-counter-scale', counterScale);
    }
    document.documentElement.style.setProperty('--body-zoom', this.currentZoom);
    document.documentElement.style.setProperty('--tooltip-counter-scale', counterScale);

    const pct = Math.round(this.currentZoom * 100);
    if (zoomText) {
      zoomText.textContent = `${pct}%`;
    }
    if (slider && Number(slider.value) !== pct) {
      slider.value = pct;
    }
  }

  resetZoom() {
    this.panX = 0;
    this.panY = 0;
    this.applyZoom(1.2);
  }

  updateModePills(activeBtn) {
    const btns = this.container.querySelectorAll('.pedestal-carousel-controls .hud-pill-action-btn');
    btns.forEach(b => {
      b.classList.remove('active');
      b.classList.add('mode-btn-secondary');
    });
    activeBtn.classList.add('active');
    activeBtn.classList.remove('mode-btn-secondary');
  }

  handleLensMovement(pctX, pctY) {
    const coordsText = this.container.querySelector('#hud-coords-text');
    if (!coordsText) return;

    if (pctX === null || pctY === null) {
      coordsText.textContent = 'KOORDINAT: STANDBY | MODE: LENSA X-RAY';
      return;
    }

    coordsText.textContent = `KOORDINAT: X:${pctX.toFixed(1)}% Y:${pctY.toFixed(1)}% | SENSOR: AKTIF`;

    // Cek kedekatan dengan titik hotspot untuk memicu audio feedback
    if (!this.audioFeedback) return;
    const now = Date.now();
    if (now - this.lastBeepTime < 350) return;

    const hotspots = this.moduleData?.hotspots || [];
    for (const hs of hotspots) {
      const dx = hs.position.x - pctX;
      const dy = hs.position.y - pctY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 7) {
        this.playScannerBeep(1450, 0.08);
        this.lastBeepTime = now;
        break;
      }
    }
  }

  playScannerBeep(freq = 880, dur = 0.05) {
    if (!this.audioFeedback) return;
    try {
      if (!this.audioCtx) {
        this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);
      gain.gain.setValueAtTime(0.04, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + dur);
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start();
      osc.stop(this.audioCtx.currentTime + dur);
    } catch (e) { }
  }

  renderHotspots() {
    if (!this.magnifier) return;
    const layerEl = this.magnifier.getHotspotsContainer();
    if (!layerEl || !this.moduleData) return;

    const hotspots = this.moduleData.hotspots || [];
    layerEl.innerHTML = '';

    hotspots.forEach((hs, idx) => {
      // Filter check
      if (this.activeFilter !== 'all' && hs.categoryId !== this.activeFilter && hs.category !== this.activeFilter) {
        return;
      }

      const isVisited = this.visitedHotspots.has(hs.id);
      const isActive = this.isModalOpen && hs.id === this.currentHotspotId;
      const coords = (hs.coordsByView && hs.coordsByView[this.currentViewMode]) || hs.position;
      const isTopArea = coords.y < 28;

      const pin = document.createElement('div');
      pin.className = `body-hotspot-pin ${isActive ? 'active' : ''} ${isVisited ? 'visited' : ''} ${isTopArea ? 'tooltip-bottom' : ''}`;
      pin.dataset.id = hs.id;

      pin.style.left = `${coords.x}%`;
      pin.style.top = `${coords.y}%`;
      pin.style.position = 'absolute';
      pin.style.transform = 'translate(-50%, -50%)';

      const num = hs.badgeNum || hs.num || (idx + 1);
      const label = hs.shortName || hs.label || `Modus #${num}`;

      pin.innerHTML = `
        <div class="pin-point">
          <div class="pin-pulse-ring"></div>
        </div>
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
        e.preventDefault();
        e.stopPropagation();
        this.openHotspotDetail(hs.id);
      });

      layerEl.appendChild(pin);
    });
  }

  openHotspotDetail(hotspotId) {
    const hotspots = this.moduleData.hotspots || [];
    const hs = hotspots.find(h => h.id === hotspotId);
    if (!hs) return;

    this.currentHotspotId = hotspotId;
    this.isModalOpen = true;
    this.visitedHotspots.add(hotspotId);
    this.renderHotspots();

    const overlay = this.container.querySelector('#hotspot-card-modal-overlay');
    if (overlay) {
      overlay.classList.remove('hidden');
    }

    this.renderModalContent(hs);
    this.switchCardPage(0);

    // Record hotspot visit in progress manager & send xAPI event
    courseProgress.recordHotspotVisit('modul3', hotspotId);
    xapi.trackHotspotClick('modul3', hotspotId, hs.label, hs.categoryId || hs.category);
    this.updateProgressUI();
  }

  renderModalContent(hs) {
    const hotspots = this.moduleData.hotspots || [];
    const idx = hotspots.findIndex(h => h.id === hs.id);
    const counter = this.container.querySelector('#card-nav-counter');
    if (counter) counter.textContent = `${idx + 1} / ${hotspots.length}`;

    const badgeRow = this.container.querySelector('.detail-badge-row');
    const tagBadge = this.container.querySelector('#detail-tag-badge');
    const title = this.container.querySelector('#detail-title');

    if (badgeRow) badgeRow.className = `detail-badge-row cat-${hs.categoryId || hs.category}`;
    if (tagBadge) {
      tagBadge.textContent = `MODUS #${hs.badgeNum || String(hs.num || idx + 1).padStart(2, '0')}`;
      tagBadge.className = `detail-tag-badge cat-${hs.categoryId || hs.category}`;
    }
    if (title) title.textContent = hs.label;

    // TAB 1: Modus
    const mainImg = this.container.querySelector('#detail-real-img') || this.container.querySelector('#detail-main-img');
    const desc = this.container.querySelector('#detail-desc');
    const concealmentMethod = this.container.querySelector('#detail-method') || this.container.querySelector('#detail-concealment-method');
    const bodyLocation = this.container.querySelector('#detail-location') || this.container.querySelector('#detail-body-location');
    const drugTypes = this.container.querySelector('#detail-narcotics') || this.container.querySelector('#detail-drug-types');
    const packaging = this.container.querySelector('#detail-packaging');
    const narrative = this.container.querySelector('#detail-modus-detail') || this.container.querySelector('#detail-modus-narrative');
    const note = this.container.querySelector('#detail-inspection-note');

    if (mainImg) {
      mainImg.src = hs.mainIllustration || hs.mainImage || 'assets/images/central/m3_parcel_xray.jpeg';
      mainImg.alt = hs.label;
    }

    // Klik gambar utama pada Modus Operandi untuk memperbesar
    const illustrationBox = this.container.querySelector('#lead-img-container') || this.container.querySelector('.detail-illustration-box');
    if (illustrationBox) {
      illustrationBox.style.cursor = 'pointer';
      illustrationBox.title = 'Klik untuk melihat gambar ukuran penuh';
      illustrationBox.onclick = () => {
        const curImg = this.container.querySelector('#detail-real-img') || this.container.querySelector('#detail-main-img');
        const curTitle = this.container.querySelector('#detail-title');
        this.openImagePopup(
          curImg ? curImg.src : (hs.mainIllustration || hs.mainImage || 'assets/images/central/m3_parcel_xray.jpeg'),
          curTitle ? curTitle.textContent : hs.label
        );
      };
    }

    // Gallery Thumbnails Grid
    const galleryGrid = this.container.querySelector('#m3-gallery-thumbnails-grid');
    if (galleryGrid) {
      galleryGrid.innerHTML = '';
      const galleryList = (hs.galleryImages && hs.galleryImages.length > 0)
        ? hs.galleryImages
        : (hs.mainIllustration ? [hs.mainIllustration] : []);

      if (galleryList.length > 1) {
        galleryList.forEach((imgUrl, idx) => {
          const item = document.createElement('div');
          item.className = `finding-thumb-item ${idx === 0 ? 'active' : ''}`;
          item.style.cursor = 'pointer';
          item.title = `Foto ${idx + 1} - Klik untuk memilih`;
          item.innerHTML = `<img src="${imgUrl}" alt="Foto ${idx + 1}" style="width:52px; height:52px; object-fit:cover; border-radius:6px;" />`;
          item.onclick = (e) => {
            e.stopPropagation();
            if (mainImg) mainImg.src = imgUrl;
            galleryGrid.querySelectorAll('.finding-thumb-item').forEach(t => t.classList.remove('active'));
            item.classList.add('active');
          };
          galleryGrid.appendChild(item);
        });
        galleryGrid.style.display = 'flex';
      } else {
        galleryGrid.style.display = 'none';
      }
    }

    if (desc) desc.textContent = hs.description;
    if (concealmentMethod) concealmentMethod.textContent = hs.tag || hs.categoryLabel || 'False Compartment';
    if (bodyLocation) bodyLocation.textContent = hs.bodyLocation || 'Kardus Kiriman';
    if (drugTypes) drugTypes.textContent = hs.drugTypes || 'Metamfetamin';
    if (packaging) packaging.textContent = hs.packagingTechnique || 'Plastik Vakum';
    if (narrative) narrative.textContent = hs.modusDetail || hs.description;
    if (note) note.textContent = hs.inspectionNote || 'SOP DJBC';

    // TAB 2: Detection & SOP
    const indList = this.container.querySelector('#detail-indicators-list');
    if (indList) {
      indList.innerHTML = '';
      const indicators = hs.indicators || hs.riskIndicators || [];
      indicators.forEach(item => {
        const li = document.createElement('li');
        li.textContent = item;
        indList.appendChild(li);
      });
    }

    const detList = this.container.querySelector('#detail-detection-list');
    if (detList) {
      detList.innerHTML = '';
      const steps = hs.detection || hs.inspectionActions || [];
      steps.forEach(item => {
        const li = document.createElement('li');
        li.textContent = item;
        detList.appendChild(li);
      });
    }

    // TAB 4: Risk
    const riskScoreVal = this.container.querySelector('#risk-score-val');
    const riskBarFill = this.container.querySelector('#risk-meter-bar-fill');
    const medRisk = this.container.querySelector('#detail-medical-risk');

    const score = hs.riskScore || 90;
    const level = (hs.riskLevel || 'KRITIS').toUpperCase();
    if (riskScoreVal) riskScoreVal.textContent = `${level} (${score}/100)`;
    if (riskBarFill) riskBarFill.style.width = `${score}%`;
    if (medRisk) medRisk.textContent = hs.medicalRisk || 'BAHAYA ZAT KIMIA: Gunakan sarung tangan nitril dan masker medis saat membuka bungkusan barang bukti.';
  }

  initModals() {
    // Help modal listeners
    const btnHelp = this.container.querySelector('#btn-help-modal');
    const helpOverlay = this.container.querySelector('#help-overlay');
    const btnCloseHelp = this.container.querySelector('#btn-close-help');
    const btnOkHelp = this.container.querySelector('#btn-help-ok');

    const storageKey = 'tutorial_seen_modul3';

    const markSeen = () => {
      try {
        localStorage.setItem(storageKey, 'true');
      } catch (e) { }
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
    } catch (e) { }

    const overlay = this.container.querySelector('#hotspot-card-modal-overlay');
    const closeBtn = this.container.querySelector('#btn-close-detail-modal');
    const prevBtn = this.container.querySelector('#btn-prev-hotspot');
    const nextBtn = this.container.querySelector('#btn-next-hotspot');
    const btnPagePrev = this.container.querySelector('#btn-page-prev');
    const btnPageNext = this.container.querySelector('#btn-page-next');

    if (closeBtn && overlay) {
      closeBtn.addEventListener('click', () => {
        overlay.classList.add('hidden');
        this.isModalOpen = false;
        this.renderHotspots();
      });
    }

    // Close on overlay click outside card
    if (overlay) {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          overlay.classList.add('hidden');
          this.isModalOpen = false;
          this.renderHotspots();
        }
      });
    }

    // Quick prev/next hotspot
    prevBtn?.addEventListener('click', () => this.navigateHotspot(-1));
    nextBtn?.addEventListener('click', () => this.navigateHotspot(1));

    // Card page carousel pagination (<, dot, >)
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
        this.navigateHotspot(1);
      }
    });

    pagePills.forEach((pill, idx) => {
      pill.addEventListener('click', () => {
        this.switchCardPage(idx);
      });
    });

    // Tab buttons
    const tabBtns = this.container.querySelectorAll('#card-tabs-nav .tab-btn');
    tabBtns.forEach((btn, idx) => {
      btn.addEventListener('click', () => this.switchCardPage(idx));
    });

    // Image popup close
    const imgOverlay = this.container.querySelector('#image-popup-overlay');
    const btnCloseImg = this.container.querySelector('#btn-close-img-popup');
    btnCloseImg?.addEventListener('click', () => imgOverlay?.classList.add('hidden'));
    imgOverlay?.addEventListener('click', (e) => {
      if (e.target === imgOverlay) imgOverlay.classList.add('hidden');
    });

    // Drag-to-move floating card logic
    this.initDragCard();
  }

  initDragCard() {
    const card = this.container.querySelector('#hotspot-modal-card');
    const header = this.container.querySelector('.tabbed-modal-header');
    if (!card || !header) return;

    let isDragging = false;
    let startX = 0, startY = 0;
    let origX = 0, origY = 0;

    const onPointerDown = (e) => {
      if (e.target.closest('button')) return;
      isDragging = true;
      startX = e.clientX || e.touches?.[0]?.clientX || 0;
      startY = e.clientY || e.touches?.[0]?.clientY || 0;
      const rect = card.getBoundingClientRect();
      origX = rect.left;
      origY = rect.top;
      header.style.cursor = 'grabbing';
      e.preventDefault();
    };

    const onPointerMove = (e) => {
      if (!isDragging) return;
      const curX = e.clientX || e.touches?.[0]?.clientX || 0;
      const curY = e.clientY || e.touches?.[0]?.clientY || 0;
      const dx = curX - startX;
      const dy = curY - startY;

      card.style.position = 'fixed';
      card.style.margin = '0';
      card.style.left = `${Math.max(10, Math.min(window.innerWidth - card.offsetWidth - 10, origX + dx))}px`;
      card.style.top = `${Math.max(10, Math.min(window.innerHeight - card.offsetHeight - 10, origY + dy))}px`;
    };

    const onPointerUp = () => {
      if (!isDragging) return;
      isDragging = false;
      header.style.cursor = 'grab';
    };

    header.style.cursor = 'grab';
    header.addEventListener('mousedown', onPointerDown);
    header.addEventListener('touchstart', onPointerDown, { passive: false });
    window.addEventListener('mousemove', onPointerMove);
    window.addEventListener('touchmove', onPointerMove, { passive: false });
    window.addEventListener('mouseup', onPointerUp);
    window.addEventListener('touchend', onPointerUp);
  }

  openImagePopup(src, title) {
    const overlay = this.container.querySelector('#image-popup-overlay');
    const img = this.container.querySelector('#image-popup-img');
    const titleEl = this.container.querySelector('#image-popup-title');
    if (!overlay || !img) return;

    img.src = src;
    if (titleEl) titleEl.textContent = title || 'Foto Detail Bukti';
    overlay.classList.remove('hidden');
  }

  navigateHotspot(step) {
    const hotspots = this.moduleData?.hotspots || [];
    if (hotspots.length === 0) return;

    let curIdx = hotspots.findIndex(h => h.id === this.currentHotspotId);
    let newIdx = curIdx + step;
    if (newIdx < 0) newIdx = hotspots.length - 1;
    if (newIdx >= hotspots.length) newIdx = 0;

    this.openHotspotDetail(hotspots[newIdx].id);
  }

  switchCardPage(pageIndex) {
    this.currentCardPageIndex = pageIndex;
    const page = this.cardPages[pageIndex];
    if (!page) return;

    this.currentActiveTab = page.id;

    // Update Tab Buttons
    const tabBtns = this.container.querySelectorAll('#card-tabs-nav .tab-btn');
    tabBtns.forEach((btn, idx) => {
      if (idx === pageIndex) {
        btn.classList.add('active');
        btn.setAttribute('aria-selected', 'true');
      } else {
        btn.classList.remove('active');
        btn.setAttribute('aria-selected', 'false');
      }
    });

    // Update Tab Panes
    const panes = this.container.querySelectorAll('.tab-content-container .tab-pane');
    panes.forEach(pane => {
      if (pane.id === page.id) {
        pane.classList.add('active');
      } else {
        pane.classList.remove('active');
      }
    });

    // Sync pagination pills (<, dot, >)
    this.container.querySelectorAll('.card-page-pills .page-pill').forEach((pill, idx) => {
      if (idx === pageIndex) pill.classList.add('active');
      else pill.classList.remove('active');
    });

    const prevBtn = this.container.querySelector('#btn-page-prev');
    if (prevBtn) prevBtn.disabled = (pageIndex === 0);
  }

  stepCardPage(step) {
    const newIdx = this.currentCardPageIndex + step;
    if (newIdx >= 0 && newIdx < this.cardPages.length) {
      this.switchCardPage(newIdx);
    }
  }

  updateProgressUI() {
    const total = this.moduleData?.hotspots?.length || 7;
    const visited = this.visitedHotspots.size;
    const pct = Math.min(100, Math.round((visited / total) * 100));

    // Simpan progres modul 3
    courseProgress.setModuleProgress('modul3', pct);
    if (pct >= 100) {
      scorm.completeModule('modul3');
    }
  }

  destroy() {
    if (this.magnifier) {
      this.magnifier.destroy();
      this.magnifier = null;
    }
    if (this.audioCtx) {
      this.audioCtx.close();
      this.audioCtx = null;
    }
    super.destroy();
  }
}
