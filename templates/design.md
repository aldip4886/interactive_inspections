# Design System & UI Specification — DJBC Interactive Organization Explorer

> **Standar Desain Resmi Antarmuka Aplikasi DJBC**  
> Dokumen ini merupakan panduan spesifikasi desain (*Design System Specification*) lengkap untuk proyek **Interactive Organization Explorer DJBC** dan proyek-proyek turunan lainnya dalam ekosistem Direktorat Jenderal Bea dan Cukai, Kementerian Keuangan RI. Panduan ini memastikan konsistensi visual, interaktivitas, aksesibilitas, dan identitas institusional yang presisi antar aplikasi.

---

## 1. Filosofi & Karakteristik Desain

- **Identitas Visual:** Institusional Kementerian Keuangan / DJBC modern, berwibawa, bersih, terstruktur, dan elegan.
- **Prinsip Utama:**
  1. **Clarity First:** Informasi hierarki organisasi dan data geografis disajikan tanpa distraksi dekoratif yang berlebihan.
  2. **High-Contrast Legibility:** Teks dan elemen navigasi memiliki rasio kontras tinggi (memenuhi standar WCAG AAA).
  3. **Fluid Micro-interactions:** Animasi halus (*cubic-bezier easing*) pada hover titik, buka drawer, filter pill, dan transisi tema.
  4. **Strictly Avoided:** Efek neon ungu generik, teks gradien berlebihan, border animasi bergerak (*rainbow border*), dan *visual clutter*.

---

## 2. Design Tokens & Variabel CSS

### 2.1 Palet Warna Utama (Institutional Palette)

```css
:root {
  /* Brand Colors */
  --color-primary-navy: #0B3A6F;       /* Navy DJBC Utama */
  --color-deep-navy: #062B52;          /* Navy Gelap (Header, Active Sidebar) */
  --color-dark-sidebar: #041E3A;       /* Background Sidebar Gelap */
  --color-gold: #D9B45B;               /* Emas Kemenkeu Aksen */
  --color-gold-hover: #C9A34E;         /* Emas Hover */
  --color-gold-light: #FDF9EE;         /* Emas Soft / Highlight */
  --color-secondary: #0284C7;          /* Sky Blue Interaktif & Kanwil */
  --color-accent-blue: #2F80ED;        /* Biru Aksen Tombol */
  --color-accent-blue-light: #EBF3FE;  /* Biru Muda Latar */

  /* Neutral Background & Surface */
  --color-bg-main: #EEF2F7;            /* Background Aplikasi & Peta */
  --color-surface: #FFFFFF;            /* Kartu, Drawer, Modal */
  --color-surface-trans: rgba(255, 255, 255, 0.95); /* Floating Card Blur */
  --color-surface-hover: #F8FAFC;      /* Hover State Item */
  --color-border: #D9E0E8;             /* Border Halus */
  --color-border-light: #E5E9F0;       /* Divider */

  /* Tipografi Teks */
  --color-text-main: #062B52;          /* Teks Utama (Navy Gelap) */
  --color-text-primary: #1F2937;       /* Teks Body Netral */
  --color-text-muted: #64748B;         /* Teks Sekunder / Keterangan */
  --color-text-on-dark: #FFFFFF;       /* Teks di atas Latar Gelap */
  --color-text-on-gold: #1A1A1A;       /* Teks di atas Latar Emas */

  /* Feedback & Status */
  --color-success: #10B981;            /* Sukses / BLBC / Hijau */
  --color-success-bg: #ECFDF5;
  --color-warning: #D97706;            /* Peringatan / KPU / Oranye */
  --color-warning-bg: #FFFBEB;
  --color-danger: #EF4444;             /* Bahaya / PSO / Merah */
  --color-danger-bg: #FEF2F2;
  --color-info: #0284C7;               /* Info / Sky Blue */
  --color-info-bg: #F0F9FF;
}
```

### 2.2 Dark Mode Design Tokens

