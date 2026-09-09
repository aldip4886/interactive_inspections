# DJBC Reusable UI Starter Kit & Template

Template ini berisi aset dasar untuk menduplikasi tema, komponen, dan gaya visual resmi **DJBC Kementerian Keuangan** ke project web baru lainnya (HTML/JS murni, React, Vue, Next.js, Storyline Web Object, dll.).

---

## 📦 Isi Folder Template:
1. `theme.css`: Kumpulan variabel CSS (*design tokens*) untuk warna, tipografi, radius sudut, elevasi bayangan, dan dark mode otomatis.
2. `design.md`: Dokumen spesifikasi desain lengkap yang dapat diberikan kepada AI assistant (*Antigravity/LLM*) atau Stitch Design System untuk menghasilkan kode UI yang konsisten.

---

## 🚀 Cara Menggunakan pada Project Baru:

### Opsi 1: Menggunakan AI Prompting (Paling Cepat)
Cukup letakkan file `design.md` pada folder project baru Anda, lalu beri instruksi kepada AI Assistant:
> *"Terapkan Design System dari file `design.md` ini untuk membangun antarmuka halaman [Dashboard / Modul X / Form Input] pada project ini."*

### Opsi 2: Menggunakan CSS Langsung (HTML/React/Vue)
1. Salin file `theme.css` ke project baru Anda.
2. Hubungkan di file HTML atau komponen utama:
   ```html
   <link rel="stylesheet" href="theme.css">
   ```
3. Gunakan class dan variabel yang telah disediakan seperti `var(--color-primary-navy)`, `var(--color-gold)`, `.btn-primary`, dll.
