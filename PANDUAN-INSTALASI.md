# 📋 PANDUAN INSTALASI — SIKARTU-EKSKUL (SMAN 1 Kamal Bangkalan)

## === BAGIAN A: BACKEND (Google Apps Script) ===

1. Buka **https://script.google.com** → **Proyek Baru**.
2. Ganti nama file `Code.gs` menjadi `Kode` → hapus isinya → tempel seluruh isi file **Kode.gs** yang diberikan terpisah di chat.
3. Klik ikon **+** di samping "Files" → **Buat file baru** → pilih **appsscript.json** (atau aktifkan dulu lewat ⚙️ Project Settings → centang "Show appsscript.json") → tempel isi file **appsscript.json** yang diberikan.
4. Beri nama proyek (misalnya "SIKARTU-EKSKUL Backend") di bagian atas.
5. Jalankan setup **HANYA SEKALI**:
   - Pilih fungsi `setupAppEnvironment` dari dropdown di toolbar.
   - Klik tombol **▶ Run**.
   - Klik **Review permissions** → pilih akun Google sekolah → klik **Advanced** → **Go to [nama proyek] (unsafe)** → **Allow**. (Ini normal untuk skrip buatan sendiri.)
   - Buka **Execution log** (Ctrl+Enter atau ikon di kiri bawah) — pastikan muncul `✅ Setup selesai!` beserta URL Spreadsheet dan Drive Folder.
   - ⚠️ **JANGAN jalankan `setupAppEnvironment()` lebih dari sekali** — akan membuat folder & spreadsheet duplikat. Jika terlanjur, hapus manual folder duplikat di Drive dan jalankan ulang sekali saja.
6. **Deploy sebagai Web App:**
   - Klik **Deploy** → **New deployment**.
   - Klik ikon ⚙️ di samping "Select type" → pilih **Web app**.
   - **Execute as:** Me (akun Anda).
   - **Who has access:** Anyone.
   - Klik **Deploy**.
   - **Salin URL yang berakhiran `/exec`** — ini adalah `GAS_URL` Anda.
7. Catat juga info login admin default dari Execution Log:
   - Username: `admin`
   - Password: `admin123` (⚠️ wajib diganti setelah login pertama)

## === BAGIAN B: ISI KONFIGURASI FRONTEND ===

1. Ekstrak ZIP frontend yang diberikan.
2. Buka file `js/config.js` dengan text editor.
3. Ganti nilai `GAS_URL` dengan URL `/exec` dari Bagian A langkah 6.
4. Simpan.

## === BAGIAN C: DEPLOY FRONTEND KE GITHUB PAGES ===

> Folder hasil ekstraksi ZIP (yang berisi `index.html` di posisi paling atas) **adalah** folder yang nanti dijalankan `git init` di dalamnya — jangan masuk ke folder lain atau buat folder pembungkus baru.

Ikuti panduan langkah-demi-langkah secara interaktif di chat (install Git → buat akun GitHub → buat repository → push folder ini → aktifkan GitHub Pages). Minta bantuan Claude untuk dipandu per langkah jika Anda belum pernah memakai Git sebelumnya.

Ringkasan cepat (untuk yang sudah familiar dengan Git):
```bash
cd /path/ke/folder/sikartu-ekskul   # folder yang berisi index.html
git init
git add .
git commit -m "Deploy SIKARTU-EKSKUL"
git branch -M main
git remote add origin https://github.com/USERNAME/NAMA-REPO.git
git push -u origin main
```
Lalu aktifkan di GitHub: **Settings → Pages → Branch: main → Save**. Situs akan tersedia di `https://USERNAME.github.io/NAMA-REPO/` dalam 1–2 menit.

## === BAGIAN D: TEST ===

1. Buka URL GitHub Pages Anda.
2. Klik tab **Portal Pengelola** → login dengan `admin` / `admin123`.
3. **Segera ganti password admin**: menu *Kelola Akun* → bagian *Akun Admin & Pembina Ekstra* → klik ✎ pada akun admin → isi kata sandi baru.
4. Tambahkan satu data siswa uji coba lewat *Data Siswa → + Tambah Siswa*.
5. Buat akun untuk siswa tersebut lewat *Kelola Akun → Buat Akun Massal*.
6. Unggah contoh kartu PDF lewat menu *Upload Kartu*.
7. Buka tab browser baru (mode penyamaran) → login **Portal Siswa** dengan No. Induk & NISN siswa uji coba → pastikan kartu tampil dan bisa diunduh dengan catatan kehadiran otomatis di bagian bawah PDF.
8. Buka DevTools (F12) → tab Network → pastikan tidak ada error CORS saat login/memuat data.

## Troubleshooting Singkat

| Gejala | Penyebab | Solusi |
|---|---|---|
| Login gagal terus padahal data benar | `GAS_URL` di `config.js` belum diisi/salah | Cek ulang Bagian B |
| "Sheet tidak ditemukan" | `setupAppEnvironment()` belum dijalankan / gagal di tengah | Cek Execution Log, jalankan ulang sekali |
| Siswa tidak bisa login walau NIS/NISN benar | Akun belum dibuat/masih Nonaktif | Admin: *Kelola Akun → Buat Akun Massal* atau aktifkan status |
| Halaman tampil tanpa styling | Struktur folder `css/`/`js/` tidak ikut ter-push | Pastikan `git init` dijalankan tepat di folder berisi `index.html` |
| Kartu gagal diunduh / PDF kosong | File yang diunggah bukan PDF valid | Unggah ulang file PDF asli (bukan hasil convert gambar) |