```css
[data-theme="dark"],
body.theme-dark {
  --color-primary-navy: #38BDF8;
  --color-deep-navy: #0B192C;
  --color-dark-sidebar: #070D1F;
  --color-gold: #FBBF24;
  --color-gold-hover: #F59E0B;
  --color-gold-light: #2D2714;
  --color-secondary: #38BDF8;
  --color-accent-blue: #60A5FA;
  --color-accent-blue-light: #1E293B;

  --color-bg-main: #0B1120;
  --color-surface: #1E293B;
  --color-surface-trans: rgba(30, 41, 59, 0.95);
  --color-surface-hover: #233154;
  --color-border: #334155;
  --color-border-light: #1E293B;

  --color-text-main: #F8FAFC;
  --color-text-primary: #F1F5F9;
  --color-text-muted: #94A3B8;
  --color-text-on-dark: #FFFFFF;

  --shadow-sm: 0 2px 6px rgba(0, 0, 0, 0.3);
  --shadow-md: 0 4px 18px rgba(0, 0, 0, 0.4);
  --shadow-lg: 0 10px 30px rgba(0, 0, 0, 0.5);
}
```

---

## 3. Pewarnaan & Kategori Satuan Kerja (Unit Classification System)

Setiap jenis satuan kerja DJBC memiliki kode warna, stroke, ikon, dan radius titik yang distandarisasi secara konsisten di seluruh modul (Peta, Bagan Pohon, Drawer, Badge):

| Kategori Satker | Label Resmi | Warna Utama | Warna Border / Stroke | Radius Titik | Ikon | Penggunaan |
|---|---|---|---|---|---|---|
| **Kantor Pusat** | Kantor Pusat DJBC | `#062B52` (Navy Gelap) | `#D9B45B` (Gold) | 9.0 px | 🏛️ | Kantor Pusat Rawamangun |
| **Kanwil** | Kantor Wilayah | `#0284C7` (Sky Blue) | `#FFFFFF` | 7.5 px | 🏛️ | Kanwil Eselon II (21 Kanwil) |
| **KPU** | Kantor Pelayanan Utama | `#D97706` (Amber / Gold) | `#FFFFFF` | 8.0 px | ⚡ | KPU Tg. Priok, Batam, Soetta |
| **KPPBC** | KPPBC Pelayanan | `#0B3A6F` (Navy Klasik) | `#FFFFFF` | 5.5 px | 🏢 | Kantor Pelayanan Eselon III (104 Unit) |
| **BLBC** | Balai Lab Bea Cukai | `#10B981` (Emerald) | `#FFFFFF` | 7.0 px | 🧪 | UPT Laboratorium Pengujian |
| **PSO** | Sarana Operasi | `#EF4444` (Crimson) | `#FFFFFF` | 7.0 px | ⚓ | Pangkalan Armada Kapal Patroli |
| **Seksi / Bagian**| Seksi / Bagian Struktural | `#0284C7` (Sky Blue) | `#D9E0E8` | - | 📁 | Unit Eselon IV di bawah KPPBC/Kanwil |

---

## 4. Tipografi & Skala Spasi

### 4.1 Tipografi
- **Primary Font Family:** `'Poppins', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`
- **Tingkat Ketebalan Font (Font Weights):**
  - `400` (Regular): Teks deskripsi, alamat, dasar hukum.
  - `500` (Medium): Label form, sub-judul modul.
  - `600` (Semi-Bold): Nama satker pada kartu, item dropdown, tombol filter.
  - `700` (Bold): Judul kartu, badge angka, jabatan pimpinan.
  - `800` (Extra-Bold): Header utama, judul satker drawer.

### 4.2 Skala Hirarki Teks

| Skala | Ukuran Font | Line Height | Weight | Penerapan |
|---|---|---|---|---|
| **Display / Title** | 16px - 18px | 1.25 | 800 | Header judul drawer & modal |
| **App Title** | 14px - 15px | 1.20 | 800 | Brand Title Bar |
| **Heading Card** | 12.5px - 13.5px | 1.35 | 700 | Judul kartu satker & nama pimpinan |
| **Body Primary** | 12px | 1.50 | 600 / 500 | Teks isi drawer, pill filter |
| **Body Secondary** | 11px - 11.5px | 1.55 | 400 | Tugas, fungsi, alamat kantor |
| **Caption / Badge** | 9.5px - 10.5px | 1.20 | 700 | Tag kategori, pill badge count |

### 4.3 Radius Sudut & Elevasi Bayangan

