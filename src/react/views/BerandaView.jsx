import React from 'react';
import { useApp } from '../context/AppContext';
import { courseProgress } from '../../core/progress';

export function BerandaView() {
  const { navigate, overallProgress } = useApp();

  return (
    <div className="beranda-container">
      {/* ─── 1. HERO BANNER SECTION ─── */}
      <section className="beranda-hero">
        <div className="beranda-hero-bg-overlay"></div>
        <div className="beranda-hero-content">
          <div className="beranda-hero-pretitle">e-Learning Narkotika dan Pengawasannya</div>
          <h1 className="beranda-hero-title">
            Interactive Narcotics Inspection Simulator
          </h1>
          <div className="beranda-hero-actions">
            <button
              onClick={() => navigate('modul1')}
              className="btn-hero-primary"
              style={{ cursor: 'pointer', border: 'none' }}
            >
              <span>Mulai Inspeksi Modul 1</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </button>
            <button
              onClick={() => navigate('evaluasi')}
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
              <span>Kuis & Evaluasi Kompetensi</span>
            </button>
          </div>
        </div>
      </section>

      {/* ─── COURSE PROGRESS CARD ─── */}
      <div className="beranda-progress-summary-card">
        <div className="progress-summary-header">
          <div className="progress-summary-title-group">
            <span className="progress-summary-badge">PROGRES LATIHAN & COMPLIANCE</span>
            <h3 className="progress-summary-title">Progres Pembelajaran Kursus Anda</h3>
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
            <span className="mod-prog-label">Modul 4A: SUV</span>
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
          <span className="disclaimer-title">Disclaimer Resmi Kemenkeu & DJBC:</span>
          <p className="disclaimer-desc">
            Simulasi inspeksi ini dikembangkan khusus untuk tujuan pembelajaran mandiri dan peningkatan ketajaman teknis pegawai Direktorat Jenderal Bea dan Cukai. Tindakan interdiksi resmi di lapangan wajib mematuhi SOP dan petunjuk teknis DJBC yang berlaku.
          </p>
        </div>
      </div>

      {/* ─── 3. OBJECTIVES SECTION ─── */}
      <section className="beranda-section">
        <div className="section-header-row">
          <div className="section-title-wrap">
            <span className="section-tag-label">KOMPETENSI UTAMA</span>
            <h2 className="section-heading-title">Tujuan Pembelajaran Mandiri</h2>
          </div>
        </div>
        <div className="beranda-grid-3col">
          <div className="objective-card">
            <div className="obj-num-badge badge-blue">01</div>
            <h3 className="obj-card-title">Identifikasi Modus Operandi</h3>
            <p className="obj-card-desc">Memahami pemetaan metode concealment pada tubuh kurir, barang bawaan bagasi, barang kiriman pos/PJT, serta sarana pengangkut darat dan laut.</p>
          </div>
          <div className="objective-card">
            <div className="obj-num-badge badge-gold">02</div>
            <h3 className="obj-card-title">Teknik Deteksi Forensik</h3>
            <p className="obj-card-desc">Menguasai pembacaan citra radiologi (X-Ray transmission), analisis densitas anomali, uji reagen spesifik, dan protokol pembongkaran kompartemen palsu.</p>
          </div>
          <div className="objective-card">
            <div className="obj-num-badge badge-green">03</div>
            <h3 className="obj-card-title">SOP & Keselamatan Petugas</h3>
            <p className="obj-card-desc">Menerapkan prosedur penindakan hukum berstandar DJBC dengan mengutamakan perlindungan diri dari bahaya zat toksik dan penanganan medis darurat tersangka.</p>
          </div>
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
          <div className="module-select-card" onClick={() => navigate('modul1')} style={{ cursor: 'pointer' }}>
            <div className="module-card-header">
              <div className="module-icon-box">🧍‍♂️</div>
              <span className="module-tag-badge tag-gold font-code-tech">MODUL 01</span>
            </div>
            <div className="module-card-body">
              <h3 className="module-card-title">Pemeriksaan Tubuh Kurir (Body Concealment)</h3>
              <p className="module-card-desc">Simulator 360° anatomi tubuh manusia untuk mendeteksi modus Ingestion (body packing), Insertion (body pushing), strapping paha/betis, dan prostetik.</p>
            </div>
            <div className="module-card-footer">
              <span className="footer-link-text">Buka Simulator 360°</span>
              <span className="footer-arrow">→</span>
            </div>
          </div>

          <div className="module-select-card" onClick={() => navigate('modul2')} style={{ cursor: 'pointer' }}>
            <div className="module-card-header">
              <div className="module-icon-box">🧳</div>
              <span className="module-tag-badge tag-blue font-code-tech">MODUL 02</span>
            </div>
            <div className="module-card-body">
              <h3 className="module-card-title">Pemeriksaan Barang Bawaan (Luggage Concealment)</h3>
              <p className="module-card-desc">Analisis koper dinding ganda (false wall), frame troli berongga, alas ganda (false bottom), dan kamuflase kemasan makanan/cairan di terminal penumpang.</p>
            </div>
            <div className="module-card-footer">
              <span className="footer-link-text">Buka Inspeksi Bagasi</span>
              <span className="footer-arrow">→</span>
            </div>
          </div>

          <div className="module-select-card" onClick={() => navigate('modul3')} style={{ cursor: 'pointer' }}>
            <div className="module-card-header">
              <div className="module-icon-box">📦</div>
              <span className="module-tag-badge tag-green font-code-tech">MODUL 03</span>
            </div>
            <div className="module-card-body">
              <h3 className="module-card-title">Pemeriksaan Barang Kiriman (Postal & Courier)</h3>
              <p className="module-card-desc">Pemeriksaan paket e-commerce, sparepart mesin bermuatan narkotika, dokumen palsu, dan analisis citra pemindai kargo pos internasional.</p>
            </div>
            <div className="module-card-footer">
              <span className="footer-link-text">Buka Inspeksi Kargo Pos</span>
              <span className="footer-arrow">→</span>
            </div>
          </div>

          <div className="module-select-card" onClick={() => navigate('modul4a')} style={{ cursor: 'pointer' }}>
            <div className="module-card-header">
              <div className="module-icon-box">🚙</div>
              <span className="module-tag-badge tag-purple font-code-tech">MODUL 04A</span>
            </div>
            <div className="module-card-body">
              <h3 className="module-card-title">Sarana Pengangkut Darat (SUV / Truk)</h3>
              <p className="module-card-desc">Deteksi tangki bahan bakar modifikasi, pilar sasis berongga, ban serep berpemberat, dan kompartemen tersembunyi ber-aktuator magnetik.</p>
            </div>
            <div className="module-card-footer">
              <span className="footer-link-text">Buka Inspeksi Kendaraan</span>
              <span className="footer-arrow">→</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
