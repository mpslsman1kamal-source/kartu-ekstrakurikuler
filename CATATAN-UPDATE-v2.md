# 📋 CATATAN UPDATE — SIKARTU-EKSKUL v2

Update ini **tidak mengubah** struktur, arsitektur, atau tampilan yang sudah berjalan. Tidak ada sheet/kolom/baris yang dihapus atau diganti — hanya cara kerja di baliknya yang ditingkatkan, sesuai 5 permintaan Anda.

---

## 1. ✅ "Lihat Kartu" sekarang tampil di dashboard (bukan tab baru)

Tombol **Lihat Kartu** kini membuka pratinjau PDF **langsung di dalam halaman** (di bawah kartu digital), bukan membuka file di tab baru. Tombol berubah menjadi **"✕ Tutup Pratinjau"** untuk menutupnya lagi. **Unduh PDF** tetap mengunduh file seperti biasa.

## 2. ✅ Export Template & Import Excel (.xlsx, bukan CSV)

Di menu **Data Siswa** sekarang ada dua tombol baru:
- **⬇ Unduh Template Excel** — mengunduh file `.xlsx` dengan kolom `NoInduk`, `Nama`, `NISN`, `Kelas`, `Ekstrakurikuler`. Kolom **No. Induk & NISN sudah diformat Teks** di dalam file template, supaya saat admin mengetik data di Excel, angka nol di depan **tidak hilang**.
- **⬆ Impor dari Excel** — upload file `.xlsx` yang sudah diisi. Sistem akan menampilkan pratinjau jumlah baris, lalu:
  - Siswa dengan No. Induk yang **sudah ada** → datanya **diperbarui**.
  - Siswa dengan No. Induk **baru** → **ditambahkan**.
  - Ada centang **"Buatkan akun otomatis"** (aktif secara default) — jika dicentang, akun login langsung dibuat untuk semua siswa yang diimpor dalam satu langkah (lihat poin 3).
  - Baris yang datanya tidak lengkap/tidak valid akan dilewati dan dilaporkan di ringkasan hasil impor (bukan menggagalkan seluruh proses).

## 3. ✅ Buat Akun Massal lebih mudah dipakai

Modal **Buat Akun Massal** (di menu Kelola Akun) sekarang punya:
- Kotak **pencarian** nama/No. Induk.
- **Filter per kelas** (dropdown).
- **Pilih Semua (hasil tampilan)** — hanya memilih siswa yang sedang terlihat setelah difilter, bukan seluruh daftar.
- Penghitung jumlah siswa terpilih.

Ini jauh lebih praktis dibanding menggulir ratusan nama satu per satu untuk sekolah dengan ±1.000–1.300 siswa. Selain itu, opsi "buat akun otomatis" di fitur Impor Excel (poin 2) membuat alur **impor data + buat akun** bisa selesai dalam satu langkah.

## 4. ✅ NISN berangka nol di depan tidak lagi terpotong

**Analisis akar masalah:** Google Sheets secara otomatis mengonversi teks yang berisi hanya angka (termasuk yang ditulis lewat API seperti Apps Script) menjadi tipe **Angka** jika format kolom masih "Automatic" — dan angka tidak bisa punya nol di depan, sehingga `"0081234567"` menjadi `81234567`. Ini terjadi di level Google Sheets, bukan di kode aplikasi.

**Perbaikan yang diterapkan:**
- Kolom **No. Induk** dan **NISN** di sheet `Siswa` (dan No. Induk di sheet `AkunSiswa`) sekarang dipaksa berformat **Teks (`@`)**, baik untuk instalasi baru maupun lewat fungsi perbaikan khusus untuk spreadsheet yang **sudah ada** (lihat langkah instalasi di bawah).
- Fitur Impor Excel (poin 2) & Buat Akun Massal juga ikut menjaga format Teks ini setiap kali menulis data baru.
- Template Excel juga sudah diformat Teks di kolom tersebut (lihat poin 2), supaya kehilangan data tidak terjadi bahkan sebelum data sampai ke sistem.

⚠️ **Penting:** Perbaikan ini mencegah kehilangan **ke depannya**. Data yang **sudah terlanjur** kehilangan angka nol (seperti NISN contoh `81234567` di data uji coba Anda, yang seharusnya `0081234567`) **tidak bisa dipulihkan otomatis** — silakan periksa dan perbaiki manual langsung di sheet `Siswa` setelah menjalankan langkah perbaikan di bawah.

