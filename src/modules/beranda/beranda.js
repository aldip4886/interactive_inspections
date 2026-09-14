import { userProfile } from '../../core/user-profile.js';
import { xapi } from '../../core/xapi.js';
import { courseProgress } from '../../core/progress.js';
import berandaData from '../../data/beranda.json';

export class BerandaView {
  constructor(container) {
    this.container = container;
  }

  async render() {
    const profile = userProfile.getProfile();
    const overallPct = courseProgress.getOverallProgress();
    const data = berandaData || {};
    const hero = data.hero || {};
    const disclaimer = data.disclaimer || {};
    const objectives = data.objectives || { items: [] };
    const modules = data.modules || [];

    const getModuleIcon = (id) => {
      switch (id) {
        case 'modul1': return '👤';
        case 'modul2': return '🧳';
        case 'modul3': return '📦';
        case 'modul4a': return '🚗';
        case 'modul4b': return '🚢';
        default: return '🔍';
      }
    };

    const getModuleTagClass = (id) => {
      switch (id) {
        case 'modul1': return 'tag-gold';
        case 'modul2': return 'tag-blue';
        case 'modul3': return 'tag-green';
        case 'modul4a': return 'tag-purple';
        case 'modul4b': return 'tag-gold';
        default: return 'tag-blue';
      }
    };

    const getObjBadgeClass = (idx) => {
      if (idx === 0) return 'badge-blue';
      if (idx === 1) return 'badge-gold';
      return 'badge-green';
    };

    const objectivesHtml = (objectives.items || []).map((obj, idx) => `
      <div class="objective-card">
        <div class="obj-num-badge ${getObjBadgeClass(idx)}">${obj.num || (idx + 1).toString().padStart(2, '0')}</div>
        <h3 class="obj-card-title">${obj.title}</h3>
        <p class="obj-card-desc">${obj.desc}</p>
      </div>
    `).join('');

    const modulesHtml = modules.map(m => `
      <a href="#/${m.route || m.id}" class="module-select-card">
        <div class="module-card-header">
          <div class="module-icon-box">${getModuleIcon(m.id)}</div>
          <span class="module-tag-badge ${getModuleTagClass(m.id)}">${m.code} • ${m.badge}</span>
        </div>
        <div class="module-card-body">
          <h3 class="module-card-title">${m.title}</h3>
          <p class="module-card-desc">${m.desc}</p>
        </div>
        <div class="module-card-footer">
          <span class="footer-link-text">Mulai Inspeksi ${m.code}</span>
          <span class="footer-arrow">→</span>
        </div>
      </a>
    `).join('');

    const html = `
      <div class="beranda-container">
        <!-- ─── 1. HERO BANNER SECTION ─── -->
        <section class="beranda-hero">
          <div class="beranda-hero-bg-overlay"></div>
          <div class="beranda-hero-content">
            <div class="beranda-hero-pretitle">${hero.pretitle || 'e-Learning Narkotika dan Pengawasannya'}</div>
            <h1 class="beranda-hero-title">
              ${hero.title || 'Interactive Narcotics Inspection Simulator'}
            </h1>
            <div class="beranda-hero-actions">
              <a href="#/${hero.actions?.primary?.route || 'modul1'}" class="btn-hero-primary">
                <span>${hero.actions?.primary?.label || 'Mulai Inspeksi Modul 1'}</span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
              </a>
              <a href="#/${hero.actions?.secondary?.route || 'evaluasi'}" class="btn-hero-secondary">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                <span>${hero.actions?.secondary?.label || 'Kuis & Evaluasi Kompetensi'}</span>
              </a>
            </div>
          </div>
        </section>

        <!-- ─── COURSE PROGRESS CARD ─── -->
        <div class="beranda-progress-summary-card">
          <div class="progress-summary-header">
            <div class="progress-summary-title-group">
              <span class="progress-summary-badge">${data.progressCard?.badge || 'PROGRES LATIHAN & COMPLIANCE'}</span>
              <h3 class="progress-summary-title">${data.progressCard?.title || 'Progres Pembelajaran Kursus Anda'}</h3>
            </div>
            <div class="progress-summary-pct-badge font-code-tech">
              <span id="beranda-course-pct">${overallPct}%</span> Selesai
            </div>
          </div>
          <div class="progress-track progress-track-lg">
            <div id="beranda-course-fill" class="progress-fill" style="width: ${overallPct}%;"></div>
          </div>
          <div class="progress-module-grid">
            <div class="mod-prog-item">
              <span class="mod-prog-label">Modul 1: Tubuh Kurir</span>
              <span id="modul1-progress-pct" class="mod-prog-val font-code-tech">${courseProgress.getModuleProgress('modul1')}%</span>
            </div>
            <div class="mod-prog-item">
              <span class="mod-prog-label">Modul 2: Barang Bawaan</span>
              <span id="modul2-progress-pct" class="mod-prog-val font-code-tech">${courseProgress.getModuleProgress('modul2')}%</span>
            </div>
            <div class="mod-prog-item">
              <span class="mod-prog-label">Modul 3: Barang Kiriman</span>
              <span id="modul3-progress-pct" class="mod-prog-val font-code-tech">${courseProgress.getModuleProgress('modul3')}%</span>
            </div>
            <div class="mod-prog-item">
              <span class="mod-prog-label">Modul 4A: SUV</span>
              <span id="modul4a-progress-pct" class="mod-prog-val font-code-tech">${courseProgress.getModuleProgress('modul4a')}%</span>
            </div>
            <div class="mod-prog-item">
              <span class="mod-prog-label">Modul 4B: Kapal Cargo</span>
              <span id="modul4b-progress-pct" class="mod-prog-val font-code-tech">${courseProgress.getModuleProgress('modul4b')}%</span>
            </div>
          </div>
        </div>

        <!-- ─── 2. DISCLAIMER BANNER ─── -->
        <div class="beranda-disclaimer-box">
          <div class="disclaimer-icon">⚠️</div>
          <div class="disclaimer-content">
            <span class="disclaimer-title">${disclaimer.title || 'Disclaimer Resmi Kemenkeu & DJBC:'}</span>
            <p class="disclaimer-desc">
              ${disclaimer.desc}
            </p>
          </div>
        </div>

        <!-- ─── 3. OBJECTIVES SECTION ─── -->
        <section class="beranda-section">
          <div class="section-header-row">
            <div class="section-title-wrap">
              <span class="section-tag-label">${objectives.badge || 'KOMPETENSI UTAMA'}</span>
              <h2 class="section-heading-title">${objectives.title || 'Tujuan Pembelajaran Mandiri'}</h2>
            </div>
          </div>
          <div class="beranda-grid-3col">
            ${objectivesHtml}
          </div>
        </section>

        <!-- ─── 4. MODULES SELECTION GRID ─── -->
        <section class="beranda-section">
          <div class="section-header-row">
            <div class="section-title-wrap">
              <span class="section-tag-label">SIMULASI INTERAKTIF</span>
              <h2 class="section-heading-title">Modul Inspeksi Interaktif</h2>
            </div>
          </div>
          <div class="beranda-grid-2col">
            ${modulesHtml}
          </div>
        </section>
      </div>
    `;

    this.container.innerHTML = html;
    xapi.trackModuleView('beranda', data.pageTitle || 'Beranda & Panduan Inspeksi');
  }
}
