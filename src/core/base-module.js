import { HotspotLayer } from '../components/hotspot-layer.js';
import { ViewToggle } from '../components/view-toggle.js';
import { Carousel } from '../components/carousel.js';
import { RotationControl } from '../components/rotation.js';
import { xapi } from './xapi.js';
import { courseProgress } from './progress.js';

export class BaseModuleView {
  constructor(container, jsonPath) {
    this.container = container;
    this.jsonPath = jsonPath;
    this.moduleData = null;
    this.activeView = '';
    this.activeFilter = 'all';
    this.currentAngle = 0;

    this.currentHotspotId = null;
    this.isModalOpen = false;
    this.currentCardPageIndex = 0;
    this.cardPages = [
      { id: 'tab-modus', label: 'Modus Operandi' },
      { id: 'tab-photos', label: 'Foto Real' },
      { id: 'tab-detection', label: 'Ciri Pelaku & SOP' },
      { id: 'tab-risk', label: 'Indikator Risiko' }
    ];
    this.visitedHotspots = new Set();
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

    const modPct = courseProgress.getModuleProgress(data.moduleId);

    const html = `
      <div class="inspection-workspace">
        <!-- Sub Header Bar -->
        <div class="modul1-top-bar">
          <div class="nav-left">
            <div class="header-breadcrumb">
              <span class="modul-code-badge font-code-tech">${(data.moduleId || '').toUpperCase()}</span>
              <span class="course-main-title">${data.moduleTitle || 'Pemeriksaan Interaktif'}</span>
              <span class="breadcrumb-separator">•</span>
              <span class="modul-ref-tag font-code-tech">PMK-188/2021 & S-39/BC/2023</span>
            </div>
          </div>
        </div>

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
                  <span id="card-nav-counter" class="card-nav-counter">1 / 1</span>
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
                    <span class="hazard-title">Bahaya Kargo / Bahan Kimia:</span>
                    <p id="detail-medical-risk" class="hazard-desc"></p>
                  </div>
                </div>
                <div class="hazard-alert-box hazard-officer">
                  <div class="hazard-icon">🛡️</div>
                  <div class="hazard-content">
                    <span class="hazard-title">Protokol Keselamatan Petugas:</span>
                    <p class="hazard-desc">
                      Gunakan APD lengkap, masker medis, dan sarung tangan nitril saat memeriksa kemasan atau ruangan tertutup.
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
        <div id="base-image-popup-modal" class="m4a-image-popup-overlay hidden" role="dialog" aria-modal="true">
          <div class="m4a-image-popup-content">
            <button id="btn-close-base-img-popup" class="m4a-img-popup-close" aria-label="Tutup Preview" title="Tutup Preview (Esc)">✕</button>
            <div class="m4a-img-popup-frame">
              <img id="base-popup-img-el" src="" alt="Bukti Foto Real" />
            </div>
            <div class="m4a-img-popup-caption">
              <span id="base-popup-img-title">Dokumentasi Penindakan DJBC</span>
            </div>
          </div>
        </div>
      </div>
    `;

    this.container.innerHTML = html;

    // Initialize sub-components and modals
    this.initComponents();
    this.initModals();

    courseProgress.updateDOM();

    // Track xAPI module view
    xapi.trackModuleView(data.moduleId, data.moduleTitle);
  }

