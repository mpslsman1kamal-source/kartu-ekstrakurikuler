// ============================================
// EXCEL IMPORT/EXPORT — Template .xlsx untuk impor data siswa massal
// Kolom No. Induk & NISN SENGAJA diformat Teks ('@') di file template
// agar Excel tidak menghilangkan angka nol di depan saat admin mengetik.
// ============================================

const TEMPLATE_HEADERS = ['NoInduk', 'Nama', 'NISN', 'Kelas', 'Ekstrakurikuler'];
const TEMPLATE_BLANK_ROWS = 300;

function downloadTemplateExcel() {
  const wsData = [
    TEMPLATE_HEADERS,
    ['202410142', 'Contoh: Achmad Prasetyo', '0081234567', 'XI-MIPA-2', 'Pramuka Penegak']
  ];
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Paksa kolom A (NoInduk) & C (NISN) bertipe Teks untuk baris contoh + baris kosong di bawahnya
  for (let r = 1; r <= TEMPLATE_BLANK_ROWS; r++) {
    ['A', 'C'].forEach(col => {
      const ref = col + (r + 1);
      if (!ws[ref]) ws[ref] = { t: 's', v: '' };
      ws[ref].z = '@';
      ws[ref].t = 's';
    });
  }
  ws['!cols'] = [{ wch: 14 }, { wch: 28 }, { wch: 14 }, { wch: 12 }, { wch: 22 }];
  ws['!ref'] = 'A1:E' + (TEMPLATE_BLANK_ROWS + 1);

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Data Siswa');
  XLSX.writeFile(wb, 'Template-Import-Siswa-SIKARTU.xlsx');
}

function normalizeHeaderKey(h) {
  return String(h || '').toLowerCase().replace(/[^a-z]/g, '');
}

const HEADER_MAP = {
  noinduk: 'noInduk', nois: 'noInduk', nomorinduk: 'noInduk', nisekolah: 'noInduk',
  nama: 'nama', namalengkap: 'nama',
  nisn: 'nisn',
  kelas: 'kelas',
  ekstrakurikuler: 'ekstrakurikuler', ekskul: 'ekstrakurikuler', eskul: 'ekstrakurikuler'
};

/**
 * Membaca file .xlsx/.xls di browser -> { rows: [{noInduk,nama,nisn,kelas,ekstrakurikuler}], unmappedHeaders }
 * raw:false memaksa SheetJS memakai teks yang SUDAH diformat di cell (bukan nilai mentah),
 * sehingga kolom berformat Teks ('@') tetap mempertahankan angka nol di depan.
 */
function parseExcelFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target.result, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const aoa = XLSX.utils.sheet_to_json(ws, { header: 1, raw: false, defval: '' });
        if (!aoa.length) return resolve({ rows: [], unmappedHeaders: [] });

        const headerRow = aoa[0].map(h => normalizeHeaderKey(h));
        const colIndex = {};
        const unmappedHeaders = [];
        headerRow.forEach((h, i) => {
          if (HEADER_MAP[h]) colIndex[HEADER_MAP[h]] = i;
          else if (aoa[0][i]) unmappedHeaders.push(aoa[0][i]);
        });

        const rows = aoa.slice(1)
          .filter(r => r.some(cell => String(cell).trim() !== ''))
          .map(r => ({
            noInduk: String(r[colIndex.noInduk] ?? '').trim(),
            nama: String(r[colIndex.nama] ?? '').trim(),
            nisn: String(r[colIndex.nisn] ?? '').trim(),
            kelas: String(r[colIndex.kelas] ?? '').trim(),
            ekstrakurikuler: String(r[colIndex.ekstrakurikuler] ?? '').trim()
          }));

        resolve({ rows, unmappedHeaders, missingColumns: ['noInduk', 'nama', 'nisn', 'kelas'].filter(k => colIndex[k] === undefined) });
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}
