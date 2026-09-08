import { BaseModuleView } from '../../core/base-module.js';
import { scorm } from '../../core/scorm.js';
import { xapi } from '../../core/xapi.js';
import { QuizModule } from './anatomy3d/QuizModule.js';

export class Modul1View extends BaseModuleView {
  constructor(container) {
    super(container, 'src/data/modul1-interactive-hotspots.json');
    this.currentHotspotId = 'rongga-mulut';
    this.visitedHotspots = new Set();
    this.currentActiveTab = 'tab-modus';
    this.currentAngle = 0; // 0, 90, 180, 270
    this.currentZoom = 1.5;
    this.isModalOpen = false;
    this.isAutoPlaying = false;
    this.autoPlayTimer = null;
    this.quiz = null;
    this.glightboxInstance = null;
    this.ANGLES = [0, 90, 180, 270];
  }

  async render() {
    await this.loadData();
    if (!this.moduleData) return;

    this.container.innerHTML = this.getTemplateHTML();

    // Setup subcomponents & interactivity
    this.initInteractiveViewer();
    this.initModals();
    this.initQuiz();
    this.updateProgressUI();

    // Track xAPI module view
    xapi.trackModuleView('modul1', 'Modul 1: Penyelundupan Melalui Tubuh Kurir');
  }

