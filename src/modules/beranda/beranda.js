import { userProfile } from '../../core/user-profile.js';
import { xapi } from '../../core/xapi.js';

export class BerandaView {
  constructor(container) {
    this.container = container;
  }

  async render() {
    const profile = userProfile.getProfile();

    const html = `
      <div style="width: 100%; height: 100%; overflow-y: auto; padding: 32px; display: flex; flex-direction: column; gap: 32px; max-width: 1280px; margin: 0 auto;">
        
        <!-- Hero Section -->
        <div style="background: linear-gradient(135deg, rgba(18, 34, 56, 0.9) 0%, rgba(10, 22, 40, 0.95) 100%); border: 1px solid var(--surface-glass-border); border-radius: var(--radius-xl); padding: 36px; display: flex; align-items: center; justify-content: space-between; box-shadow: var(--shadow-lg); position: relative; overflow: hidden;">
          <div style="position: absolute; right: -40px; top: -40px; width: 300px; height: 300px; background: var(--accent-gold-glow); filter: blur(80px); border-radius: 50%; pointer-events: none;"></div>

          <div style="max-width: 720px; z-index: 1;">
            <div class="badge badge-gold" style="margin-bottom: 12px; font-size: 0.8rem;">E-LEARNING INTERAKTIF DJBC 2026</div>
            <h1 style="font-size: 2.2rem; margin-bottom: 12px; color: #FFF; line-height: 1.2;">
              Inspeksi Modus Penyelundupan Narkotika
            </h1>
            <p style="font-size: 1rem; color: var(--text-secondary); line-height: 1.6; margin-bottom: 24px;">
              Selamat datang, <strong style="color: var(--accent-gold);">${profile.name}</strong> (${profile.nip || profile.username}). Modul ini dirancang khusus untuk meningkatkan kapabilitas teknis pegawai Direktorat Jenderal Bea dan Cukai dalam mendeteksi dan menginspeksi titik-titik penyembunyian Narkotika pada 4 moda pemeriksaan utama.
            </p>
            <div style="display: flex; gap: 16px;">
              <a href="#/modul1" class="btn btn-gold">
                🚀 Mulai Pembelajaran (Modul 1)
              </a>
              <a href="#/evaluasi" class="btn btn-outline">
                📝 Ujian Evaluasi
              </a>
            </div>
          </div>

          <div style="display: flex; flex-direction: column; gap: 12px; z-index: 1; min-width: 220px; background: rgba(0,0,0,0.3); padding: 20px; border-radius: var(--radius-lg); border: 1px solid var(--surface-glass-border);">
            <div style="font-size: 0.78rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase;">STATUS ANALYTICS xAPI</div>
            <div style="display: flex; align-items: center; gap: 10px;">
              <span style="width: 10px; height: 10px; border-radius: 50%; background: #34C759;"></span>
              <span style="font-size: 0.85rem; font-weight: 600; color: #FFF;">KLC Session Connected</span>
            </div>
            <div style="font-size: 0.75rem; color: var(--text-secondary);">
              Metode Auth: <code style="color: var(--accent-gold);">${userProfile.getAuthMethod()}</code>
            </div>
          </div>
        </div>

        <!-- 4 Key Modules Cards -->
        <div>
          <h2 style="font-size: 1.3rem; color: #FFF; margin-bottom: 16px;">Kategori Modul Inspeksi Interaktif</h2>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px;">
            
            <!-- Modul 1 Card -->
            <a href="#/modul1" style="text-decoration: none; color: inherit;">
              <div class="card-hover" style="background: var(--bg-dark-800); border: 1px solid var(--surface-glass-border); border-radius: var(--radius-lg); padding: 24px; display: flex; flex-direction: column; gap: 12px; transition: transform 0.2s, border-color 0.2s;">
                <div style="font-size: 2.2rem;">👤</div>
                <h3 style="font-size: 1.1rem; color: #FFF; margin: 0;">1. Tubuh Kurir</h3>
                <p style="font-size: 0.85rem; color: var(--text-secondary); margin: 0; line-height: 1.5;">
                  Inspeksi anatomi & X-Ray tubuh kurir: Body Packing (swallowing pellets), Body Strapping, dan Insertion.
                </p>
                <div style="font-size: 0.8rem; font-weight: 600; color: var(--accent-gold); margin-top: auto;">Buka Modul 1 &rarr;</div>
              </div>
            </a>

            <!-- Modul 2 Card -->
            <a href="#/modul2" style="text-decoration: none; color: inherit;">
              <div class="card-hover" style="background: var(--bg-dark-800); border: 1px solid var(--surface-glass-border); border-radius: var(--radius-lg); padding: 24px; display: flex; flex-direction: column; gap: 12px; transition: transform 0.2s, border-color 0.2s;">
                <div style="font-size: 2.2rem;">🧳</div>
                <h3 style="font-size: 1.1rem; color: #FFF; margin: 0;">2. Barang Bawaan</h3>
                <p style="font-size: 0.85rem; color: var(--text-secondary); margin: 0; line-height: 1.5;">
                  Pemeriksaan koper bagasi penumpang: False Bottom, Dinding Ganda, Rangka Trolley, & Lipatan Jahitan.
                </p>
                <div style="font-size: 0.8rem; font-weight: 600; color: var(--accent-gold); margin-top: auto;">Buka Modul 2 &rarr;</div>
              </div>
            </a>

            <!-- Modul 3 Card -->
            <a href="#/modul3" style="text-decoration: none; color: inherit;">
              <div class="card-hover" style="background: var(--bg-dark-800); border: 1px solid var(--surface-glass-border); border-radius: var(--radius-lg); padding: 24px; display: flex; flex-direction: column; gap: 12px; transition: transform 0.2s, border-color 0.2s;">
                <div style="font-size: 2.2rem;">📦</div>
                <h3 style="font-size: 1.1rem; color: #FFF; margin: 0;">3. Barang Kiriman</h3>
                <p style="font-size: 0.85rem; color: var(--text-secondary); margin: 0; line-height: 1.5;">
                  Inspeksi kargo Pos & PJT: Kaleng Makanan Palsu (Liquid Meth), Kardus Corrugated, & Elektronik.
                </p>
                <div style="font-size: 0.8rem; font-weight: 600; color: var(--accent-gold); margin-top: auto;">Buka Modul 3 &rarr;</div>
              </div>
            </a>

            <!-- Modul 4A & 4B Card -->
            <a href="#/modul4a" style="text-decoration: none; color: inherit;">
              <div class="card-hover" style="background: var(--bg-dark-800); border: 1px solid var(--surface-glass-border); border-radius: var(--radius-lg); padding: 24px; display: flex; flex-direction: column; gap: 12px; transition: transform 0.2s, border-color 0.2s;">
                <div style="font-size: 2.2rem;">🚗 🚢</div>
                <h3 style="font-size: 1.1rem; color: #FFF; margin: 0;">4. Sarana Pengangkut</h3>
                <p style="font-size: 0.85rem; color: var(--text-secondary); margin: 0; line-height: 1.5;">
                  Pemeriksaan Kompartemen Pintu Mobil, Tangki Bahan Bakar Dinding Ganda, Kontainer Reefer, & Kapal Laut.
                </p>
                <div style="font-size: 0.8rem; font-weight: 600; color: var(--accent-gold); margin-top: auto;">Buka Modul 4 &rarr;</div>
              </div>
            </a>

          </div>
        </div>

        <!-- Instructions Section -->
        <div style="background: rgba(255,255,255,0.02); border: 1px solid var(--surface-glass-border); border-radius: var(--radius-lg); padding: 24px;">
          <h3 style="font-size: 1.1rem; color: var(--accent-gold); margin-bottom: 12px;">📌 Panduan Navigasi & Fitur Modul</h3>
          <ul style="color: var(--text-secondary); font-size: 0.9rem; line-height: 1.8; margin-left: 20px;">
            <li>Gunakan tombol <strong>X-Ray View / Cutaway View</strong> untuk beralih antara tampilan fisik normal dan tampilan sinar-X / penampang irisan.</li>
            <li>Klik atau hover <strong>Hotspot Berpendar (Pulse Marker)</strong> di layar untuk melihat gambar visual realistis modus, indikator risiko, dan SOP tindakan Bea Cukai.</li>
            <li>Gunakan <strong>Bottom Thumbnail Carousel</strong> untuk melompat langsung ke titik penyembunyian tertentu.</li>
            <li>Selesaikan seluruh modul interaktif kemudian ikuti <strong>Ujian Evaluasi</strong> untuk mendapatkan kelulusan SCORM & xAPI.</li>
          </ul>
        </div>

      </div>
    `;

    this.container.innerHTML = html;
    xapi.trackModuleView('beranda', 'Beranda & Panduan Inspeksi');
  }
}
