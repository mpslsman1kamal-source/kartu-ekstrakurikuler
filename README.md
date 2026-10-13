# SIKARTU-EKSKUL — SMAN 1 Kamal Bangkalan

Aplikasi web untuk distribusi digital Kartu Peserta Ekstrakurikuler. Siswa login mandiri untuk melihat/mengunduh kartunya sendiri; Admin Tata Usaha dan Pembina Ekstra mengelola data siswa, akun, unggahan kartu, dan laporan rekap.

## Arsitektur

- **Frontend** (folder ini): HTML/CSS/JS murni, di-hosting di GitHub Pages. Tidak butuh build step.
- **Backend**: Google Apps Script sebagai REST API murni (`doGet`/`doPost` → JSON), dengan Google Sheets sebagai database dan Google Drive sebagai penyimpanan file PDF kartu.
- Komunikasi via `fetch()`, **bukan** `google.script.run`.

## Struktur Folder

```
index.html          ← Halaman utama (shell SPA)
css/style.css        ← Seluruh styling (token desain SMAN 1 Kamal)
js/config.js          ← Isi GAS_URL di sini setelah backend di-deploy
js/api.js             ← Helper fetch + manajemen sesi login
js/pdf-stamp.js        ← Membubuhkan catatan kehadiran ke PDF kartu (di browser)
js/app.js              ← Seluruh logika SPA (routing, render, CRUD)
```

## Cara Install

1. Jalankan backend terlebih dahulu — lihat **PANDUAN-INSTALASI.md**.
2. Salin URL `/exec` hasil deploy Web App, tempel ke `js/config.js` pada variabel `GAS_URL`.
3. Deploy folder ini ke GitHub Pages (lihat PANDUAN-INSTALASI.md bagian Frontend).

## Akun Login Pertama Kali

Setelah `setupAppEnvironment()` dijalankan di Apps Script, akun admin default:

- **Username:** `admin`
- **Password:** `admin123`

⚠️ **Segera ganti password ini** lewat menu *Kelola Akun → Akun Admin & Pembina Ekstra* setelah login pertama.

## Fitur Utama

- Login terpisah: **Portal Siswa** (NIS + NISN) dan **Portal Pengelola** (Admin/Pembina).
- Siswa hanya bisa melihat/mengunduh kartu miliknya sendiri — divalidasi di backend via token sesi, bukan hanya di tampilan.
- Kartu PDF otomatis dibubuhi catatan **"SILAHKAN SCAN KARTU PESERTA KE PEMBINA SEBAGAI BUKTI KEHADIRAN"** setiap kali dilihat/diunduh.
- Admin/Pembina: Dashboard ringkasan, Upload Kartu, Kelola Data Siswa (CRUD + pencarian), Kelola Akun Siswa (termasuk buat akun massal), Kelola Akun Staff (khusus Admin), Laporan & Grafik Rekap per Ekstrakurikuler.
- Responsif penuh: sidebar di desktop, bottom navigation di HP/tablet.

## Catatan Teknis

- Password siswa = NISN (divalidasi langsung ke data di sheet `Siswa`, bukan disimpan terpisah) — akun tetap harus diaktifkan Admin di sheet `AkunSiswa` sebelum siswa bisa login.
- Password staff (Admin/Pembina) di-hash SHA-256 + salt sebelum disimpan — tidak pernah disimpan sebagai teks biasa.
- Sesi login memakai token (bukan cookie), disimpan di `localStorage` sisi klien dan divalidasi di sheet `_Sessions` + `CacheService` sisi server (berlaku 12 jam).
- Backend menerapkan caching (`CacheService`) dan operasi batch pada Google Sheets mengikuti prinsip GAS Instant UX agar tetap responsif untuk ±1.000–1.300 siswa.
