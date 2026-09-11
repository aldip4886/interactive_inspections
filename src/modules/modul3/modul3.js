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
    this.currentHotspotId = 'hs-m3-paket-organik-1';
    this.visitedHotspots = new Set();
    this.currentActiveTab = 'tab-modus';
    this.currentViewMode = 'lens'; // 'lens', 'xray', or 'normal'
    this.lensRadius = 120;
    this.activeFilter = 'all';
    this.isModalOpen = false;
    this.audioFeedback = false;
    this.audioCtx = null;
    this.magnifier = null;
    this.lastBeepTime = 0;

    this.cardPages = [
      { id: 'tab-modus', num: 1, title: 'Modus Operandi' },
      { id: 'tab-photos', num: 2, title: 'Foto Gambar Real' },
      { id: 'tab-detection', num: 3, title: 'Ciri Pelaku & SOP' },
      { id: 'tab-risk', num: 4, title: 'Indikator Risiko' }
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
    return `
      <div id="modul3-app-root">
        <!-- ─── MAIN VIEWPORT ─── -->
        <div id="modul3-viewport">

          <!-- Sub Header Bar (Stitch Forensic Module Strip) -->
          <div id="modul3-top-bar" class="modul1-top-bar">
            <div class="nav-left">
              <div class="header-breadcrumb">
                <span class="modul-code-badge font-code-tech">MODUL 03</span>
                <span class="course-main-title">Pemeriksaan Barang Kiriman (Postal & Courier Cargo)</span>
                <span class="breadcrumb-separator">•</span>
                <span class="modul-ref-tag font-code-tech">PMK-188/2021 & S-39/BC/2023</span>
              </div>
            </div>

            <div class="nav-right">
              <!-- Angle Instruction Tag -->
              <div class="angle-instruction-tag">
                <span class="instruction-dot">●</span>
                <span>Hover lensa kaca pembesar atau klik hotspot untuk menganalisis anomali kargo</span>
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
                  <div class="hud-line-title">STASIUN PEMINDAIAN KARGO POS & PJT DUAL-ENERGY</div>
                  <div class="hud-line-sub">TARGET ID: PARCEL-EXP-9912 / KARTON POS & CARGO</div>
                </div>
                <div class="forensic-hud-top-right font-code-tech">
                  <div class="hud-line-azimuth" id="hud-sensor-text">SENSOR: DUAL-ENERGY TRANSMISSION (160 kV)</div>
                  <div class="hud-line-status" id="hud-coords-text">KOORDINAT: STANDBY | MODE: LENSA X-RAY</div>
                </div>
              </div>

              <!-- Central Active Cargo Image Container with Magnifier Stage (Centered Horizontally) -->
              <div class="body-image-container" id="cargo-image-container">
                <div class="cargo-scanner-stage-wrapper" id="m3-scanner-stage"></div>
                <div class="body-pedestal-platform"></div>
              </div>

              <!-- Floating HUD Segmented Pill Controls Dock (Center Bottom) -->
              <div class="pedestal-rotation-dock" id="pedestal-rotation-dock">
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
                    <input type="range" id="lens-radius-slider" min="80" max="220" value="120" />
                    <span id="lens-radius-label" class="hud-angle-indicator font-code-tech" style="min-width:38px;">120px</span>
                  </div>

                  <div class="hud-pill-divider"></div>

                  <!-- Audio Bip Toggle Button -->
                  <button id="btn-toggle-audio" class="pedestal-ctrl-btn" title="Aktifkan / Nonaktifkan Efek Suara Sensor Pemindai" aria-label="Suara Pemindai">
                    <span id="audio-icon">🔊</span>
                  </button>
                </div>

                <!-- Density Color Palette Legend (Moved below controls dock) -->
                <div class="density-palette-strip" aria-label="Legenda Warna Densitas Material X-Ray">
                  <span style="font-weight: 700; color: #00E5FF; margin-right: 4px;">DENSITAS MATERIAL:</span>
                  <div class="density-palette-item">
                    <span class="density-dot orange"></span>
                    <span>Oranye / Cokelat: <strong>Organik / Narkotika</strong></span>
                  </div>
                  <div class="density-palette-item">
                    <span class="density-dot green"></span>
                    <span>Hijau: <strong>Campuran / Anorganik</strong></span>
                  </div>
                  <div class="density-palette-item">
                    <span class="density-dot blue"></span>
                    <span>Biru / Hitam: <strong>Logam Tebal</strong></span>
                  </div>
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
                    <img id="detail-main-img" src="assets/images/central/m3_parcel_xray.jpeg" alt="Visualisasi Modus Barang Kiriman" class="detail-main-img" />
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
                  <span class="guide-title">Catatan Penindakan DJBC:</span>
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
                  <strong>Penting:</strong> Dokumentasi penindakan riil dan citra radiologis pemindai kargo resmi DJBC.
                </div>
              </div>

              <!-- TAB 3: DETEKSI & SOP -->
              <div class="tab-pane" id="tab-detection">
                <div class="detection-two-columns">
                  <div class="info-block-col block-warning" id="block-indicators">
                    <div class="block-header">
                      <span class="block-icon warning-icon">⚠️</span>
                      <span class="block-title">Indikator Anomali & Red Flags X-Ray</span>
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
                    <span id="risk-score-val" class="risk-meter-score">KRITIS (95/100)</span>
                  </div>
                  <div class="risk-meter-bar-track">
                    <div id="risk-meter-bar-fill" class="risk-meter-bar-fill" style="width: 95%;"></div>
                  </div>
                  <div class="risk-meter-scale">
                    <span>Rendah (0)</span>
                    <span>Sedang (50)</span>
                    <span>Tinggi (75)</span>
                    <span>Kritis (100)</span>
                  </div>
                </div>

                <div class="danger-alerts-container">
                  <div class="medical-risk-box">
                    <div class="med-risk-header">
                      <span class="med-risk-icon">⚠️</span>
                      <span class="med-risk-title">Protokol Keselamatan Petugas Pemeriksa:</span>
                    </div>
                    <p id="detail-medical-risk" class="med-risk-text"></p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Modal Footer Controls -->
            <div class="tabbed-modal-footer">
              <div class="footer-page-stepper">
                <button id="btn-page-prev" class="footer-step-btn" title="Halaman Sebelumnya">‹ Tab Sebelumnya</button>
                <span id="footer-page-indicator" class="footer-page-indicator">Hal 1 dari 4: Modus</span>
                <button id="btn-page-next" class="footer-step-btn" title="Halaman Berikutnya">Tab Berikutnya ›</button>
              </div>
            </div>
          </div>
        </div>

        <!-- ─── HELP / PANDUAN MODAL ─── -->
        <div id="help-overlay" class="modal-overlay hidden" role="dialog" aria-modal="true">
          <div class="modal-card help-modal-card">
            <div class="modal-header">
              <h3>Panduan Simulator Pemindai X-Ray Kargo Pos & PJT</h3>
              <button id="btn-close-help" class="modal-close-btn" aria-label="Tutup Panduan">✕</button>
            </div>
            <div class="modal-body help-modal-body">
              <div class="help-step-item">
                <div class="help-step-icon">🔍</div>
                <div class="help-step-text">
                  <h4>Lensa Kaca Pembesar X-Ray</h4>
                  <p>Arahkan kursor mouse (atau sentuh dan geser jari pada tablet/ponsel) ke atas kardus kargo untuk memindai isi dalam paket.</p>
                </div>
              </div>
              <div class="help-step-item">
                <div class="help-step-icon">🎯</div>
                <div class="help-step-text">
                  <h4>Klik Hotspot Anomali</h4>
                  <p>Klik titik hotspot bernomor untuk membuka kartu analisis modus operandi, bukti forensik, dan SOP penindakan Bea Cukai.</p>
                </div>
              </div>
              <div class="help-step-item">
                <div class="help-step-icon">⚡</div>
                <div class="help-step-text">
                  <h4>Mode Tampilan & Slider Radius</h4>
                  <p>Gunakan tombol dok bawah untuk berpindah ke mode Full X-Ray atau mengatur luas area lingkaran lensa pembesar.</p>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button id="btn-help-ok" class="btn-primary" style="margin-left: auto;">Mengerti & Mulai Simulasi</button>
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
    } catch (e) {}
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

      const pin = document.createElement('div');
      pin.className = `body-hotspot-pin ${isActive ? 'active' : ''} ${isVisited ? 'visited' : ''}`;
      pin.dataset.id = hs.id;
      
      const coords = (hs.coordsByView && hs.coordsByView[this.currentViewMode]) || hs.position;
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
      tagBadge.textContent = `MODUS #${hs.num || String(idx + 1).padStart(2, '0')}`;
      tagBadge.className = `detail-tag-badge cat-${hs.categoryId || hs.category}`;
    }
    if (title) title.textContent = hs.label;

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
      mainImg.src = hs.mainIllustration || hs.mainImage || 'assets/images/central/m3_parcel_xray.jpeg';
      mainImg.alt = hs.label;
    }

    // Klik gambar utama pada Modus Operandi untuk memperbesar
    const illustrationBox = this.container.querySelector('.detail-illustration-box');
    if (illustrationBox) {
      illustrationBox.style.cursor = 'pointer';
      illustrationBox.title = 'Klik untuk melihat gambar ukuran penuh';
      illustrationBox.onclick = () => {
        const curImg = this.container.querySelector('#detail-main-img');
        const curTitle = this.container.querySelector('#detail-title');
        this.openImagePopup(
          curImg ? curImg.src : (hs.mainIllustration || hs.mainImage || 'assets/images/central/m3_parcel_xray.jpeg'),
          curTitle ? curTitle.textContent : hs.label
        );
      };
    }

    if (desc) desc.textContent = hs.description;
    if (concealmentMethod) concealmentMethod.textContent = hs.tag || hs.categoryLabel || 'False Compartment';
    if (bodyLocation) bodyLocation.textContent = hs.bodyLocation || 'Kardus Kiriman';
    if (drugTypes) drugTypes.textContent = hs.drugTypes || 'Metamfetamin';
    if (packaging) packaging.textContent = hs.packagingTechnique || 'Plastik Vakum';
    if (narrative) narrative.textContent = hs.modusDetail || hs.description;
    if (note) note.textContent = hs.inspectionNote || 'SOP DJBC';

    // TAB 2: Foto Real
    const findingsGrid = this.container.querySelector('#findings-thumbnails-grid');
    if (findingsGrid) {
      findingsGrid.innerHTML = '';
      const findingsList = (hs.galleryImages && hs.galleryImages.length > 0)
        ? hs.galleryImages.map(img => ({ full: img, thumb: img, caption: hs.label, tag: hs.badge || 'Barang Bukti' }))
        : [{ full: hs.mainImage || 'assets/images/central/m3_parcel_xray.jpeg', thumb: hs.mainImage || 'assets/images/central/m3_parcel_xray.jpeg', caption: hs.label, tag: hs.badge || 'Barang Bukti' }];

      findingsList.forEach(f => {
        const item = document.createElement('div');
        item.className = 'finding-thumb-item';
        item.setAttribute('role', 'button');
        item.setAttribute('tabindex', '0');
        item.setAttribute('title', `Klik untuk memperbesar: ${f.caption}`);
        item.style.cursor = 'pointer';
        item.innerHTML = `
          <img src="${f.thumb || f.full}" alt="${f.caption}" onerror="this.src='assets/images/central/m3_parcel_xray.jpeg'" />
          <span class="finding-thumb-label">${f.tag || 'Barang Bukti'}</span>
        `;
        item.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.openImagePopup(f.full || f.thumb, `${f.caption} — [${f.tag || 'Barang Bukti'}]`);
        });
        findingsGrid.appendChild(item);
      });
    }

    // TAB 3: Detection & SOP
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

    // Card page stepper
    btnPagePrev?.addEventListener('click', () => this.stepCardPage(-1));
    btnPageNext?.addEventListener('click', () => this.stepCardPage(1));

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

    // Update Footer Stepper
    const indicator = this.container.querySelector('#footer-page-indicator');
    const prevBtn = this.container.querySelector('#btn-page-prev');
    const nextBtn = this.container.querySelector('#btn-page-next');

    if (indicator) indicator.textContent = `Hal ${page.num} dari ${this.cardPages.length}: ${page.title}`;
    if (prevBtn) prevBtn.disabled = (pageIndex === 0);
    if (nextBtn) nextBtn.disabled = (pageIndex === this.cardPages.length - 1);
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
