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
      <div id="modul2-app-root" style="width:100%; display:flex; flex-direction:column; align-items:center;">
        <!-- ─── MAIN VIEWPORT ─── -->
        <div id="modul2-viewport" style="width:100%; display:flex; flex-direction:column; align-items:center;">

          <!-- Sub Header Bar (Stitch Forensic Module Strip) -->
          <div id="modul2-top-bar" class="modul1-top-bar" style="width:100%;">
            <div class="nav-left">
              <div class="header-breadcrumb">
                <span class="modul-code-badge font-code-tech">MODUL 02</span>
                <span class="course-main-title">Pemeriksaan Barang Bawaan (Luggage Concealment)</span>
                <span class="breadcrumb-separator">•</span>
                <span class="modul-ref-tag font-code-tech">PMK-188/2021 & S-39/BC/2023</span>
              </div>
            </div>
          </div>

          <!-- Floating Filter Category Bar -->
          <div class="filter-category-bar">
            ${categories.map(cat => `
              <button class="filter-btn ${cat.id === 'all' ? 'active' : ''}" data-filter="${cat.id}">
                ${cat.icon || ''} ${cat.label}
              </button>
            `).join('')}
          </div>

          <!-- Central Inspection Viewport Scene -->
          <div class="scene-viewport" style="position:relative; width:100%; min-height:calc(100vh - 120px); display:flex; flex-direction:column; justify-content:center; align-items:center; text-align:center; background:#030F26; padding:20px 0; overflow:hidden;">
            
            <!-- View Mode Switcher Pill (Centered Above Main Image) -->
            <div class="view-mode-switcher-pill" style="display:inline-flex; align-items:center; justify-content:center; gap:6px; background:rgba(3,15,38,0.92); padding:5px 10px; border-radius:24px; border:1px solid rgba(245,166,35,0.4); margin:0 auto 16px auto; z-index:10; box-shadow:0 4px 20px rgba(0,0,0,0.6);">
              <button id="btn-view-xray" class="mode-pill-btn active" style="padding:6px 18px; border-radius:20px; border:none; background:#F5A623; color:#030F26; font-size:12px; font-weight:700; cursor:pointer; transition:all 0.2s ease;">
                🔍 X-Ray Scanner
              </button>
              <button id="btn-view-normal" class="mode-pill-btn" style="padding:6px 18px; border-radius:20px; border:none; background:transparent; color:#CBD5E1; font-size:12px; font-weight:600; cursor:pointer; transition:all 0.2s ease;">
                👜 Tampak Normal
              </button>
            </div>

            <!-- Central Main Image Container with Hotspots -->
            <div class="scene-container" style="position:relative; max-width:850px; width:100%; margin:0 auto; display:flex; justify-content:center; align-items:center;">
              <img id="m2-central-image" src="assets/images/central/m2_luggage_xray.png" 
                   alt="X-Ray Scanner Koper Bagasi Bawaan" 
                   style="max-height:76vh; max-width:100%; object-fit:contain; filter:drop-shadow(0 10px 30px rgba(0,0,0,0.7)); display:block; margin:0 auto;" />
              
              <!-- Hotspots Interactive Layer -->
              <div id="m2-hotspots-layer" class="hotspots-layer" style="position:absolute; inset:0;"></div>
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
                  <span id="card-nav-counter" class="card-nav-counter">1 / 6</span>
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
                  <span class="photos-title">📸 Dokumentasi Temuan Realistis Kasus DJBC</span>
                  <span class="photos-subtitle">Klik gambar untuk pembesaran resolusi penuh</span>
                </div>
                <div id="findings-gallery-grid" class="findings-gallery-grid"></div>
              </div>

              <!-- TAB 3: SOP & CIRI -->
              <div class="tab-pane" id="tab-detection">
                <div class="detection-section-block">
                  <span class="section-block-title text-info-blue">🔍 SOP & Langkah Penggeledahan Barang Bawaan:</span>
                  <ul id="detail-detection-steps" class="block-list detection-list"></ul>
                </div>
                <div class="detection-section-block hazard-alert-box">
                  <span class="hazard-title">⚠️ Bahaya Bahan Kimia & Prosedur Keamanan:</span>
                  <p id="detail-medical-risk" class="hazard-desc"></p>
                </div>
              </div>

              <!-- TAB 4: INDIKATOR RISIKO -->
              <div class="tab-pane" id="tab-risk">
                <div class="risk-score-banner">
                  <div class="risk-meter-header">
                    <span class="risk-meter-title">TINGKAT ANOMALI X-RAY & ANCAMAN:</span>
                    <span id="detail-risk-badge" class="risk-level-badge">KRITIS</span>
                  </div>
                  <div class="risk-bar-track">
                    <div id="detail-risk-bar-fill" class="risk-bar-fill" style="width: 85%;"></div>
                  </div>
                  <div class="risk-score-caption">
                    Skor Ancaman Modus: <strong id="detail-risk-score" class="font-code-tech">85/100</strong>
                  </div>
                </div>
                <div class="detection-section-block">
                  <span class="section-block-title text-warning-gold">🚩 Indikator Red Flags & Anomali X-Ray Scanner:</span>
                  <ul id="detail-risk-indicators" class="block-list risk-list"></ul>
                </div>
              </div>
            </div>

            <!-- Card Bottom Pagination Bar -->
            <div class="card-pagination-bar">
              <button id="btn-card-prev-page" class="card-carousel-nav-btn" title="Halaman Tab Sebelumnya">‹</button>

              <div class="card-page-dots" id="card-page-dots">
                ${this.cardPages.map((p, idx) => `
                  <span class="page-dot ${idx === 0 ? 'active' : ''}" data-index="${idx}" title="${p.title}"></span>
                `).join('')}
              </div>

              <button id="btn-card-next-page" class="card-carousel-nav-btn" title="Halaman Tab Berikutnya">›</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  initInteractiveViewer() {
    this.renderHotspots();

    // Setup Category Filter Buttons
    const filterBtns = this.container.querySelectorAll('.filter-category-bar .filter-btn');
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

    if (btnXray && btnNormal && centralImg) {
      btnXray.addEventListener('click', () => {
        btnXray.classList.add('active');
        btnXray.style.background = '#F5A623';
        btnXray.style.color = '#030F26';
        btnNormal.classList.remove('active');
        btnNormal.style.background = 'transparent';
        btnNormal.style.color = '#CBD5E1';
        this.currentViewMode = 'xray';
        centralImg.src = 'assets/images/central/m2_luggage_xray.png';
        this.renderHotspots();
      });

      btnNormal.addEventListener('click', () => {
        btnNormal.classList.add('active');
        btnNormal.style.background = '#F5A623';
        btnNormal.style.color = '#030F26';
        btnXray.classList.remove('active');
        btnXray.style.background = 'transparent';
        btnXray.style.color = '#CBD5E1';
        this.currentViewMode = 'normal';
        centralImg.src = 'assets/images/central/m2_luggage_normal.png';
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

      const btn = document.createElement('button');
      btn.className = `hotspot-pin ${hs.id === this.currentHotspotId ? 'active' : ''}`;
      btn.dataset.id = hs.id;
      btn.style.left = `${hs.position.x}%`;
      btn.style.top = `${hs.position.y}%`;
      btn.style.position = 'absolute';
      btn.style.transform = 'translate(-50%, -50%)';

      const color = hs.color || '#F5A623';

      btn.innerHTML = `
        <div class="hotspot-pulse" style="border-color: ${color};"></div>
        <div class="hotspot-core" style="background: ${color};">
          <span class="hotspot-num">${hs.num || (idx + 1)}</span>
        </div>
        <div class="hotspot-tooltip">${hs.shortName || hs.label}</div>
      `;

      btn.addEventListener('click', () => {
        this.openHotspotDetail(hs.id);
      });

      layerEl.appendChild(btn);
    });
  }

  openHotspotDetail(hotspotId) {
    const hotspots = this.moduleData.hotspots || [];
    const hotspot = hotspots.find(h => h.id === hotspotId);
    if (!hotspot) return;

    this.currentHotspotId = hotspotId;
    this.visitedHotspots.add(hotspotId);
    this.renderHotspots();

    // Populate Modal Data
    const overlay = this.container.querySelector('#hotspot-card-modal-overlay');
    const titleEl = this.container.querySelector('#detail-title');
    const tagBadge = this.container.querySelector('#detail-tag-badge');
    const catBadge = this.container.querySelector('#detail-cat-badge');
    const descEl = this.container.querySelector('#detail-desc');
    const methodEl = this.container.querySelector('#detail-concealment-method');
    const locEl = this.container.querySelector('#detail-body-location');
    const drugEl = this.container.querySelector('#detail-drug-types');
    const packEl = this.container.querySelector('#detail-packaging');
    const narrativeEl = this.container.querySelector('#detail-modus-narrative');
    const guideEl = this.container.querySelector('#detail-inspection-note');
    const counterEl = this.container.querySelector('#card-nav-counter');
    const mainImgEl = this.container.querySelector('#detail-main-img');

    if (titleEl) titleEl.textContent = hotspot.label;
    if (tagBadge) tagBadge.textContent = `MODUS #${hotspot.num || '01'}`;
    if (catBadge) catBadge.textContent = (hotspot.tag || hotspot.categoryLabel || 'BARANG BAWAAN').toUpperCase();
    if (descEl) descEl.textContent = hotspot.description;
    if (methodEl) methodEl.textContent = hotspot.tag || hotspot.categoryLabel || 'False Concealment';
    if (locEl) locEl.textContent = hotspot.bodyLocation || 'Bagasi Koper';
    if (drugEl) drugEl.textContent = hotspot.drugTypes || 'Sabu / Heroin';
    if (packEl) packEl.textContent = hotspot.packagingTechnique || 'Plastik Vakum';
    if (narrativeEl) narrativeEl.textContent = hotspot.modusDetail || hotspot.description;
    if (guideEl) guideEl.textContent = hotspot.inspectionNote || 'SOP DJBC';

    if (mainImgEl) {
      mainImgEl.src = hotspot.mainIllustration || hotspot.mainImage || 'assets/images/hotspots/hs_sardine_can_false.png';
    }

    const currentIdx = hotspots.findIndex(h => h.id === hotspotId);
    if (counterEl) counterEl.textContent = `${currentIdx + 1} / ${hotspots.length}`;

    // Populate Findings Gallery
    const galleryGrid = this.container.querySelector('#findings-gallery-grid');
    if (galleryGrid) {
      const findings = hotspot.findings || [];
      galleryGrid.innerHTML = findings.map(f => `
        <div class="finding-card">
          <div class="finding-img-wrapper">
            <img src="${f.full || f.thumb}" alt="${f.caption}" class="finding-img" />
            <span class="finding-tag">${f.tag || 'Barang Bukti'}</span>
          </div>
          <p class="finding-caption">${f.caption}</p>
        </div>
      `).join('');
    }

    // Populate Detection SOPs
    const detectionList = this.container.querySelector('#detail-detection-steps');
    if (detectionList) {
      const steps = hotspot.detection || hotspot.inspectionActions || [];
      detectionList.innerHTML = steps.map(step => `
        <li><span class="bullet-icon">▸</span> <div>${step}</div></li>
      `).join('');
    }

    // Populate Medical/Chemical Risk
    const medicalRiskEl = this.container.querySelector('#detail-medical-risk');
    if (medicalRiskEl) {
      medicalRiskEl.textContent = hotspot.medicalRisk || 'BAHAYA ZAT KIMIA BERBAHAYA: Selalu gunakan sarung tangan nitril dan masker medis saat membuka bungkusan barang bukti.';
    }

    // Populate Risk Meter & Indicators
    const riskBadge = this.container.querySelector('#detail-risk-badge');
    const riskBarFill = this.container.querySelector('#detail-risk-bar-fill');
    const riskScoreEl = this.container.querySelector('#detail-risk-score');
    const riskList = this.container.querySelector('#detail-risk-indicators');

    const score = hotspot.riskScore || 80;
    if (riskScoreEl) riskScoreEl.textContent = `${score}/100`;
    if (riskBarFill) riskBarFill.style.width = `${score}%`;
    if (riskBadge) {
      riskBadge.textContent = (hotspot.riskLevel || 'HIGH').toUpperCase();
    }

    if (riskList) {
      const indicators = hotspot.indicators || hotspot.riskIndicators || [];
      riskList.innerHTML = indicators.map(ind => `
        <li><span class="bullet-icon">🚩</span> <div>${ind}</div></li>
      `).join('');
    }

    if (overlay) {
      overlay.classList.remove('hidden');
      this.isModalOpen = true;
    }

    // Record hotspot visit in progress manager & send xAPI event
    courseProgress.recordHotspotVisit('modul2', hotspotId);
    xapi.trackHotspotClick('modul2', hotspotId, hotspot.label, hotspot.categoryId || hotspot.category);
    this.updateProgressUI();
  }

  initModals() {
    const overlay = this.container.querySelector('#hotspot-card-modal-overlay');
    const closeBtn = this.container.querySelector('#btn-close-detail-modal');
    const prevBtn = this.container.querySelector('#btn-prev-hotspot');
    const nextBtn = this.container.querySelector('#btn-next-hotspot');
    const prevPageBtn = this.container.querySelector('#btn-card-prev-page');
    const nextPageBtn = this.container.querySelector('#btn-card-next-page');

    if (closeBtn && overlay) {
      closeBtn.addEventListener('click', () => {
        overlay.classList.add('hidden');
        this.isModalOpen = false;
      });
    }

    // Close on overlay click outside card
    if (overlay) {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          overlay.classList.add('hidden');
          this.isModalOpen = false;
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

    // Tab Navigation inside Card
    const tabBtns = this.container.querySelectorAll('#card-tabs-nav .tab-btn');
    const tabPanes = this.container.querySelectorAll('#tab-content-container .tab-pane');
    const dots = this.container.querySelectorAll('#card-page-dots .page-dot');

    const switchTab = (tabId, index) => {
      tabBtns.forEach(b => b.classList.toggle('active', b.dataset.tab === tabId));
      tabPanes.forEach(p => p.classList.toggle('active', p.id === tabId));
      dots.forEach((d, idx) => d.classList.toggle('active', idx === index));
      this.currentActiveTab = tabId;
      this.currentCardPageIndex = index;
    };

    tabBtns.forEach((btn, idx) => {
      btn.addEventListener('click', () => {
        switchTab(btn.dataset.tab, idx);
      });
    });

    dots.forEach((dot, idx) => {
      dot.addEventListener('click', () => {
        const targetTab = this.cardPages[idx].id;
        switchTab(targetTab, idx);
      });
    });

    if (prevPageBtn) {
      prevPageBtn.addEventListener('click', () => {
        const prevIdx = (this.currentCardPageIndex - 1 + this.cardPages.length) % this.cardPages.length;
        switchTab(this.cardPages[prevIdx].id, prevIdx);
      });
    }

    if (nextPageBtn) {
      nextPageBtn.addEventListener('click', () => {
        const nextIdx = (this.currentCardPageIndex + 1) % this.cardPages.length;
        switchTab(this.cardPages[nextIdx].id, nextIdx);
      });
    }

    // Make modal card draggable
    this.initCardDraggable();
  }

  initCardDraggable() {
    const card = this.container.querySelector('#hotspot-modal-card');
    const header = this.container.querySelector('.tabbed-modal-header');
    if (!card || !header) return;

    let isDragging = false;
    let currentX;
    let currentY;
    let initialX;
    let initialY;
    let xOffset = 0;
    let yOffset = 0;

    header.style.cursor = 'grab';

    const dragStart = (e) => {
      if (e.target.closest('button')) return;
      if (e.type === 'touchstart') {
        initialX = e.touches[0].clientX - xOffset;
        initialY = e.touches[0].clientY - yOffset;
      } else {
        initialX = e.clientX - xOffset;
        initialY = e.clientY - yOffset;
      }
      isDragging = true;
      header.style.cursor = 'grabbing';
    };

    const dragEnd = () => {
      initialX = currentX;
      initialY = currentY;
      isDragging = false;
      header.style.cursor = 'grab';
    };

    const drag = (e) => {
      if (!isDragging) return;
      e.preventDefault();
      if (e.type === 'touchmove') {
        currentX = e.touches[0].clientX - initialX;
        currentY = e.touches[0].clientY - initialY;
      } else {
        currentX = e.clientX - initialX;
        currentY = e.clientY - initialY;
      }
      xOffset = currentX;
      yOffset = currentY;
      card.style.transform = `translate(${currentX}px, ${currentY}px)`;
    };

    header.addEventListener('mousedown', dragStart);
    document.addEventListener('mouseup', dragEnd);
    document.addEventListener('mousemove', drag);

    header.addEventListener('touchstart', dragStart);
    document.addEventListener('touchend', dragEnd);
    document.addEventListener('touchmove', drag);
  }

  updateProgressUI() {
    const modPct = courseProgress.getModuleProgress('modul2');
    const pctText = this.container.querySelector('#modul2-progress-pct');
    const fillBar = this.container.querySelector('#modul2-progress-fill');

    if (pctText) pctText.textContent = `${modPct}%`;
    if (fillBar) fillBar.style.width = `${modPct}%`;
  }
}
