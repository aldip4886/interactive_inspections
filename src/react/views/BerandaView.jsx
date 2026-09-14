import React from 'react';
import { useApp } from '../context/AppContext';
import { courseProgress } from '../../core/progress';
import berandaData from '../../data/beranda.json';

export function BerandaView() {
  const { navigate, overallProgress } = useApp();
  const hero = berandaData.hero || {};
  const disclaimer = berandaData.disclaimer || {};
  const objectives = berandaData.objectives || { items: [] };
  const modules = berandaData.modules || [];

  const getModuleIcon = (id) => {
    switch (id) {
      case 'modul1': return '🧍‍♂️';
      case 'modul2': return '🧳';
      case 'modul3': return '📦';
      case 'modul4a': return '🚙';
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

  return (
    <div className="beranda-container">
      {/* ─── 1. HERO BANNER SECTION ─── */}
      <section className="beranda-hero">
        <div className="beranda-hero-bg-overlay"></div>
        <div className="beranda-hero-content">
          <div className="beranda-hero-pretitle">{hero.pretitle || 'e-Learning Narkotika dan Pengawasannya'}</div>
          <h1 className="beranda-hero-title">
            {hero.title || 'Interactive Narcotics Inspection Simulator'}
          </h1>
          <div className="beranda-hero-actions">
            <button
              onClick={() => navigate(hero.actions?.primary?.route || 'modul1')}
              className="btn-hero-primary"
              style={{ cursor: 'pointer', border: 'none' }}
            >
              <span>{hero.actions?.primary?.label || 'Mulai Inspeksi Modul 1'}</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </button>
            <button
              onClick={() => navigate(hero.actions?.secondary?.route || 'evaluasi')}
              className="btn-hero-secondary"
              style={{ cursor: 'pointer' }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <polyline points="10 9 9 9 8 9"></polyline>
              </svg>
              <span>{hero.actions?.secondary?.label || 'Kuis & Evaluasi Kompetensi'}</span>
            </button>
          </div>
        </div>
      </section>

      {/* ─── COURSE PROGRESS CARD ─── */}
      <div className="beranda-progress-summary-card">
        <div className="progress-summary-header">
          <div className="progress-summary-title-group">
            <span className="progress-summary-badge">{berandaData.progressCard?.badge || 'PROGRES LATIHAN & COMPLIANCE'}</span>
            <h3 className="progress-summary-title">{berandaData.progressCard?.title || 'Progres Pembelajaran Kursus Anda'}</h3>
          </div>
          <div className="progress-summary-pct-badge font-code-tech">
            <span id="beranda-course-pct">{overallProgress}%</span> Selesai
          </div>
        </div>
        <div className="progress-track progress-track-lg">
          <div id="beranda-course-fill" className="progress-fill" style={{ width: `${overallProgress}%` }}></div>
        </div>
        <div className="progress-module-grid">
          <div className="mod-prog-item">
            <span className="mod-prog-label">Modul 1: Tubuh Kurir</span>
            <span className="mod-prog-val font-code-tech">{courseProgress.getModuleProgress('modul1')}%</span>
          </div>
          <div className="mod-prog-item">
            <span className="mod-prog-label">Modul 2: Barang Bawaan</span>
            <span className="mod-prog-val font-code-tech">{courseProgress.getModuleProgress('modul2')}%</span>
          </div>
          <div className="mod-prog-item">
            <span className="mod-prog-label">Modul 3: Barang Kiriman</span>
            <span className="mod-prog-val font-code-tech">{courseProgress.getModuleProgress('modul3')}%</span>
          </div>
          <div className="mod-prog-item">
            <span className="mod-prog-label">Modul 4A: SUV Darat</span>
            <span className="mod-prog-val font-code-tech">{courseProgress.getModuleProgress('modul4a')}%</span>
          </div>
          <div className="mod-prog-item">
            <span className="mod-prog-label">Modul 4B: Kapal Cargo</span>
            <span className="mod-prog-val font-code-tech">{courseProgress.getModuleProgress('modul4b')}%</span>
          </div>
        </div>
      </div>

      {/* ─── 2. DISCLAIMER BANNER ─── */}
      <div className="beranda-disclaimer-box">
        <div className="disclaimer-icon">⚠️</div>
        <div className="disclaimer-content">
          <span className="disclaimer-title">{disclaimer.title || 'Disclaimer'}</span>
          <p className="disclaimer-desc">
            {disclaimer.desc}
          </p>
        </div>
      </div>

      {/* ─── 3. OBJECTIVES SECTION ─── */}
      <section className="beranda-section">
        <div className="section-header-row">
          <div className="section-title-wrap">
            <span className="section-tag-label">{objectives.badge || 'KOMPETENSI UTAMA'}</span>
            <h2 className="section-heading-title">{objectives.title || 'Tujuan Pembelajaran Mandiri'}</h2>
          </div>
        </div>
        <div className="beranda-grid-3col">
          {objectives.items.map((obj, idx) => (
            <div className="objective-card" key={idx}>
              <div className={`obj-num-badge ${getObjBadgeClass(idx)}`}>{obj.num}</div>
              <h3 className="obj-card-title">{obj.title}</h3>
              <p className="obj-card-desc">{obj.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── 4. MODULE SELECTOR GRID ─── */}
      <section className="beranda-section">
        <div className="section-header-row">
          <div className="section-title-wrap">
            <span className="section-tag-label">DAFTAR SIMULATOR</span>
            <h2 className="section-heading-title">Pilih Area Pemeriksaan Interaktif</h2>
          </div>
        </div>
        <div className="beranda-grid-2col">
          {modules.map((m) => (
            <div
              key={m.id}
              className="module-select-card"
              onClick={() => navigate(m.route || m.id)}
              style={{ cursor: 'pointer' }}
            >
              <div className="module-card-header">
                <div className="module-icon-box">{getModuleIcon(m.id)}</div>
                <span className={`module-tag-badge ${getModuleTagClass(m.id)} font-code-tech`}>
                  {m.code} • {m.badge}
                </span>
              </div>
              <div className="module-card-body">
                <h3 className="module-card-title">{m.title}</h3>
                <p className="module-card-desc">{m.desc}</p>
              </div>
              <div className="module-card-footer">
                <span className="footer-link-text">Buka Simulator {m.code}</span>
                <span className="footer-arrow">→</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