  getTemplateHTML() {
    return `
      <div id="modul1-app-root">
        <!-- ─── 1. INNER HOTSPOT NAVIGATION SIDEBAR ─── -->
        <aside id="modul1-sidebar">
          <div class="sidebar-header">
            <div class="sidebar-brand-badge">
              <svg class="djbc-crest-icon" viewBox="0 0 48 48" width="28" height="28" fill="none">
                <circle cx="24" cy="24" r="22" fill="#0B2C6E" stroke="#F5A623" stroke-width="2"/>
                <path d="M24 8L33 20H15L24 8Z" fill="#F5A623"/>
                <path d="M24 40L15 28H33L24 40Z" fill="#F5A623"/>
                <circle cx="24" cy="24" r="7" fill="#FFFFFF"/>
                <path d="M24 19L25.5 22.5H29L26 24.8L27.2 28.5L24 26.2L20.8 28.5L22 24.8L19 22.5H22.5L24 19Z" fill="#0B2C6E"/>
              </svg>
              <div class="brand-titles">
                <span class="brand-inst">KEMENTERIAN KEUANGAN RI</span>
                <h2 class="brand-org">DIREKTORAT JENDERAL BEA DAN CUKAI</h2>
              </div>
            </div>
            <div class="sidebar-course-tag">8 TITIK MODUS DI TUBUH KURIR</div>
          </div>

          <nav class="sidebar-nav">
            <div class="nav-section-title">8 TITIK CONCEALMENT</div>
            <div class="sidebar-hotspots-accordion">

              <!-- Kategori 1: Metode Ingestion -->
              <div class="sidebar-cat-group">
                <div class="sidebar-cat-title">
                  <span class="cat-badge-dot ingestion"></span>
                  <span>METODE INGESTION</span>
                </div>
                <ul class="sidebar-hotspot-list">
                  <li class="sidebar-hotspot-item active" data-hotspot-id="rongga-mulut">
                    <span class="hs-badge-num">1</span>
                    <span class="hs-label">Rongga Mulut</span>
                    <span class="hs-angle-tag">0°</span>
                  </li>
                  <li class="sidebar-hotspot-item" data-hotspot-id="lambung">
                    <span class="hs-badge-num">2</span>
                    <span class="hs-label">Lambung</span>
                    <span class="hs-angle-tag">0°</span>
                  </li>
                </ul>
              </div>

              <!-- Kategori 2: Metode Insertion -->
              <div class="sidebar-cat-group">
                <div class="sidebar-cat-title">
                  <span class="cat-badge-dot insertion"></span>
                  <span>METODE INSERTION</span>
                </div>
                <ul class="sidebar-hotspot-list">
                  <li class="sidebar-hotspot-item" data-hotspot-id="anal-anus">
                    <span class="hs-badge-num">3</span>
                    <span class="hs-label">Pada Anal / Anus</span>
                    <span class="hs-angle-tag">180°</span>
                  </li>
                </ul>
              </div>

              <!-- Kategori 3: Metode Body Strapping -->
              <div class="sidebar-cat-group">
                <div class="sidebar-cat-title">
                  <span class="cat-badge-dot strapping"></span>
                  <span>BODY STRAPPING (LAKBAN)</span>
                </div>
                <ul class="sidebar-hotspot-list">
                  <li class="sidebar-hotspot-item" data-hotspot-id="strapping-paha">
                    <span class="hs-badge-num">4</span>
                    <span class="hs-label">Pada Paha</span>
                    <span class="hs-angle-tag">270°</span>
                  </li>
                  <li class="sidebar-hotspot-item" data-hotspot-id="strapping-betis">
                    <span class="hs-badge-num">5</span>
                    <span class="hs-label">Betis</span>
                    <span class="hs-angle-tag">90°</span>
                  </li>
                  <li class="sidebar-hotspot-item" data-hotspot-id="strapping-perut">
                    <span class="hs-badge-num">6</span>
                    <span class="hs-label">Perut</span>
                    <span class="hs-angle-tag">180°</span>
                  </li>
                </ul>
              </div>

              <!-- Kategori 4: Body-Adjacent Concealment -->
              <div class="sidebar-cat-group">
                <div class="sidebar-cat-title">
                  <span class="cat-badge-dot adjacent"></span>
                  <span>BODY-ADJACENT</span>
                </div>
                <ul class="sidebar-hotspot-list">
                  <li class="sidebar-hotspot-item" data-hotspot-id="vagina-pembalut">
                    <span class="hs-badge-num">7</span>
                    <span class="hs-label">Pada Vagina (Pembalut)</span>
                    <span class="hs-angle-tag">0°</span>
                  </li>
                  <li class="sidebar-hotspot-item" data-hotspot-id="prostetik-gips">
                    <span class="hs-badge-num">8</span>
                    <span class="hs-label">Bagian Prostetik / Gips Palsu</span>
                    <span class="hs-angle-tag">0°</span>
                  </li>
                </ul>
              </div>

            </div>
          </nav>

          <div class="sidebar-footer">
            <div class="customs-badge-card">
              <img src="assets/mockup/sidebar_customs_bg.png" alt="Customs Border Protection" class="customs-footer-img" />
              <div class="customs-caption">
                <span class="cbp-title">CUSTOMS BORDER PROTECTION</span>
                <span class="cbp-sub">Mengawasi • Melindungi • Melayani</span>
              </div>
            </div>
          </div>
        </aside>

        <!-- ─── 2. MAIN VIEWPORT ─── -->
        <div id="modul1-viewport">

          <!-- Sub Header Bar -->
          <div id="modul1-top-bar">
            <div class="nav-left">
              <button id="btn-toggle-mod1-sidebar" class="icon-btn" title="Buka/Tutup Menu Hotspot" aria-label="Toggle Sidebar">
                <span>☰</span>
              </button>
              <div class="header-breadcrumb">
                <span class="course-main-title">Penanganan Penyelundupan Narkotika</span>
                <span class="breadcrumb-separator">|</span>
                <span class="course-sub-title">Modul 1: Modus di Tubuh Kurir</span>
              </div>
            </div>

            <div class="nav-right">
              <!-- Module Progress Widget -->
              <div class="module-progress-widget">
                <div class="progress-info-row">
                  <span class="progress-title">Progres Modul:</span>
                  <span id="progress-percentage-text" class="progress-value">12%</span>
                </div>
                <div class="progress-track">
                  <div id="progress-fill-bar" class="progress-fill" style="width: 12%;"></div>
                </div>
              </div>

              <!-- Kuis Button -->
              <button class="quiz-nav-pill-btn" id="btn-open-quiz" title="Latihan Soal Penilaian Kompetensi">
                <span class="pill-icon">📝</span>
                <span>Kuis Penilaian</span>
              </button>

              <!-- Help Button -->
              <button id="btn-help-modal" class="icon-btn circle-btn" title="Panduan Penggunaan">
                <span>?</span>
              </button>
            </div>
          </div>

          <!-- Rotatable Body Stage -->
          <div class="rotatable-body-view">

            <!-- Angle Header Bar -->
            <div class="angle-header-bar">
              <div class="current-angle-badge" id="current-angle-badge">
                <span class="angle-deg" id="angle-deg-text">0°</span>
                <span class="angle-sep">•</span>
                <span class="angle-name" id="angle-name-text">Tampak Depan</span>
                <span class="angle-sub" id="angle-sub-text">(Organ Pencernaan & Dada)</span>
              </div>
              <div class="angle-instruction-tag">
                <span>Klik hotspot bernomor untuk melihat rincian modus operandi</span>
              </div>
            </div>

            <!-- Body Canvas Wrapper -->
            <div class="body-canvas-wrapper" id="body-canvas-wrapper">

              <!-- Zoom Dock (Bottom Left) -->
              <div class="camera-zoom-dock" id="camera-zoom-dock">
                <button id="btn-zoom-in" class="zoom-ctrl-btn" title="Perbesar (Zoom In)" aria-label="Zoom In">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                </button>
                <span id="zoom-level-text" class="zoom-level-badge">150%</span>
                <button id="btn-zoom-out" class="zoom-ctrl-btn" title="Perkecil (Zoom Out)" aria-label="Zoom Out">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                </button>
                <button id="btn-zoom-reset" class="zoom-ctrl-btn reset-btn" title="Reset Zoom (150%)" aria-label="Reset Zoom">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><polyline points="3 3 3 8 8 8"></polyline></svg>
                </button>
              </div>

              <!-- Central Active Body Image with Hotspots Layer -->
              <div class="body-image-container" id="body-image-container">
                <img src="assets/body_views/body_view_0_front.png" alt="Anatomi Tubuh Peraga Manusia" id="main-body-img" class="main-body-img" />
                <div class="body-pedestal-platform"></div>
                <div id="hotspots-layer" class="hotspots-layer"></div>
              </div>

              <!-- Pedestal Rotation Control Dock (Center Bottom) -->
              <div class="pedestal-rotation-dock" id="pedestal-rotation-dock">
                <div class="pedestal-rotate-hint">
                  <span>⟲ 360° Seret untuk memutar model. ⟳</span>
                </div>
                <div class="pedestal-carousel-controls">
                  <button id="btn-carousel-prev" class="pedestal-ctrl-btn" title="Putar ke sudut sebelumnya" aria-label="Sudut Sebelumnya">‹</button>
                  <button id="btn-carousel-play" class="pedestal-ctrl-btn btn-play" title="Auto-play putar model 360° secara kontinu" aria-label="Auto-Play 360°">
                    <span id="play-pause-icon">▶</span>
                  </button>
                  <button id="btn-carousel-next" class="pedestal-ctrl-btn" title="Putar ke sudut berikutnya" aria-label="Sudut Berikutnya">›</button>
                </div>
              </div>

            </div>

          </div>

        </div>
      </div>

      <!-- ─── 3. TABBED HOTSPOT CARD MODAL ─── -->
      <div id="hotspot-card-modal-overlay" class="modal-overlay hidden" role="dialog" aria-modal="true">
        <div id="hotspot-modal-card" class="modal-card tabbed-hotspot-modal">
          <div class="modal-header tabbed-modal-header">
            <div class="modal-header-left">
              <div class="detail-badge-row">
                <span id="detail-tag-badge" class="detail-tag-badge">MODUS #01</span>
                <span id="detail-cat-badge" class="detail-cat-badge">METODE INGESTION</span>
              </div>
              <h3 id="detail-title" class="detail-title">1. Rongga Mulut</h3>
              <p id="detail-subtitle" class="detail-subtitle">Metode Ingestion: Penyelundupan paket narkotika di rongga mulut.</p>
            </div>
            <div class="modal-header-right">
              <div class="card-quick-nav">
                <button id="btn-prev-hotspot" class="card-nav-arrow-btn" title="Modus Sebelumnya">←</button>
                <span id="card-nav-counter" class="card-nav-counter">1 / 8</span>
                <button id="btn-next-hotspot" class="card-nav-arrow-btn" title="Modus Berikutnya">→</button>
              </div>
              <button id="btn-close-detail-modal" class="modal-close-btn" aria-label="Tutup Kartu">✕</button>
            </div>
          </div>

          <div class="card-tabs-nav" id="card-tabs-nav">
            <button class="tab-btn active" data-tab="tab-modus">
              <span class="tab-icon">📋</span>
              <span class="tab-label">Modus Operandi</span>
            </button>
            <button class="tab-btn" data-tab="tab-photos">
              <span class="tab-icon">📷</span>
              <span class="tab-label">Foto Gambar Real</span>
            </button>
            <button class="tab-btn" data-tab="tab-detection">
              <span class="tab-icon">🔍</span>
              <span class="tab-label">Ciri Pelaku & SOP</span>
            </button>
            <button class="tab-btn" data-tab="tab-risk">
              <span class="tab-icon">🚨</span>
              <span class="tab-label">Indikator Risiko</span>
            </button>
          </div>

          <div class="tab-content-container" id="tab-content-container">
            <!-- TAB 1: MODUS -->
            <div class="tab-pane active" id="tab-modus">
              <div class="detail-media-row">
                <div class="detail-illustration-box">
                  <img id="detail-main-img" src="assets/mockup/card_digestive_main.png" alt="Visualisasi Organ Modus" class="detail-main-img" />
                </div>
                <div class="detail-desc-box">
                  <p id="detail-desc" class="detail-desc-text"></p>
                </div>
              </div>
              <div class="modus-params-grid">
                <div class="param-box">
                  <span class="param-label">Metode Concealment:</span>
                  <p id="detail-concealment-method" class="param-val"></p>
                </div>
                <div class="param-box">
                  <span class="param-label">Lokasi Detail Tubuh:</span>
                  <p id="detail-body-location" class="param-val"></p>
                </div>
                <div class="param-box">
                  <span class="param-label">Jenis Narkotika Lazim:</span>
                  <p id="detail-drug-types" class="param-val"></p>
                </div>
                <div class="param-box">
                  <span class="param-label">Teknik Pengemasan:</span>
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
                <span class="photos-tab-title">Dokumentasi Realita Barang Bukti & Citra Forensik:</span>
                <span class="photos-tab-hint">Klik gambar untuk melihat resolusi penuh & zoom</span>
              </div>
              <div class="findings-thumbnails-grid" id="findings-thumbnails-grid"></div>
              <div class="gallery-case-note">
                <strong>Penting:</strong> Seluruh gambar merupakan dokumentasi kasus penindakan riil dan citra radiologis forensik resmi DJBC dan mitra penegak hukum internasional.
              </div>
            </div>

            <!-- TAB 3: DETEKSI & SOP -->
            <div class="tab-pane" id="tab-detection">
              <div class="detection-two-columns">
                <div class="info-block-col block-warning" id="block-indicators">
                  <div class="block-header">
                    <span class="block-icon warning-icon">⚠️</span>
                    <span class="block-title">Indikator Tingkah Laku & Fisik</span>
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

            <!-- TAB 4: RISIKO -->
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
                  <span class="hazard-title">Bahaya Medis Darurat bagi Tersangka:</span>
                  <p id="detail-medical-risk" class="hazard-desc"></p>
                </div>
              </div>
              <div class="hazard-alert-box hazard-officer">
                <div class="hazard-icon">🛡️</div>
                <div class="hazard-content">
                  <span class="hazard-title">Protokol Keselamatan & Hukum Petugas:</span>
                  <p class="hazard-desc">
                    Gunakan sarung tangan nitril standar. Dilarang keras melakukan pemeriksaan fisik internal invasif rongga tubuh tanpa tenaga medis resmi. Hubungi dokter rujukan dan koordinasikan pengamanan barang bukti.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button id="btn-modal-close-footer" class="btn-outline-action">Tutup Kartu</button>
          </div>
        </div>
      </div>

      <!-- ─── 4. QUIZ MODAL ─── -->
      <div id="quiz-overlay" class="modal-overlay hidden" role="dialog" aria-modal="true">
        <div id="quiz-card" class="modal-card">
          <div class="modal-header">
            <div class="modal-title-wrap">
              <span class="modal-badge">MODUL 1: LATIHAN SOAL</span>
              <h2 class="modal-heading">Kuis Penilaian Kompetensi Petugas DJBC</h2>
            </div>
            <button id="btn-close-quiz" class="modal-close-btn" aria-label="Tutup Kuis">✕</button>
          </div>
          <div class="modal-progress-bar">
            <div id="quiz-progress-fill" class="modal-progress-fill" style="width: 10%;"></div>
          </div>
          <div class="modal-body">
            <div class="question-header">
              <span id="quiz-progress-label" class="question-count">Soal 1 / 10</span>
              <span id="quiz-category-tag" class="question-category">Saluran Cerna & Body Packing</span>
            </div>
            <h3 id="quiz-question" class="quiz-question-text"></h3>
            <div id="quiz-options" class="quiz-options-list"></div>
            <div id="quiz-feedback" class="quiz-feedback-box hidden"></div>
          </div>
          <div class="modal-footer">
            <button id="quiz-next-btn" class="btn-primary-action hidden">Soal Berikutnya →</button>
            <button id="quiz-submit-btn" class="btn-primary-action hidden">Selesai & Lihat Skor Penilaian</button>
          </div>
        </div>
      </div>

      <!-- ─── 5. RESULT MODAL ─── -->
      <div id="result-overlay" class="modal-overlay hidden" role="dialog" aria-modal="true">
        <div id="result-card" class="modal-card result-box">
          <div id="result-icon" class="result-crest">🏆</div>
          <h2 id="result-title" class="result-title">Hasil Penilaian Kompetensi</h2>
          <div id="result-score-display" class="result-score">80 / 100</div>
          <p id="result-message" class="result-msg">Selamat! Anda telah memahami modul modus penyelundupan narkotika di badan kurir.</p>
          <div class="result-actions-row">
            <button id="btn-retry-quiz" class="btn-outline-action">Ulangi Kuis</button>
            <button id="btn-review" class="btn-primary-action">Kembali ke Pembelajaran</button>
          </div>
        </div>
      </div>

      <!-- ─── 6. HELP MODAL ─── -->
      <div id="help-overlay" class="modal-overlay hidden" role="dialog" aria-modal="true">
        <div class="modal-card help-box">
          <div class="modal-header">
            <h2 class="modal-heading">Panduan Penggunaan Modul Interaktif</h2>
            <button id="btn-close-help" class="modal-close-btn">✕</button>
          </div>
          <div class="modal-body help-content">
            <div class="help-item">
              <strong>1. Rotasi Navigasi Tubuh:</strong> Gunakan tombol kontrol <strong>‹</strong>, <strong>▶</strong>, dan <strong>›</strong> di bawah model, atau usap/drag langsung pada model untuk memutar sudut peraga anatomi 360° (Depan 0°, Kanan 90°, Belakang 180°, Kiri 270°).
            </div>
            <div class="help-item">
              <strong>2. Titik Hotspot Interaktif:</strong> Klik nomor callout pada tubuh untuk membuka kartu detail modus operandi.
            </div>
            <div class="help-item">
              <strong>3. Format Tabbed Card:</strong> Jelajahi informasi lengkap melalui 4 tab: <em>Modus Operandi</em>, <em>Foto Gambar Real</em>, <em>Ciri Pelaku & SOP</em>, dan <em>Indikator Risiko</em>.
            </div>
            <div class="help-item">
              <strong>4. Galeri Foto Barang Bukti:</strong> Klik thumbnail foto untuk membuka pratinjau resolusi tinggi dengan zoom.
            </div>
            <div class="help-item">
              <strong>5. Kuis Penilaian:</strong> Kerjakan latihan soal kompetensi untuk menguji pemahaman Anda.
            </div>
          </div>
          <div class="modal-footer">
            <button id="btn-help-ok" class="btn-primary-action">Mengerti</button>
          </div>
        </div>
      </div>
    `;
  }