```css
:root {
  --radius-sm: 6px;       /* Tombol kecil, item dropdown, ikon kotak */
  --radius-md: 10px;      /* Kartu data, kotak filter, card box */
  --radius-lg: 14px;      /* Modal popup, floating legend */
  --radius-pill: 9999px;  /* Pill button, search input, status badge */

  --shadow-sm: 0 2px 6px rgba(6, 43, 82, 0.06);
  --shadow-md: 0 4px 18px rgba(6, 43, 82, 0.12);
  --shadow-lg: 0 10px 30px rgba(6, 43, 82, 0.18);
}
```

---

## 5. Komponen Spesifik & Blueprint Antarmuka

### 5.1 Header & Brand Bar
- **Tinggi:** `60px` (Desktop), `54px` (Mobile).
- **Komponen:**
  - **Logo Kemenkeu:** Tinggi `38px`, aspect-ratio terjaga.
  - **Brand Text:** Judul huruf kapital 800 (`PETA SEBARAN SATKER DJBC`), Sub-judul 500 (`Direktorat Jenderal Bea dan Cukai`).
  - **Pencarian Real-time:** Input pill oval (`height: 38px; border-radius: 9999px; padding-left: 36px`), ikon kaca pembesar absolute di kiri. Dropdown autocomplete melayang dengan batas `max-height: 280px`.
  - **Action Tools:** Tombol icon bulat/rounded (`36x36px`) untuk Toggle Dark Mode dan Fullscreen.

```html
<header class="map-header">
  <div class="map-brand">
    <img src="logo_kemenkeu.png" alt="Logo Kemenkeu" class="map-logo-img">
    <div class="map-brand-text">
      <span class="map-brand-title">PETA SEBARAN SATKER DJBC</span>
      <span class="map-brand-sub">Direktorat Jenderal Bea dan Cukai</span>
    </div>
  </div>

  <div class="map-search-box">
    <svg class="map-search-icon" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
    <input type="text" id="map-search-input" class="map-search-input" placeholder="Cari nama kantor, kota, kanwil...">
    <div id="map-search-dropdown" class="map-search-dropdown"></div>
  </div>

  <div class="map-header-actions">
    <button id="theme-toggle-btn" class="btn-icon" title="Mode Gelap / Terang"><svg>...</svg></button>
    <button id="fullscreen-btn" class="btn-icon" title="Layar Penuh"><svg>...</svg></button>
  </div>
</header>
```

---

### 5.2 Filter Bar & Live Badge Counters
- **Letak:** Bar horizontal tepat di bawah header (`padding: 8px 20px`).
- **Pill Buttons:** Tombol oval dengan titik warna kategori dan counter live: `Semua (137)`, `Kanwil (21)`, `KPU (3)`, `KPPBC (104)`, `UPT (9)`.
- **Dropdown Pulau:** Select kontrol untuk navigasi instan: `Seluruh Indonesia`, `Sumatera`, `Jawa`, `Kalimantan`, `Sulawesi`, `Bali-Nusa Tenggara`, `Maluku`, `Papua`.
- **Reaktivitas:** Memilih pulau langsung mengupdate seluruh angka badge pill dan legenda sesuai jumlah satker di pulau tersebut.

---

### 5.3 Map Markers & Hover Tooltip
- **MapLibre Layer Styling:**
  - **Halo Layer (Lingkaran Luar Transparan):** `circle-opacity: 0.28`, radius membesar dinamis sesuai level zoom.
  - **Core Layer (Lingkaran Inti Solid):** `circle-color` sesuai kategori, `circle-stroke-color: #FFFFFF` (`#D9B45B` untuk Kantor Pusat), `circle-stroke-width: 1.8px - 2.8px`.
- **Hover Tooltip:**
  - Muncul instan saat mouse hover di atas titik kantor.
  - Menampilkan badge kategori berlatar soft, nama kantor tebal, dan alamat kota/provinsi.
  - Menghilang mulus saat mouseleave.

```html
<!-- Struktur Tooltip Hover -->
<div class="hover-tooltip-content">
  <div class="hover-tooltip-badge" style="background:#0284C722; color:#0284C7; border:1px solid #0284C744;">
    KANWIL
  </div>
  <div class="hover-tooltip-title">Kantor Wilayah DJBC Aceh</div>
  <div class="hover-tooltip-sub">📍 Banda Aceh, Aceh</div>
</div>
```

---

