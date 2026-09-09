import { BaseModuleView } from '../../core/base-module.js';
import { scorm } from '../../core/scorm.js';
import { xapi } from '../../core/xapi.js';
import { courseProgress } from '../../core/progress.js';

export class Modul2View extends BaseModuleView {
  constructor(container) {
    super(container, 'src/data/modul2-interactive-hotspots.json');
    this.currentHotspotId = 'hs-m2-koper-tas';
    this.visitedHotspots = new Set();
    this.currentActiveTab = 'tab-modus';
    this.currentViewMode = 'xray'; // 'xray' or 'normal'
    this.activeFilter = 'all';
    this.isModalOpen = false;
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

    // Setup interactive elements & listeners
    this.initInteractiveViewer();
    this.initModals();
    this.updateProgressUI();

    // Track xAPI module view
    xapi.trackModuleView('modul2', 'Modul 2: Penyelundupan Melalui Barang Bawaan (Luggage Concealment)');
  }

  getTemplateHTML() {
    const modPct = courseProgress.getModuleProgress('modul2');
    const categories = this.moduleData.categories || [];

    return `
      <div id="modul2-app-root">
        <!-- ─── MAIN VIEWPORT ─── -->
        <div id="modul2-viewport">

          <!-- Sub Header Bar (Stitch Forensic Module Strip) -->
          <div id="modul2-top-bar" class="modul1-top-bar">
            <div class="nav-left">
              <div class="header-breadcrumb">
                <span class="modul-code-badge font-code-tech">MODUL 02</span>
                <span class="course-main-title">Pemeriksaan Barang Bawaan (Luggage Concealment)</span>
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
                <span class="angle-deg font-code-tech" id="view-mode-badge">X-RAY SCANNER</span>
                <span class="angle-sep">•</span>
                <span class="angle-name" id="view-mode-title">Pemeriksaan Koper Bagasi (X-Ray)</span>
                <span class="angle-sub" id="view-mode-sub">(Koper Trolley & Barang Bawaan)</span>
              </div>
              <div class="angle-instruction-tag">
                <span class="instruction-dot">●</span>
                <span>Klik hotspot bernomor untuk menganalisis modus operandi & bukti forensik</span>
              </div>
            </div>

            <!-- Luggage Canvas Wrapper with Technical Forensic Grid & HUD Overlay -->
            <div class="body-canvas-wrapper" id="luggage-canvas-wrapper">

              <!-- Technical Forensic Grid Background Overlay -->
              <div class="forensic-grid-background" aria-hidden="true"></div>

              <!-- HUD Telemetry Watermark Overlay -->
              <div class="forensic-hud-telemetry" aria-hidden="true">
                <div class="forensic-hud-top-left font-code-tech">
                  <div class="hud-line-title">STASIUN PEMINDAIAN BARANG BAWAAN DUAL-ENERGY</div>
                  <div class="hud-line-sub">SUBJEK ID: SUSPECT-LUGGAGE-8812 / KOPER BAGASI</div>
                </div>
                <div class="forensic-hud-top-right font-code-tech">
                  <div class="hud-line-azimuth" id="hud-azimuth-text">MODE AKTIF: SCANNER X-RAY HI-PENETRATION</div>
                  <div class="hud-line-status">SENSOR: DUAL-ENERGY TRANSMISSION X-RAY</div>
                </div>
              </div>

              <!-- Central Active Luggage Image Container with Hotspots Layer -->
              <div class="body-image-container" id="luggage-image-container" style="max-width:850px; aspect-ratio: auto; margin:0 auto;">
                <img id="m2-central-image" src="assets/images/central/m2_luggage_xray.png" 
                     alt="X-Ray Scanner Koper Bagasi Bawaan" 
                     class="main-body-img"
                     style="max-height: 68vh; filter: drop-shadow(0 12px 32px rgba(0, 37, 59, 0.16)); pointer-events:none;" />
                <div class="body-pedestal-platform"></div>
                <div id="m2-hotspots-layer" class="hotspots-layer"></div>
              </div>

              <!-- Floating HUD Segmented Pill Controls Dock (Center Bottom) -->
              <div class="pedestal-rotation-dock" id="pedestal-rotation-dock">
                <div class="pedestal-carousel-controls">
                  <!-- Mode Switcher Pill Buttons -->
                  <button id="btn-view-xray" class="hud-pill-action-btn active" title="Tampilan X-Ray Scanner">
                    <span class="hud-btn-icon">🔍</span>
                    <span class="hud-btn-text">X-RAY SCANNER</span>
                  </button>
                  <button id="btn-view-normal" class="hud-pill-action-btn mode-btn-secondary" title="Tampilan Tampak Normal">
                    <span class="hud-btn-icon">👜</span>
                    <span class="hud-btn-text">TAMPAK NORMAL</span>
                  </button>

                  <div class="hud-pill-divider"></div>

                  <!-- Category Filter Buttons -->
                  ${categories.map(cat => `
                    <button class="filter-btn m2-dock-filter-btn ${cat.id === 'all' ? 'active' : ''}" data-filter="${cat.id}" title="${cat.label}">
                      ${cat.icon || ''} <span>${cat.label}</span>
                    </button>
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
                  <span id="detail-cat-badge" class="detail-cat-badge">KOPER & TAS BAWAAN</span>
                </div>
                <h3 id="detail-title" class="detail-title">1. Sisi Koper & Tas Bawaan</h3>
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
                    <img id="detail-main-img" src="assets/images/hotspots/hs_sardine_can_false.png" alt="Visualisasi Modus Barang Bawaan" class="detail-main-img" />
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
                      <span class="block-title">Indikator Anomali & Red Flags X-Ray</span>
                    </div>
                    <ul id="detail-indicators-list" class="block-list"></ul>
                  </div>
                  <div class="info-block-col block-procedure" id="block-detection">
                    <div class="block-header">
                      <span class="block-icon procedure-icon">✔</span>
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
                    <span class="hazard-title">Bahaya Medis Darurat / Bahan Kimia:</span>
                    <p id="detail-medical-risk" class="hazard-desc"></p>
                  </div>
                </div>
                <div class="hazard-alert-box hazard-officer">
                  <div class="hazard-icon">🛡️</div>
                  <div class="hazard-content">
                    <span class="hazard-title">Protokol Keselamatan Petugas:</span>
                    <p class="hazard-desc">
                      Gunakan sarung tangan nitril & masker medis. Dilarang penguraian barang bukti tanpa APD resmi. Koordinasikan pengamanan BB.
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
              <h2 class="modal-heading">Panduan Penggunaan Modul Barang Bawaan</h2>
              <button id="btn-close-help" class="modal-close-btn">✕</button>
            </div>
            <div class="modal-body help-content">
              <div class="help-item">
                <strong>1. Switcher Mode Tampilan:</strong> Gunakan tombol <strong>🔍 X-Ray Scanner</strong> dan <strong>hb Tampak Normal</strong> pada dock bawah untuk berpindah citra radiologi atau visual fisik barang bawaan.
              </div>
              <div class="help-item">
                <strong>2. Filter Kategori Modus:</strong> Filter titik-titik hotspot berdasarkan jenis koper, personal items, buku, makanan, atau sepatu melalui tombol kategori pada dock bawah.
              </div>
              <div class="help-item">
                <strong>3. Titik Hotspot Interaktif:</strong> Klik nomor callout bernomor pada koper untuk menginspeksi modus penyembunyian & barang bukti.
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

  initInteractiveViewer() {
    this.renderHotspots();

    // Setup Category Filter Buttons (HUD Dock Pills)
    const filterBtns = this.container.querySelectorAll('.m2-dock-filter-btn, .filter-btn');
    filterBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        filterBtns.forEach(b => b.classList.remove('active'));
        e.currentTarget.classList.add('active');
        this.activeFilter = e.currentTarget.dataset.filter;
        this.renderHotspots();
      });
    });

    // View Mode Toggle (X-Ray vs Normal)
    const btnXray = this.container.querySelector('#btn-view-xray');
    const btnNormal = this.container.querySelector('#btn-view-normal');
    const centralImg = this.container.querySelector('#m2-central-image');
    const viewBadge = this.container.querySelector('#view-mode-badge');
    const viewTitle = this.container.querySelector('#view-mode-title');
    const azimuthText = this.container.querySelector('#hud-azimuth-text');

    if (btnXray && btnNormal && centralImg) {
      btnXray.addEventListener('click', () => {
        btnXray.classList.add('active');
        btnNormal.classList.remove('active');
        this.currentViewMode = 'xray';
        centralImg.src = 'assets/images/central/m2_luggage_xray.png';
        if (viewBadge) viewBadge.textContent = 'X-RAY SCANNER';
        if (viewTitle) viewTitle.textContent = 'Pemeriksaan Koper Bagasi (X-Ray)';
        if (azimuthText) azimuthText.textContent = 'MODE AKTIF: SCANNER X-RAY HI-PENETRATION';
        this.renderHotspots();
      });

      btnNormal.addEventListener('click', () => {
        btnNormal.classList.add('active');
        btnXray.classList.remove('active');
        this.currentViewMode = 'normal';
        centralImg.src = 'assets/images/central/m2_luggage_normal.png';
        if (viewBadge) viewBadge.textContent = 'TAMPAK NORMAL';
        if (viewTitle) viewTitle.textContent = 'Pemeriksaan Koper Bagasi (Fisik)';
        if (azimuthText) azimuthText.textContent = 'MODE AKTIF: INSPEKSI FISIK TAMPAK NORMAL';
        this.renderHotspots();
      });
    }
  }

  renderHotspots() {
    const layerEl = this.container.querySelector('#m2-hotspots-layer');
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
    courseProgress.recordHotspotVisit('modul2', hotspotId);
    xapi.trackHotspotClick('modul2', hotspotId, hs.label, hs.categoryId || hs.category);
    this.updateProgressUI();
  }

  renderModalContent(hs) {
    const hotspots = this.moduleData.hotspots || [];
    const idx = hotspots.findIndex(h => h.id === hs.id);
    const counter = this.container.querySelector('#card-nav-counter');
    if (counter) counter.textContent = `${idx + 1} / ${hotspots.length}`;

    const badgeRow = this.container.querySelector('.detail-badge-row');
    const tagBadge = this.container.querySelector('#detail-tag-badge');
    const catBadge = this.container.querySelector('#detail-cat-badge');
    const title = this.container.querySelector('#detail-title');

    if (badgeRow) badgeRow.className = `detail-badge-row cat-${hs.categoryId || hs.category}`;
    if (tagBadge) {
      tagBadge.textContent = `MODUS #${hs.num || String(idx + 1).padStart(2, '0')}`;
      tagBadge.className = `detail-tag-badge cat-${hs.categoryId || hs.category}`;
    }
    if (catBadge) {
      catBadge.textContent = (hs.categoryLabel || hs.tag || 'BARANG BAWAAN').toUpperCase();
      catBadge.className = `detail-cat-badge cat-${hs.categoryId || hs.category}`;
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
      mainImg.onerror = () => {
        mainImg.src = 'assets/mockup/image_placeholder.svg';
      };
      mainImg.src = hs.mainIllustration || hs.mainImage || hs.thumb || 'assets/mockup/image_placeholder.svg';
      mainImg.alt = hs.label;
    }
    if (desc) desc.textContent = hs.description;
    if (concealmentMethod) concealmentMethod.textContent = hs.tag || hs.categoryLabel || 'False Concealment';
    if (bodyLocation) bodyLocation.textContent = hs.bodyLocation || 'Bagasi Koper';
    if (drugTypes) drugTypes.textContent = hs.drugTypes || 'Sabu / Heroin';
    if (packaging) packaging.textContent = hs.packagingTechnique || 'Plastik Vakum';
    if (narrative) narrative.textContent = hs.modusDetail || hs.description;
    if (note) note.textContent = hs.inspectionNote || 'SOP DJBC';

    // TAB 2: Foto Real
    const findingsGrid = this.container.querySelector('#findings-thumbnails-grid');
    if (findingsGrid) {
      findingsGrid.innerHTML = '';
      const findingsList = (hs.findings && hs.findings.length > 0) ? hs.findings : [
        {
          full: 'assets/mockup/image_placeholder.svg',
          thumb: 'assets/mockup/image_placeholder.svg',
          caption: 'Dokumentasi Barang Bukti (Placeholder)',
          tag: 'PLACEHOLDER'
        }
      ];

      findingsList.forEach(f => {
        const a = document.createElement('a');
        a.href = f.full || f.thumb;
        a.className = 'finding-thumb-item glightbox';
        a.setAttribute('data-gallery', `findings-gallery-${hs.id}`);
        a.setAttribute('data-title', `${f.caption} — [${f.tag || 'Barang Bukti'}]`);
        a.innerHTML = `
          <img src="${f.thumb || f.full}" alt="${f.caption}" onerror="this.src='assets/mockup/image_placeholder.svg'" />
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

    const score = hs.riskScore || 80;
    const level = (hs.riskLevel || 'HIGH').toUpperCase();
    if (riskScoreVal) riskScoreVal.textContent = `${level} (${score}/100)`;
    if (riskBarFill) riskBarFill.style.width = `${score}%`;
    if (medRisk) medRisk.textContent = hs.medicalRisk || 'BAHAYA ZAT KIMIA BERBAHAYA: Selalu gunakan sarung tangan nitril dan masker medis saat membuka bungkusan barang bukti.';
  }

  initModals() {
    // Help modal listeners
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

    // Quick Hotspot Nav (Prev / Next)
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

    // Tab buttons
    const tabBtns = Array.from(this.container.querySelectorAll('.card-tabs-nav .tab-btn'));
    tabBtns.forEach((btn, idx) => {
      btn.addEventListener('click', () => {
        this.switchCardPage(idx);
      });
    });

    // Pagination buttons & pills
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
        // When reaching end of card pages, advance to next hotspot
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

    // Make modal card draggable
    this.initCardDraggable();
  }

  switchCardPage(pageIndex) {
    if (pageIndex < 0) pageIndex = 0;
    if (pageIndex >= this.cardPages.length) pageIndex = this.cardPages.length - 1;
    this.currentCardPageIndex = pageIndex;
    const page = this.cardPages[pageIndex];
    this.currentActiveTab = page.id;

    // Sync tab buttons
    this.container.querySelectorAll('.card-tabs-nav .tab-btn').forEach((b, idx) => {
      if (idx === pageIndex) b.classList.add('active');
      else b.classList.remove('active');
    });

    // Sync tab panes
    this.container.querySelectorAll('.tab-content-container .tab-pane').forEach(p => {
      if (p.id === page.id) p.classList.add('active');
      else p.classList.remove('active');
    });

    // Sync pagination pills
    this.container.querySelectorAll('.card-page-pills .page-pill').forEach((pill, idx) => {
      if (idx === pageIndex) pill.classList.add('active');
      else pill.classList.remove('active');
    });

    // Update prev/next button states
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
    const modPct = courseProgress.getModuleProgress('modul2');
    const pctText = this.container.querySelector('#modul2-progress-pct');
    const fillBar = this.container.querySelector('#modul2-progress-fill');

    if (pctText) pctText.textContent = `${modPct}%`;
    if (fillBar) fillBar.style.width = `${modPct}%`;
  }
}