  initComponents() {
    const data = this.moduleData;
    const sceneImg = document.getElementById('central-scene-image');
    const hotspotRoot = document.getElementById('hotspot-layer-root');
    const viewToggleRoot = document.getElementById('view-toggle-container');
    const rotationRoot = document.getElementById('rotation-control-root');

    this.hotspotLayer = new HotspotLayer(hotspotRoot, {
      onHotspotClick: (hotspot) => {
        this.openHotspotDetail(hotspot.id);
        courseProgress.recordHotspotVisit(data.moduleId, hotspot.id);
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

  openHotspotDetail(hotspotId) {
    const hotspots = this.moduleData?.hotspots || [];
    const hs = hotspots.find(h => h.id === hotspotId);
    if (!hs) return;

    this.currentHotspotId = hotspotId;
    this.isModalOpen = true;
    this.visitedHotspots.add(hotspotId);
    if (this.hotspotLayer) {
      this.hotspotLayer.markVisited(hotspotId);
    }

    const overlay = this.container.querySelector('#hotspot-card-modal-overlay');
    if (overlay) {
      overlay.classList.remove('hidden');
    }

    this.renderModalContent(hs);
    this.switchCardPage(0);

    // Record hotspot visit in progress manager & send xAPI event
    courseProgress.recordHotspotVisit(this.moduleData.moduleId, hotspotId);
    courseProgress.updateDOM();
    xapi.trackHotspotClick(this.moduleData.moduleId, hotspotId, hs.label, hs.category);
  }

  renderModalContent(hs) {
    const hotspots = this.moduleData?.hotspots || [];
    const idx = hotspots.findIndex(h => h.id === hs.id);
    const counter = this.container.querySelector('#card-nav-counter');
    if (counter) counter.textContent = `${idx + 1} / ${hotspots.length}`;

    const badgeRow = this.container.querySelector('.detail-badge-row');
    const tagBadge = this.container.querySelector('#detail-tag-badge');
    const title = this.container.querySelector('#detail-title');

    if (badgeRow) badgeRow.className = `detail-badge-row cat-${hs.category || 'default'}`;
    if (tagBadge) {
      tagBadge.textContent = `MODUS #${hs.num || String(idx + 1).padStart(2, '0')}`;
      tagBadge.className = `detail-tag-badge cat-${hs.category || 'default'}`;
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

    const fallbackImg = 'assets/images/hotspots/hs_door_panel_compartment.png';
    const imgSrc = hs.mainIllustration || hs.mainImage || hs.thumb || fallbackImg;

    if (mainImg) {
      mainImg.onerror = () => {
        mainImg.src = fallbackImg;
      };
      mainImg.src = imgSrc;
      mainImg.alt = hs.label;
    }

    // Klik gambar utama pada Modus Operandi untuk memperbesar ke mode popup
    const illustrationBox = this.container.querySelector('.detail-illustration-box');
    if (illustrationBox) {
      illustrationBox.style.cursor = 'pointer';
      illustrationBox.title = 'Klik untuk melihat gambar ukuran penuh';
      illustrationBox.onclick = () => {
        const curImg = this.container.querySelector('#detail-main-img');
        const curTitle = this.container.querySelector('#detail-title');
        this.openImagePopup(
          curImg ? curImg.src : imgSrc,
          curTitle ? curTitle.textContent : hs.label
        );
      };
    }

    if (desc) desc.textContent = hs.description || '';
    if (concealmentMethod) concealmentMethod.textContent = hs.concealmentMethod || hs.badge || hs.categoryLabel || 'Concealment';
    if (bodyLocation) bodyLocation.textContent = hs.location || hs.bodyLocation || 'Kompartemen / Kemasan Khusus';
    if (drugTypes) drugTypes.textContent = hs.drugTypes || 'Metamfetamin / Sabu / Kokain / Heroin';
    if (packaging) packaging.textContent = hs.packaging || hs.packagingTechnique || 'Bungkus Plastik Kedap & Lakban';
    if (narrative) narrative.textContent = hs.modusNarrative || hs.modusDetail || hs.description || '';
    if (note) note.textContent = hs.inspectionNote || 'Lakukan pemeriksaan mendalam sesuai SOP DJBC dengan kewaspadaan tinggi.';

    // TAB 2: Foto Real dengan Fitur Popup Gambar
    const findingsGrid = this.container.querySelector('#findings-thumbnails-grid');
    if (findingsGrid) {
      findingsGrid.innerHTML = '';
      const findingsList = (hs.findings && hs.findings.length > 0)
        ? hs.findings
        : (hs.galleryImages && hs.galleryImages.length > 0)
          ? hs.galleryImages.map(img => ({ full: img, thumb: img, caption: hs.label, tag: hs.badge || 'Barang Bukti' }))
          : [{ full: imgSrc, thumb: imgSrc, caption: hs.label, tag: hs.badge || 'Barang Bukti' }];

      findingsList.forEach(f => {
        const item = document.createElement('div');
        item.className = 'finding-thumb-item';
        item.setAttribute('role', 'button');
        item.setAttribute('tabindex', '0');
        item.setAttribute('title', `Klik untuk memperbesar: ${f.caption}`);
        item.style.cursor = 'pointer';
        item.innerHTML = `
          <img src="${f.thumb || f.full}" alt="${f.caption}" onerror="this.src='${fallbackImg}'" />
          <span class="finding-thumb-label">${f.tag || 'Barang Bukti'}</span>
        `;
        item.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.openImagePopup(f.full || f.thumb, `${f.caption} — [${f.tag || 'Barang Bukti'}]`);
        });
        item.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            this.openImagePopup(f.full || f.thumb, `${f.caption} — [${f.tag || 'Barang Bukti'}]`);
          }
        });
        findingsGrid.appendChild(item);
      });
    }

    // TAB 3: Detection & SOP
    const indList = this.container.querySelector('#detail-indicators-list');
    if (indList) {
      indList.innerHTML = '';
      const indicators = hs.riskIndicators || hs.indicators || [];
      indicators.forEach(item => {
        const li = document.createElement('li');
        li.textContent = item;
        indList.appendChild(li);
      });
    }

    const detList = this.container.querySelector('#detail-detection-list');
    if (detList) {
      detList.innerHTML = '';
      const steps = hs.inspectionActions || hs.detection || [];
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

    const score = hs.riskScore || (hs.badgeType === 'danger' ? 95 : hs.badgeType === 'warning' ? 80 : 65);
    const level = hs.riskLevel || (score >= 90 ? 'KRITIS' : score >= 75 ? 'TINGGI' : 'SEDANG');
    if (riskScoreVal) riskScoreVal.textContent = `${level} (${score}/100)`;
    if (riskBarFill) riskBarFill.style.width = `${score}%`;
    if (medRisk) medRisk.textContent = hs.medicalRisk || 'BAHAYA ZAT KIMIA / NARKOTIKA: Selalu gunakan APD lengkap, masker medis, dan sarung tangan nitril saat memeriksa kemasan mencurigakan.';
  }

  initModals() {
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
      });
    }

    if (overlay) {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          overlay.classList.add('hidden');
          this.isModalOpen = false;
        }
      });
    }

    // Quick Hotspot Nav (Prev / Next)
    const hotspots = this.moduleData?.hotspots || [];
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

    // Popup Foto Real / Preview Gambar Resolusi Penuh
    const imgPopupModal = this.container.querySelector('#base-image-popup-modal');
    const btnCloseImgPopup = this.container.querySelector('#btn-close-base-img-popup');

    if (btnCloseImgPopup) {
      btnCloseImgPopup.addEventListener('click', (e) => {
        e.stopPropagation();
        this.closeImagePopup();
      });
    }

    if (imgPopupModal) {
      imgPopupModal.addEventListener('click', (e) => {
        if (e.target === imgPopupModal) {
          this.closeImagePopup();
        }
      });
    }

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const popup = this.container?.querySelector('#base-image-popup-modal');
        if (popup && !popup.classList.contains('hidden')) {
          this.closeImagePopup();
        }
      }
    });
  }

  openImagePopup(src, title) {
    const popup = this.container.querySelector('#base-image-popup-modal');
    const imgEl = this.container.querySelector('#base-popup-img-el');
    const titleEl = this.container.querySelector('#base-popup-img-title');

    if (!popup || !imgEl) return;

    imgEl.src = src;
    imgEl.alt = title || 'Foto Forensik';
    if (titleEl) titleEl.textContent = title || 'Dokumentasi Penindakan DJBC';

    popup.classList.remove('hidden');
  }

  closeImagePopup() {
    const popup = this.container.querySelector('#base-image-popup-modal');
    if (popup) {
      popup.classList.add('hidden');
    }
  }

  switchCardPage(pageIndex) {
    if (pageIndex < 0) pageIndex = 0;
    if (pageIndex >= this.cardPages.length) pageIndex = this.cardPages.length - 1;
    this.currentCardPageIndex = pageIndex;
    const page = this.cardPages[pageIndex];

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
}