  initInteractiveViewer() {
    this.setupSidebarNav();
    this.setupRotationControls();
    this.setupZoomControls();
    this.setupDetailModal();

    // Initial angle & zoom 150%
    this.setBodyAngle(0);
    this.applyZoom(1.5);
  }

  setupSidebarNav() {
    const toggleBtn = this.container.querySelector('#btn-toggle-mod1-sidebar');
    const sidebar = this.container.querySelector('#modul1-sidebar');

    toggleBtn?.addEventListener('click', () => {
      sidebar.classList.toggle('collapsed');
    });

    const hotspotItems = this.container.querySelectorAll('.sidebar-hotspot-item');
    hotspotItems.forEach(item => {
      item.addEventListener('click', () => {
        const id = item.getAttribute('data-hotspot-id');
        if (id) {
          this.openHotspotModal(id, true);
        }
      });
    });
  }

  setupRotationControls() {
    const btnPrev = this.container.querySelector('#btn-carousel-prev');
    const btnPlay = this.container.querySelector('#btn-carousel-play');
    const btnNext = this.container.querySelector('#btn-carousel-next');
    const canvasWrap = this.container.querySelector('#body-canvas-wrapper');

    btnPrev?.addEventListener('click', () => {
      this.stopAutoPlay();
      const idx = this.ANGLES.indexOf(this.currentAngle);
      const prevIdx = (idx - 1 + this.ANGLES.length) % this.ANGLES.length;
      this.setBodyAngle(this.ANGLES[prevIdx]);
    });

    btnPlay?.addEventListener('click', () => {
      this.toggleAutoPlay();
    });

    btnNext?.addEventListener('click', () => {
      this.stopAutoPlay();
      const idx = this.ANGLES.indexOf(this.currentAngle);
      const nextIdx = (idx + 1) % this.ANGLES.length;
      this.setBodyAngle(this.ANGLES[nextIdx]);
    });

    // Drag / Swipe 360 interaction
    let isDragging = false;
    let startX = 0;

    canvasWrap?.addEventListener('pointerdown', (e) => {
      if (e.target.closest('.body-hotspot-pin') || e.target.closest('button')) return;
      this.stopAutoPlay();
      isDragging = true;
      startX = e.clientX;
      canvasWrap.setPointerCapture(e.pointerId);
    });

    canvasWrap?.addEventListener('pointermove', (e) => {
      if (!isDragging) return;
      const deltaX = e.clientX - startX;
      if (Math.abs(deltaX) > 40) {
        const idx = this.ANGLES.indexOf(this.currentAngle);
        if (deltaX < 0) {
          const nextIdx = (idx + 1) % this.ANGLES.length;
          this.setBodyAngle(this.ANGLES[nextIdx]);
        } else {
          const prevIdx = (idx - 1 + this.ANGLES.length) % this.ANGLES.length;
          this.setBodyAngle(this.ANGLES[prevIdx]);
        }
        startX = e.clientX;
      }
    });

    const endDrag = (e) => {
      if (isDragging) {
        isDragging = false;
        try { canvasWrap.releasePointerCapture(e.pointerId); } catch (_) {}
      }
    };

    canvasWrap?.addEventListener('pointerup', endDrag);
    canvasWrap?.addEventListener('pointercancel', endDrag);
  }

