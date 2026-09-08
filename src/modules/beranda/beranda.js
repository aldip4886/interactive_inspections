import { userProfile } from '../../core/user-profile.js';
import { xapi } from '../../core/xapi.js';

export class BerandaView {
  constructor(container) {
    this.container = container;
  }

  async render() {
    const profile = userProfile.getProfile();

    const html = `
      <div style="width: 100%; height: 100%; overflow-y: auto; padding: var(--container-padding); display: flex; flex-direction: column; gap: var(--space-4); max-width: var(--content-max); margin: 0 auto;">
        
        <!-- Hero Section (Dharma Bhakti Atlas Style) -->
        <section style="background: linear-gradient(135deg, var(--color-primary-container) 0%, #001530 100%); color: white; border-radius: var(--radius-xl); padding: 48px; position: relative; overflow: hidden; box-shadow: var(--shadow-card);">
          <div style="max-width: 780px; position: relative; z-index: 2;">
            <span class="badge badge-gold" style="margin-bottom: 16px;">
              MP3 — Modus Operandi & Inspeksi Narkotika DJBC
            </span>
            <h1 style="font-size: var(--font-size-display); font-weight: 700; color: #FFFFFF; line-height: 1.15; margin-bottom: 16px;">
              Interactive Narcotics Inspection Simulator
            </h1>
            <p style="font-size: var(--font-size-body-lg); color: rgba(255, 255, 255, 0.9); margin-bottom: 28px; line-height: 1.6;">
              Selamat datang, <strong style="color: var(--color-secondary-container);">${profile.name}</strong> (${profile.nip || profile.username}). Media pembelajaran interaktif berbasis simulasi pengawasan X-Ray, 360° rotation, dan hotspot inspeksi untuk mendeteksi titik-titik penyembunyian Narkotika pada 4 kategori utama.
            </p>
            <div style="display: flex; gap: 16px; flex-wrap: wrap;">
              <a href="#/modul1" class="btn btn-secondary btn-lg">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>
                Mulai Inspeksi Modul 1
              </a>
              <a href="#/evaluasi" class="btn btn-ghost btn-lg" style="color: white; border-color: rgba(255,255,255,0.4);">
                Uji Pemahaman (Evaluasi)
              </a>
            </div>
          </div>
        </section>

        <!-- Mandatory Disclaimer Banner -->
        <div class="disclaimer-banner">
          <svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
          <div>
            <strong>Disclaimer Resmi Kemenkeu & DJBC:</strong> Simulasi inspeksi ini dikembangkan khusus untuk tujuan pembelajaran mandiri dan peningkatan ketajaman teknis pegawai Direktorat Jenderal Bea dan Cukai. Tindakan interdiksi resmi di lapangan wajib mematuhi SOP dan petunjuk teknis DJBC yang berlaku.
          </div>
        </div>

        <!-- Learning Objectives Grid -->
        <section style="margin-bottom: 24px;">
          <h2 style="font-size: var(--font-size-headline-md); font-weight: 700; margin-bottom: 16px; color: var(--color-primary-container);">
            Tujuan Pembelajaran Mandiri
          </h2>
          <div class="grid-3col">
            <div class="card">
              <div style="width: 48px; height: 48px; background: #e0f2fe; color: #0284c7; border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center; margin-bottom: 16px; font-weight: bold; font-size: 20px;">01</div>
              <h3 style="font-size: var(--font-size-title-lg); font-weight: 600; margin-bottom: 8px;">Identifikasi Modus</h3>
              <p style="font-size: var(--font-size-body-md); color: var(--color-on-surface-variant);">Memahami pemetaan metode concealment pada tubuh kurir, barang bawaan, barang kiriman pos/PJT, serta sarana pengangkut darat dan laut.</p>
            </div>
            <div class="card">
              <div style="width: 48px; height: 48px; background: #fef3c7; color: #d97706; border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center; margin-bottom: 16px; font-weight: bold; font-size: 20px;">02</div>
              <h3 style="font-size: var(--font-size-title-lg); font-weight: 600; margin-bottom: 8px;">Analisis Citra X-Ray</h3>
              <p style="font-size: var(--font-size-body-md); color: var(--color-on-surface-variant);">Mengamati citra X-Ray, Cutaway View, dan 360° Rotation dengan hotspot interaktif untuk mengenali indikator risiko (red flags).</p>
            </div>
            <div class="card">
              <div style="width: 48px; height: 48px; background: #dcfce7; color: #15803d; border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center; margin-bottom: 16px; font-weight: bold; font-size: 20px;">03</div>
              <h3 style="font-size: var(--font-size-title-lg); font-weight: 600; margin-bottom: 8px;">Penerapan SOP Bea Cukai</h3>
              <p style="font-size: var(--font-size-body-md); color: var(--color-on-surface-variant);">Mempelajari langkah penindakan, penggeledahan fisik, uji reagen laboratorium, dan evakuasi medis sesuai standar DJBC.</p>
            </div>
          </div>
        </section>

        <!-- 4 Key Modules Interactive Grid -->
        <section style="margin-bottom: 32px;">
          <h2 style="font-size: var(--font-size-headline-md); font-weight: 700; margin-bottom: 16px; color: var(--color-primary-container);">
            Modul Inspeksi Interaktif
          </h2>
          <div class="grid-2col">
            
            <!-- Modul 1 Card -->
            <a href="#/modul1" class="card card-interactive" style="display: flex; gap: 20px; align-items: center; text-decoration: none; color: inherit;">
              <div style="width: 64px; height: 64px; background-color: var(--color-primary-container); color: white; border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-size: 28px;">
                👤
              </div>
              <div>
                <h3 style="font-size: var(--font-size-title-lg); font-weight: 700; margin-bottom: 4px;">1. Tubuh Kurir (Body Concealment)</h3>
                <p style="color: var(--color-on-surface-variant); font-size: var(--font-size-body-md);">Inspeksi 360° anatomi & X-Ray tubuh: Ingestion (telan), Insertion (anal/vaginal), Body Strapping, & Modus Terkini.</p>
              </div>
            </a>

            <!-- Modul 2 Card -->
            <a href="#/modul2" class="card card-interactive" style="display: flex; gap: 20px; align-items: center; text-decoration: none; color: inherit;">
              <div style="width: 64px; height: 64px; background-color: var(--color-secondary-container); color: #261a00; border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-size: 28px;">
                🧳
              </div>
              <div>
                <h3 style="font-size: var(--font-size-title-lg); font-weight: 700; margin-bottom: 4px;">2. Barang Bawaan (Luggage)</h3>
                <p style="color: var(--color-on-surface-variant); font-size: var(--font-size-body-md);">Pemeriksaan koper bagasi penumpang: False Bottom, Dinding Ganda, Rangka Trolley, Sepatu (False Sole), & Buku.</p>
              </div>
            </a>

            <!-- Modul 3 Card -->
            <a href="#/modul3" class="card card-interactive" style="display: flex; gap: 20px; align-items: center; text-decoration: none; color: inherit;">
              <div style="width: 64px; height: 64px; background-color: var(--color-primary-container); color: white; border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-size: 28px;">
                📦
              </div>
              <div>
                <h3 style="font-size: var(--font-size-title-lg); font-weight: 700; margin-bottom: 4px;">3. Barang Kiriman (Postal Cargo)</h3>
                <p style="color: var(--color-on-surface-variant); font-size: var(--font-size-body-md);">Inspeksi kargo Pos & PJT: Kaleng Makanan (Liquid Meth), Kardus Corrugated, Elektronik, & Kemasan Teh Guanyinwang.</p>
              </div>
            </a>

            <!-- Modul 4A & 4B Card -->
            <a href="#/modul4a" class="card card-interactive" style="display: flex; gap: 20px; align-items: center; text-decoration: none; color: inherit;">
              <div style="width: 64px; height: 64px; background-color: var(--color-secondary-container); color: #261a00; border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-size: 28px;">
                🚗
              </div>
              <div>
                <h3 style="font-size: var(--font-size-title-lg); font-weight: 700; margin-bottom: 4px;">4. Sarana Pengangkut (Darat & Laut)</h3>
                <p style="color: var(--color-on-surface-variant); font-size: var(--font-size-body-md);">Inspeksi 360° Kompartemen Pintu Mobil, Tangki Bahan Bakar Dinding Ganda, Kontainer Reefer, & Kapal Kargo.</p>
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
