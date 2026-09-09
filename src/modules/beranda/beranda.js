import { userProfile } from '../../core/user-profile.js';
import { xapi } from '../../core/xapi.js';

export class BerandaView {
  constructor(container) {
    this.container = container;
  }

  async render() {
    const profile = userProfile.getProfile();

    const html = `
      <div class="beranda-container">
        <!-- ─── 1. HERO BANNER SECTION ─── -->
        <section class="beranda-hero">
          <div class="beranda-hero-bg-overlay"></div>
          <div class="beranda-hero-content">
            <div class="beranda-hero-pretitle">e-Learning Narkotika dan Pengawasannya</div>
            <h1 class="beranda-hero-title">
              Interactive Narcotics Inspection Simulator
            </h1>
            <div class="beranda-hero-actions">
              <a href="#/modul1" class="btn-hero-primary">
                <span>Mulai Inspeksi Modul 1</span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
              </a>
              <a href="#/evaluasi" class="btn-hero-secondary">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                <span>Kuis & Evaluasi Kompetensi</span>
              </a>
            </div>
          </div>
        </section>

        <!-- ─── 2. DISCLAIMER BANNER ─── -->
        <div class="beranda-disclaimer-box">
          <div class="disclaimer-icon">⚠️</div>
          <div class="disclaimer-content">
            <span class="disclaimer-title">Disclaimer Resmi Kemenkeu & DJBC:</span>
            <p class="disclaimer-desc">
              Simulasi inspeksi ini dikembangkan khusus untuk tujuan pembelajaran mandiri dan peningkatan ketajaman teknis pegawai Direktorat Jenderal Bea dan Cukai. Tindakan interdiksi resmi di lapangan wajib mematuhi SOP dan petunjuk teknis DJBC yang berlaku.
            </p>
          </div>
        </div>

        <!-- ─── 3. OBJECTIVES SECTION ─── -->
        <section class="beranda-section">
          <div class="section-header-row">
            <div class="section-title-wrap">
              <span class="section-tag-label">KOMPETENSI UTAMA</span>
              <h2 class="section-heading-title">Tujuan Pembelajaran Mandiri</h2>
            </div>
          </div>
          <div class="beranda-grid-3col">
            <div class="objective-card">
              <div class="obj-num-badge badge-blue">01</div>
              <h3 class="obj-card-title">Identifikasi Modus Operandi</h3>
              <p class="obj-card-desc">Memahami pemetaan metode concealment pada tubuh kurir, barang bawaan bagasi, barang kiriman pos/PJT, serta sarana pengangkut darat dan laut.</p>
            </div>
            <div class="objective-card">
              <div class="obj-num-badge badge-gold">02</div>
              <h3 class="obj-card-title">Analisis Citra Forensik & X-Ray</h3>
              <p class="obj-card-desc">Mengamati citra X-Ray, Cutaway View, dan 360° Rotation dengan hotspot interaktif untuk mengenali indikator risiko (*red flags*) penyembunyian.</p>
            </div>
            <div class="objective-card">
              <div class="obj-num-badge badge-green">03</div>
              <h3 class="obj-card-title">Penerapan SOP Interdiksi DJBC</h3>
              <p class="obj-card-desc">Mempelajari langkah penindakan, penggeledahan fisik, uji reagen laboratorium, dan protokol pengamanan sesuai standar resmi DJBC.</p>
            </div>
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
            
            <!-- Modul 1 -->
            <a href="#/modul1" class="module-select-card">
              <div class="module-card-header">
                <div class="module-icon-box">👤</div>
                <span class="module-tag-badge tag-gold">MODUL 01 • ANATOMI 360°</span>
              </div>
              <div class="module-card-body">
                <h3 class="module-card-title">1. Tubuh Kurir (Body Concealment)</h3>
                <p class="module-card-desc">Inspeksi 360° anatomi & citra forensik X-Ray tubuh: Ingestion (telan), Insertion (anal/vaginal), Body Strapping, & Modus Terkini.</p>
              </div>
              <div class="module-card-footer">
                <span class="footer-link-text">Mulai Inspeksi Modul 1</span>
                <span class="footer-arrow">→</span>
              </div>
            </a>

            <!-- Modul 2 -->
            <a href="#/modul2" class="module-select-card">
              <div class="module-card-header">
                <div class="module-icon-box">🧳</div>
                <span class="module-tag-badge tag-blue">MODUL 02 • X-RAY LUGGAGE</span>
              </div>
              <div class="module-card-body">
                <h3 class="module-card-title">2. Barang Bawaan (Luggage)</h3>
                <p class="module-card-desc">Pemeriksaan koper & bagasi penumpang: False Bottom, Dinding Ganda, Rangka Trolley, Sepatu (False Sole), & Kitab/Buku.</p>
              </div>
              <div class="module-card-footer">
                <span class="footer-link-text">Mulai Inspeksi Modul 2</span>
                <span class="footer-arrow">→</span>
              </div>
            </a>

            <!-- Modul 3 -->
            <a href="#/modul3" class="module-select-card">
              <div class="module-card-header">
                <div class="module-icon-box">📦</div>
                <span class="module-tag-badge tag-green">MODUL 03 • KARGO POS & PJT</span>
              </div>
              <div class="module-card-body">
                <h3 class="module-card-title">3. Barang Kiriman (Postal Cargo)</h3>
                <p class="module-card-desc">Inspeksi kargo Pos & PJT: Kaleng Makanan (Liquid Meth), Kardus Corrugated, Elektronik, & Kemasan Teh Guanyinwang.</p>
              </div>
              <div class="module-card-footer">
                <span class="footer-link-text">Mulai Inspeksi Modul 3</span>
                <span class="footer-arrow">→</span>
              </div>
            </a>

            <!-- Modul 4 -->
            <a href="#/modul4a" class="module-select-card">
              <div class="module-card-header">
                <div class="module-icon-box">🚗</div>
                <span class="module-tag-badge tag-purple">MODUL 04 • SARANA PENGANGKUT</span>
              </div>
              <div class="module-card-body">
                <h3 class="module-card-title">4. Sarana Pengangkut (Darat & Laut)</h3>
                <p class="module-card-desc">Inspeksi 360° Kompartemen Pintu Mobil, Tangki Bahan Bakar Dinding Ganda, Kontainer Reefer, & Kapal Kargo Laut.</p>
              </div>
              <div class="module-card-footer">
                <span class="footer-link-text">Mulai Inspeksi Modul 4</span>
                <span class="footer-arrow">→</span>
              </div>
            </a>

          </div>
        </section>
      </div>
    `;

    this.container.innerHTML = html;
    xapi.trackModuleView('beranda', 'Beranda & Panduan Inspeksi');
  }
}