  toggleAutoPlay() {
    if (this.isAutoPlaying) {
      this.stopAutoPlay();
    } else {
      this.startAutoPlay();
    }
  }

  startAutoPlay() {
    this.isAutoPlaying = true;
    const btnPlay = this.container.querySelector('#btn-carousel-play');
    const icon = this.container.querySelector('#play-pause-icon');
    if (btnPlay) btnPlay.classList.add('playing');
    if (icon) icon.textContent = '⏸';

    this.autoPlayTimer = setInterval(() => {
      const idx = this.ANGLES.indexOf(this.currentAngle);
      const nextIdx = (idx + 1) % this.ANGLES.length;
      this.setBodyAngle(this.ANGLES[nextIdx]);
    }, 1600);
  }

  stopAutoPlay() {
    if (!this.isAutoPlaying) return;
    this.isAutoPlaying = false;
    if (this.autoPlayTimer) {
      clearInterval(this.autoPlayTimer);
      this.autoPlayTimer = null;
    }
    const btnPlay = this.container.querySelector('#btn-carousel-play');
    const icon = this.container.querySelector('#play-pause-icon');
    if (btnPlay) btnPlay.classList.remove('playing');
    if (icon) icon.textContent = '▶';
  }

  setupZoomControls() {
    const btnIn = this.container.querySelector('#btn-zoom-in');
    const btnOut = this.container.querySelector('#btn-zoom-out');
    const btnReset = this.container.querySelector('#btn-zoom-reset');
    const canvasWrap = this.container.querySelector('#body-canvas-wrapper');

    btnIn?.addEventListener('click', () => this.applyZoom(this.currentZoom + 0.15));
    btnOut?.addEventListener('click', () => this.applyZoom(this.currentZoom - 0.15));
    btnReset?.addEventListener('click', () => this.applyZoom(1.5));

    canvasWrap?.addEventListener('wheel', (e) => {
      e.preventDefault();
      if (e.deltaY < 0) this.applyZoom(this.currentZoom + 0.1);
      else this.applyZoom(this.currentZoom - 0.1);
    }, { passive: false });
  }