### 5.4 Slide-in Detail Drawer & Hierarchical Navigation
- **Posisi:** Fixed di kanan layar (`width: 420px; max-width: 92vw; height: 100%`).
- **Animasi Buka:** `transition: right 0.35s cubic-bezier(0.16, 1, 0.3, 1)`.
- **Struktur Konten:**
  1. **Tombol Navigasi Balik:** `<button class="drawer-back-btn">← Kembali ke [Nama Induk]</button>` (muncul saat sedang membuka sub-unit struktural).
  2. **Header Unit:** Badge tipe warna-warni + Judul Nama Satker (800).
  3. **Kotak Info Lokasi:** Wilayah kerja & alamat kantor fisik.
  4. **Jabatan Pimpinan:** Kepala Kantor / Kepala Seksi / Direktur.
  5. **Dasar Hukum:** PMK / Peraturan pendirian.
  6. **Tugas Pokok & Fungsi Utama:** Bullet points terstruktur.
  7. **Satuan Kerja / Seksi di Bawahnya (Interactive Clickable Cards):**
     - Setiap item bawahan dibungkus dalam `.drawer-subunit-card`.
     - Memiliki ikon khusus (`🏛️`, `⚡`, `🏢`, `🧪`, `⚓`, `📁`), nama unit, label level, dan ikon panah `→`.
     - **Klik Satker Fisik (Map Point):** Peta terbang (*flyTo*) ke koordinat titik, menampilkan popup, dan membuka profil unit tersebut.
     - **Klik Seksi Struktural:** Drawer berganti menampilkan profil seksi tersebut beserta tugas & fungsi, dan menampilkan tombol "← Kembali ke Induk".

```html
<!-- Template Kartu Satker Bawahan -->
<div class="drawer-subunit-card" data-child-id="kppbc-banda-aceh">
  <div class="drawer-subunit-left">
    <div class="drawer-subunit-icon">🏢</div>
    <div class="drawer-subunit-info">
      <div class="drawer-subunit-name">KPPBC TMP C Banda Aceh</div>
      <div class="drawer-subunit-sub">
        <span>🏷️ KPPBC Pelayanan</span>
        <span>• 📍 Banda Aceh</span>
      </div>
    </div>
  </div>
  <div class="drawer-subunit-arrow">
    <svg width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M9 18l6-6-6-6"/></svg>
  </div>
</div>
```

---

### 5.5 Floating Interactive Legend & Controls
- **Legenda (Kanan Bawah):**
  - Dapat diminimalkan (`&times;`) dan dibuka kembali (`Buka Legenda`).
  - Setiap baris legenda berfungsi sebagai filter 2 arah yang tersinkronisasi dengan pill filter atas.
  - Memiliki badge counter dinamis per tipe kantor.
- **Zoom Controls (Kiri Bawah):**
  - Tombol Zoom In (`+`), Zoom Out (`-`), Reset Indonesia (`🇮🇩`), dan badge indikator zoom (`z5.0`).

---

## 6. Standar Responsif (Responsive Breakpoints)

| Breakpoint | Lebar Layar | Penyesuaian UI |
|---|---|---|
| **Desktop XL** | `> 1280px` | Tampilan penuh, drawer `420px`, search box `320px`. |
| **Desktop / Laptop** | `1024px - 1280px` | Padding disesuaikan, seluruh kontrol tetap aktif. |
| **Tablet** | `768px - 1023px` | Drawer `380px`, teks brand sub-judul diringkas. |
| **Mobile** | `< 768px` | Drawer `100vw` (layar penuh), heading filter disembunyikan, search box `150px`, legenda ringkas. |

---

## 7. Standar Kemandirian Aset (Self-Contained Offline Standard)

Semua implementasi modul pada template ini dirancang untuk dapat berjalan **100% Offline** melalui protokol `file://` tanpa memerlukan internet ataupun local web server:
1. **Font:** Dibundle langsung atau menggunakan fallback system font stack (`Poppins, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif`).
2. **Logo & Ikon:** Menggunakan format **SVG inline** atau gambar **Base64** (`data:image/png;base64,...`).
3. **Peta & Layer:** Menggunakan MapLibre GL JS/CSS inline dan GeoJSON poligon provinsi serta titik satker yang disematkan langsung di dalam script file HTML.