## 5. ✅ Terapkan gas-scale-turbo — kurangi delay pindah menu

Diterapkan **tanpa mengubah satu pun data**, hanya cara kerja server & frontend:

- **Cache terpecah otomatis (CacheX):** sebelumnya, cache bisa gagal diam-diam untuk data di atas 100KB — berisiko nyata untuk ±1.000-1.300 siswa (dump data siswa bisa >100KB), yang membuat Sheets dibaca ulang setiap request. Sekarang cache dipecah otomatis sehingga tetap tersimpan.
- **Cache berversi:** penulisan data menaikkan "versi" cache alih-alih menghapus kunci satu-satu — lebih murah dan aman.
- **Cache hasil olahan Dashboard & Laporan** (bukan hanya data mentah) — pindah ke menu ini tidak lagi menghitung ulang ratusan/ribuan baris setiap kali dibuka.
- **SWR di frontend (Stale-While-Revalidate):** tiap pindah menu, halaman **langsung tampil dari data lokal** (jika masih segar, <25 detik) sambil diam-diam menyegarkan data dari server di belakang layar. Hasilnya pindah menu terasa instan.
- **Warmup server:** saat layar login terbuka, server "dibangunkan" lebih dulu (mode `no-cors`, dibatasi 1x/4 menit) supaya tidak kena cold-start saat login pertama.
- **Tombol Segarkan (⟳)** di topbar admin — klik untuk langsung mengambil data terbaru dari server, mengabaikan cache lokal (berguna jika Anda baru saja mengedit data langsung di Google Sheets).
- **Pengukuran waktu server** disertakan di tiap respons (`res.ms`) — buka Console browser lalu ketik `Perf.table()` atau `Perf.summary()` untuk melihat waktu tiap aksi.

---

## 🚀 Langkah Penerapan

### Backend
1. Buka proyek Apps Script Anda yang sudah ada (**jangan buat proyek baru**).
2. Pilih semua isi `Kode.gs` lama → hapus → tempel isi `Kode.gs` yang baru.
3. Simpan (Ctrl+S).
4. **Jalankan sekali** fungsi `perbaikiFormatNoIndukNISN` (pilih dari dropdown fungsi → ▶ Run). Ini **hanya mengubah format kolom**, tidak menghapus/mengubah data Anda. Aman dijalankan berkali-kali.
5. **Deploy → Manage deployments** → klik ✏️ (edit) pada deployment yang sudah aktif → Version: **New version** → Deploy.
   - ⚠️ **Jangan** buat "New deployment" — itu akan menghasilkan URL `/exec` baru dan `config.js` di frontend harus diubah lagi. Dengan "New version" di deployment yang sama, URL tetap sama persis.
6. Setelah deploy, periksa langsung di sheet `Siswa` → kolom NISN siswa yang datanya sudah terlanjur kehilangan angka nol (misalnya data uji coba Anda) → perbaiki manual.

### Frontend
1. Ganti seluruh isi folder lokal Anda dengan isi ZIP baru (**`js/config.js` tidak berubah** — tidak perlu diisi ulang).
2. `git add .` → `git commit -m "Update v2: inline PDF viewer, impor Excel, akun massal, fix NISN, performa"` → `git push`.
3. Tunggu 1-2 menit, lalu buka situs dan tekan **Ctrl+Shift+R** (hard refresh) agar file lama di cache browser tidak terpakai.

### Uji Cepat Setelah Update
- [ ] Login siswa → tekan **Lihat Kartu** → pastikan tampil inline, bukan tab baru.
- [ ] Login admin → **Data Siswa** → **Unduh Template Excel** → isi 2-3 baris data dengan NISN berawalan 0 → **Impor dari Excel** → pastikan NISN masuk utuh (cek di tabel/di sheet Siswa).
- [ ] **Kelola Akun** → **Buat Akun Massal** → coba cari nama & filter kelas.
- [ ] Pindah-pindah menu (Dashboard → Data Siswa → Laporan → Dashboard lagi) → rasakan lebih instan pada kunjungan kedua.
- [ ] Klik tombol **⟳ Segarkan** di topbar → pastikan data termutakhirkan.