  applyZoom(val) {
    this.currentZoom = Math.min(Math.max(val, 0.75), 2.2);
    const container = this.container.querySelector('#body-image-container');
    const badge = this.container.querySelector('#zoom-level-text');

    if (container) {
      container.style.transform = `scale(${this.currentZoom})`;
      container.style.transformOrigin = 'center center';
      container.style.transition = 'transform 0.15s ease';
      container.style.setProperty('--body-zoom', this.currentZoom);
    }
    document.documentElement.style.setProperty('--body-zoom', this.currentZoom);
    if (badge) {
      badge.textContent = `${Math.round(this.currentZoom * 100)}%`;
    }
  }

  setBodyAngle(angle) {
    this.currentAngle = angle;
    const viewAngles = this.moduleData.viewAngles || [];
    const angleInfo = viewAngles.find(a => a.angle === angle) || viewAngles[0];

    const degText = this.container.querySelector('#angle-deg-text');
    const nameText = this.container.querySelector('#angle-name-text');
    const subText = this.container.querySelector('#angle-sub-text');
    if (degText) degText.textContent = `${angle}°`;
    if (nameText && angleInfo) nameText.textContent = angleInfo.label;
    if (subText && angleInfo) subText.textContent = `(${angleInfo.sub})`;

    const img = this.container.querySelector('#main-body-img');
    if (img && angleInfo && !img.src.includes(angleInfo.image)) {
      img.style.opacity = '0.35';
      img.src = angleInfo.image;
      img.onload = () => {
        img.style.opacity = '1';
        this.renderHotspotsForCurrentAngle();
      };
    } else {
      this.renderHotspotsForCurrentAngle();
    }
  }

  renderHotspotsForCurrentAngle() {
    const layer = this.container.querySelector('#hotspots-layer');
    if (!layer || !this.moduleData.hotspots) return;

    layer.innerHTML = '';

    this.moduleData.hotspots.forEach(hs => {
      const isVisibleInAngle = hs.visibleAngles.includes(this.currentAngle);
      if (!isVisibleInAngle) return;

      const coords = hs.coordsByAngle[String(this.currentAngle)] || { x: 50, y: 50 };
      const isVisited = this.visitedHotspots.has(hs.id);
      const isActive = this.isModalOpen && hs.id === this.currentHotspotId;

      const pin = document.createElement('div');
      pin.className = `body-hotspot-pin ${isActive ? 'active' : ''} ${isVisited ? 'visited' : ''}`;
      pin.setAttribute('data-id', hs.id);
      pin.style.left = `${coords.x}%`;
      pin.style.top = `${coords.y}%`;

      const cleanName = hs.label.replace(/^\d+\.\s*/, '');

      pin.innerHTML = `
        <div class="pin-point">
          <div class="pin-pulse-ring"></div>
        </div>
        <div class="pin-tooltip" role="tooltip">
          <span class="pin-tooltip-num">${hs.badgeNum}</span>
          <span class="pin-tooltip-name">${cleanName}</span>
        </div>
      `;

      pin.setAttribute('tabindex', '0');
      pin.setAttribute('role', 'button');
      pin.setAttribute('aria-label', `Hotspot ${hs.badgeNum}: ${cleanName}`);

      pin.addEventListener('pointerenter', () => pin.classList.add('is-hovered'));
      pin.addEventListener('pointerleave', () => pin.classList.remove('is-hovered'));

      pin.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.openHotspotModal(hs.id, true);
      });

      layer.appendChild(pin);
    });
  }

  setupDetailModal() {
    const overlay = this.container.querySelector('#hotspot-card-modal-overlay');
    const btnClose = this.container.querySelector('#btn-close-detail-modal');
    const btnFooterClose = this.container.querySelector('#btn-modal-close-footer');
    const btnPrev = this.container.querySelector('#btn-prev-hotspot');
    const btnNext = this.container.querySelector('#btn-next-hotspot');

    btnClose?.addEventListener('click', () => this.closeHotspotModal());
    btnFooterClose?.addEventListener('click', () => this.closeHotspotModal());

    overlay?.addEventListener('click', (e) => {
      if (e.target === overlay) this.closeHotspotModal();
    });

    btnPrev?.addEventListener('click', () => {
      const idx = this.moduleData.hotspots.findIndex(h => h.id === this.currentHotspotId);
      const prevIdx = (idx - 1 + this.moduleData.hotspots.length) % this.moduleData.hotspots.length;
      this.openHotspotModal(this.moduleData.hotspots[prevIdx].id, true);
    });

    btnNext?.addEventListener('click', () => {
      const idx = this.moduleData.hotspots.findIndex(h => h.id === this.currentHotspotId);
      const nextIdx = (idx + 1) % this.moduleData.hotspots.length;
      this.openHotspotModal(this.moduleData.hotspots[nextIdx].id, true);
    });

    const tabBtns = this.container.querySelectorAll('.card-tabs-nav .tab-btn');
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const tabId = btn.getAttribute('data-tab');
        this.switchCardTab(tabId);
      });
    });
  }

  closeHotspotModal() {
    this.isModalOpen = false;
    const overlay = this.container.querySelector('#hotspot-card-modal-overlay');
    if (overlay) {
      overlay.classList.add('hidden');
    }
    this.renderHotspotsForCurrentAngle();
  }

  switchCardTab(tabId) {
    this.currentActiveTab = tabId;

    this.container.querySelectorAll('.card-tabs-nav .tab-btn').forEach(b => {
      if (b.getAttribute('data-tab') === tabId) b.classList.add('active');
      else b.classList.remove('active');
    });

    this.container.querySelectorAll('.tab-content-container .tab-pane').forEach(p => {
      if (p.id === tabId) p.classList.add('active');
      else p.classList.remove('active');
    });
  }

  openHotspotModal(id, syncAngle = false) {
    const hs = this.moduleData.hotspots.find(h => h.id === id);
    if (!hs) return;

    this.currentHotspotId = id;
    this.isModalOpen = true;
    this.visitedHotspots.add(id);

    const overlay = this.container.querySelector('#hotspot-card-modal-overlay');
    if (overlay) {
      overlay.classList.remove('hidden');
    }

    this.renderModalContent(hs);
    this.switchCardTab('tab-modus');
    this.updateProgressUI();

    if (syncAngle && !hs.visibleAngles.includes(this.currentAngle)) {
      this.setBodyAngle(hs.primaryAngle);
    } else {
      this.renderHotspotsForCurrentAngle();
    }

    // Update inner sidebar
    this.container.querySelectorAll('.sidebar-hotspot-item').forEach(item => {
      const itemHsId = item.getAttribute('data-hotspot-id');
      item.classList.toggle('active', itemHsId === id);
      if (this.visitedHotspots.has(itemHsId)) item.classList.add('visited');
    });

    // Track xAPI click
    xapi.trackHotspotClick('modul1', hs.id, hs.label, hs.categoryLabel);
  }

  renderModalContent(hs) {
    const idx = this.moduleData.hotspots.findIndex(h => h.id === hs.id);
    const counter = this.container.querySelector('#card-nav-counter');
    if (counter) counter.textContent = `${idx + 1} / ${this.moduleData.hotspots.length}`;

    const badgeRow = this.container.querySelector('.detail-badge-row');
    const tagBadge = this.container.querySelector('#detail-tag-badge');
    const catBadge = this.container.querySelector('#detail-cat-badge');
    const title = this.container.querySelector('#detail-title');
    const sub = this.container.querySelector('#detail-subtitle');

    if (badgeRow) badgeRow.className = `detail-badge-row cat-${hs.categoryId}`;
    if (tagBadge) {
      tagBadge.textContent = `MODUS #${hs.num}`;
      tagBadge.className = `detail-tag-badge cat-${hs.categoryId}`;
    }
    if (catBadge) {
      catBadge.textContent = (hs.categoryLabel || '').toUpperCase();
      catBadge.className = `detail-cat-badge cat-${hs.categoryId}`;
    }
    if (title) title.textContent = hs.label;
    if (sub) sub.textContent = hs.tag;

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
      mainImg.src = hs.mainIllustration || hs.thumb;
      mainImg.alt = hs.label;
    }
    if (desc) desc.textContent = hs.description;
    if (concealmentMethod) concealmentMethod.textContent = hs.categoryLabel || 'Modus Penyembunyian Tubuh';
    if (bodyLocation) bodyLocation.textContent = `${hs.label} (Sudut Pandang Utama: ${hs.primaryAngle}°)`;
    if (drugTypes) drugTypes.textContent = hs.drugTypes || 'Narkotika Golongan I (Kokain, Sabu, Heroin)';
    if (packaging) packaging.textContent = hs.packagingTechnique || 'Kondom lateks berlapis, selotip kedap udara';
    if (narrative) narrative.textContent = hs.modusDetail || hs.description;
    if (note) note.textContent = hs.inspectionNote || 'Wajib dilakukan pemeriksaan sesuai SOP resmi DJBC.';

    // TAB 2: Foto Real
    const findingsGrid = this.container.querySelector('#findings-thumbnails-grid');
    if (findingsGrid && hs.findings) {
      findingsGrid.innerHTML = '';
      hs.findings.forEach(f => {
        const a = document.createElement('a');
        a.href = f.full;
        a.className = 'finding-thumb-item glightbox';
        a.setAttribute('data-gallery', `findings-gallery-${hs.id}`);
        a.setAttribute('data-title', `${f.caption} — [${f.tag}]`);
        a.innerHTML = `
          <img src="${f.thumb}" alt="${f.caption}" />
          <span class="finding-thumb-label">${f.tag}</span>
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
    if (indList && hs.indicators) {
      indList.innerHTML = '';
      hs.indicators.forEach(item => {
        const li = document.createElement('li');
        li.textContent = item;
        indList.appendChild(li);
      });
    }

    const detList = this.container.querySelector('#detail-detection-list');
    if (detList && hs.detection) {
      detList.innerHTML = '';
      hs.detection.forEach(item => {
        const li = document.createElement('li');
        li.textContent = item;
        detList.appendChild(li);
      });
    }

    // TAB 4: Risk
    const riskScoreVal = this.container.querySelector('#risk-score-val');
    const riskBarFill = this.container.querySelector('#risk-meter-bar-fill');
    const medRisk = this.container.querySelector('#detail-medical-risk');

    if (riskScoreVal && hs.riskLevel) riskScoreVal.textContent = `${hs.riskLevel.toUpperCase()} (${hs.riskScore}/100)`;
    if (riskBarFill && hs.riskScore) riskBarFill.style.width = `${hs.riskScore}%`;
    if (medRisk) medRisk.textContent = hs.medicalRisk;
  }

  updateProgressUI() {
    const total = (this.moduleData.hotspots || []).length || 8;
    const visited = this.visitedHotspots.size;
    const explorePct = Math.round((visited / total) * 75);
    const totalPct = Math.min(explorePct + (this.quiz?.score ? 25 : 5), 100);

    const text = this.container.querySelector('#progress-percentage-text');
    const fill = this.container.querySelector('#progress-fill-bar');

    if (text) text.textContent = `${totalPct}%`;
    if (fill) fill.style.width = `${totalPct}%`;

    try {
      if (scorm) {
        if (typeof scorm.setProgress === 'function') {
          scorm.setProgress('modul1', Array.from(this.visitedHotspots));
        }
        if (typeof scorm.setScore === 'function') {
          scorm.setScore(totalPct);
        }
      }
    } catch (sErr) {
      console.warn('SCORM update notice:', sErr);
    }
  }

  initQuiz() {
    this.quiz = new QuizModule({
      onComplete: (score, answers) => {
        this.showResult(score);
        scorm.complete(score);
        this.updateProgressUI();
        xapi.trackQuizAttempt('modul1', score, answers);
      }
    });

    const btnQuiz = this.container.querySelector('#btn-open-quiz');
    btnQuiz?.addEventListener('click', () => this.quiz.start());
  }

  initModals() {
    // Help modal
    const btnHelp = this.container.querySelector('#btn-help-modal');
    const helpOverlay = this.container.querySelector('#help-overlay');
    const btnCloseHelp = this.container.querySelector('#btn-close-help');
    const btnOkHelp = this.container.querySelector('#btn-help-ok');

    btnHelp?.addEventListener('click', () => helpOverlay?.classList.remove('hidden'));
    btnCloseHelp?.addEventListener('click', () => helpOverlay?.classList.add('hidden'));
    btnOkHelp?.addEventListener('click', () => helpOverlay?.classList.add('hidden'));

    // Result modal
    const resultOverlay = this.container.querySelector('#result-overlay');
    const btnRetry = this.container.querySelector('#btn-retry-quiz');
    const btnReview = this.container.querySelector('#btn-review');

    btnRetry?.addEventListener('click', () => {
      resultOverlay?.classList.add('hidden');
      if (this.quiz) this.quiz.start();
    });

    btnReview?.addEventListener('click', () => {
      resultOverlay?.classList.add('hidden');
    });
  }

  showResult(score) {
    const overlay = this.container.querySelector('#result-overlay');
    const scoreDisp = this.container.querySelector('#result-score-display');
    const title = this.container.querySelector('#result-title');
    const msg = this.container.querySelector('#result-message');
    const icon = this.container.querySelector('#result-icon');

    if (scoreDisp) scoreDisp.textContent = `${score} / 100`;

    if (score >= 70) {
      if (icon) icon.textContent = '🏆';
      if (title) title.textContent = 'Kompetensi Terpenuhi!';
      if (msg) msg.textContent = 'Selamat! Anda berhasil memahami prinsip deteksi, indikator risiko, dan standar operasional pemeriksaan penyelundupan narkotika pada tubuh kurir.';
    } else {
      if (icon) icon.textContent = '⚠️';
      if (title) title.textContent = 'Perlu Pendalaman Materi';
      if (msg) msg.textContent = 'Nilai Anda belum mencapai batas kelulusan 70%. Silakan pelajari kembali titik-titik rawan dan indikator fisik sebelum mengulang kuis.';
    }

    overlay?.classList.remove('hidden');
  }
}
