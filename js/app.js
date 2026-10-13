// ============================================
// SIKARTU-EKSKUL — App Logic (Client-Side SPA)
// Navigasi antar section tanpa reload (0ms).
// ============================================

const root = document.getElementById('app');
const appState = {
  dashboard: null,
  siswaList: [],
  akunList: [],
  belumPunyaAkun: [],
  staffList: [],
  laporan: null,
  filterKelas: '',
  filterEkskul: ''
};

// ---------------- UI HELPERS ----------------
function showToast(message, type = 'success') {
  const el = document.createElement('div');
  el.className = `toast toast-${type}`;
  el.textContent = message;
  document.getElementById('toast-container').appendChild(el);
  setTimeout(() => el.remove(), 3500);
}
function showLoading(show) {
  document.getElementById('loading-overlay').classList.toggle('hidden', !show);
}
function escapeHtml(str) {
  return String(str == null ? '' : str).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// ---------------- INIT ----------------
document.addEventListener('DOMContentLoaded', () => {
  const session = Session.get();
  if (session && session.token) {
    if (session.role === 'siswa') renderSiswaShell();
    else renderAdminShell(session.role);
  } else {
    renderLoginView();
  }
});

// =====================================================
// LOGIN VIEW
// =====================================================
function renderLoginView() {
  root.innerHTML = `
    <div class="center-screen">
      <div class="login-wrap">
        <div class="login-header">
          <div class="logo-badge">SK</div>
          <div>
            <div class="brand-name">${APP_INFO.name}</div>
            <div class="brand-sub">${APP_INFO.school} · T.A. ${APP_INFO.year}</div>
          </div>
        </div>

        <div class="tabs">
          <button class="tab-btn active" id="tab-siswa">Portal Siswa</button>
          <button class="tab-btn" id="tab-staff">Portal Pengelola</button>
        </div>

        <div class="card" id="login-card">
          ${loginSiswaFormHtml()}
        </div>
      </div>
    </div>
  `;

  document.getElementById('tab-siswa').onclick = () => {
    setTab('siswa');
    document.getElementById('login-card').innerHTML = loginSiswaFormHtml();
    bindLoginSiswaForm();
  };
  document.getElementById('tab-staff').onclick = () => {
    setTab('staff');
    document.getElementById('login-card').innerHTML = loginStaffFormHtml();
    bindLoginStaffForm();
  };
  function setTab(which) {
    document.getElementById('tab-siswa').classList.toggle('active', which === 'siswa');
    document.getElementById('tab-staff').classList.toggle('active', which === 'staff');
  }
  bindLoginSiswaForm();
}

function loginSiswaFormHtml() {
  return `
    <h2 class="mb-sm">Portal Siswa SIKARTU</h2>
    <p class="text-secondary mb-md">Masuk untuk melihat dan mengunduh Kartu Peserta Ekstrakurikuler Anda.</p>
    <form id="form-login-siswa">
      <div class="field">
        <label>Nomor Induk Sekolah (NIS)</label>
        <input class="input" type="text" inputmode="numeric" id="li-noinduk" placeholder="Contoh: 202410142" required>
      </div>
      <div class="field">
        <label>Nomor Induk Siswa Nasional (NISN)</label>
        <div class="input-group">
          <input class="input" type="password" id="li-nisn" placeholder="Masukkan NISN" required>
          <button type="button" class="input-eye" id="li-eye">👁</button>
        </div>
        <div class="input-hint">Kerahasiaan data dilindungi, divalidasi di server.</div>
      </div>
      <button type="submit" class="btn btn-primary btn-block" id="li-submit">Masuk ke Akun Siswa</button>
    </form>
    <p class="text-secondary text-sm mt-md">Kendala akun? Hubungi Pembina Ekstra atau staf Tata Usaha.</p>
  `;
}
function bindLoginSiswaForm() {
  document.getElementById('li-eye').onclick = () => {
    const f = document.getElementById('li-nisn');
    f.type = f.type === 'password' ? 'text' : 'password';
  };
  document.getElementById('form-login-siswa').onsubmit = async (e) => {
    e.preventDefault();
    const btn = document.getElementById('li-submit');
    btn.disabled = true; btn.textContent = 'Memeriksa...';
    const noInduk = document.getElementById('li-noinduk').value.trim();
    const nisn = document.getElementById('li-nisn').value.trim();
    const res = await callApi('loginSiswa', { noInduk, nisn });
    btn.disabled = false; btn.textContent = 'Masuk ke Akun Siswa';
    if (res.success) {
      Session.save(res.token, res.role, res.profile);
      showToast(res.message, 'success');
      renderSiswaShell();
    } else {
      showToast(res.message || 'Login gagal.', 'error');
    }
  };
}

function loginStaffFormHtml() {
  return `
    <h2 class="mb-sm">Portal Pengelola &amp; Pembina</h2>
    <p class="text-secondary mb-md">Akses panel kontrol untuk Admin Tata Usaha dan Pembina Ekstra.</p>
    <form id="form-login-staff">
      <div class="field">
        <label>Username</label>
        <input class="input" type="text" id="ls-username" placeholder="Username staf" required>
      </div>
      <div class="field">
        <label>Kata Sandi</label>
        <div class="input-group">
          <input class="input" type="password" id="ls-password" placeholder="Kata sandi" required>
          <button type="button" class="input-eye" id="ls-eye">👁</button>
        </div>
      </div>
      <button type="submit" class="btn btn-primary btn-block" id="ls-submit">Masuk ke Panel Pengelola</button>
    </form>
  `;
}
function bindLoginStaffForm() {
  document.getElementById('ls-eye').onclick = () => {
    const f = document.getElementById('ls-password');
    f.type = f.type === 'password' ? 'text' : 'password';
  };
  document.getElementById('form-login-staff').onsubmit = async (e) => {
    e.preventDefault();
    const btn = document.getElementById('ls-submit');
    btn.disabled = true; btn.textContent = 'Memeriksa...';
    const username = document.getElementById('ls-username').value.trim();
    const password = document.getElementById('ls-password').value;
    const res = await callApi('loginStaff', { username, password });
    btn.disabled = false; btn.textContent = 'Masuk ke Panel Pengelola';
    if (res.success) {
      Session.save(res.token, res.role, res.profile);
      showToast(res.message, 'success');
      renderAdminShell(res.role);
    } else {
      showToast(res.message || 'Login gagal.', 'error');
    }
  };
}

function logout() {
  const token = Session.token();
  Session.clear();
  callApi('logout', { token });
  renderLoginView();
}

// =====================================================
// SISWA SHELL — Halaman Kartu Peserta
// =====================================================
function renderSiswaShell() {
  const session = Session.get();
  const p = session.profile || {};
  root.innerHTML = `
    <div class="app-shell">
      <div class="main-area" style="width:100%">
        <div class="topbar">
          <div class="topbar-title">${APP_INFO.name}</div>
          <button class="btn btn-outline btn-sm" id="btn-logout-siswa">Keluar</button>
        </div>
        <div class="content-area">
          <div class="kartu-wrap" id="kartu-wrap">
            <div class="flex items-center gap-sm text-secondary"><div class="spinner" style="width:18px;height:18px;border-width:2px"></div> Memuat kartu peserta...</div>
          </div>
        </div>
      </div>
    </div>
  `;
  document.getElementById('btn-logout-siswa').onclick = logout;
  loadKartuSaya();
}

async function loadKartuSaya() {
  const res = await api('getKartuSaya');
  const wrap = document.getElementById('kartu-wrap');
  if (!res.success) {
    wrap.innerHTML = `
      <div class="card">
        <h3 class="mb-sm">Kartu belum tersedia</h3>
        <p class="text-secondary">${escapeHtml(res.message)}</p>
      </div>`;
    return;
  }
  const p = res.profile;
  wrap.dataset.base64 = res.base64;
  wrap.dataset.filename = res.fileName;
  wrap.dataset.notice = res.catatanKehadiran;

  wrap.innerHTML = `
    <div class="banner-instruksi">
      <div class="ico">⚠️</div>
      <div class="txt">INSTRUKSI WAJIB<br>${escapeHtml(res.catatanKehadiran)}</div>
    </div>

    <div class="id-card">
      <div class="id-card-head">
        <div>
          <div class="sch">SIKARTU EKSKUL</div>
          <div class="sch-sub">${APP_INFO.school}</div>
        </div>
        <div class="ta">${APP_INFO.year}</div>
      </div>
      <div class="id-card-body">
        <div class="id-card-field"><div class="lbl">Nama Lengkap</div><div class="val">${escapeHtml(p.nama)}</div></div>
        <div class="id-card-row">
          <div class="id-card-field"><div class="lbl">No. Induk / NISN</div><div class="val mono">${escapeHtml(p.noInduk)}</div></div>
          <div class="id-card-field"><div class="lbl">Kelas</div><div class="val">${escapeHtml(p.kelas)}</div></div>
        </div>
        <div class="id-card-row">
          <div class="id-card-field"><div class="lbl">Ekstrakurikuler</div><div class="val">${escapeHtml(p.ekstrakurikuler || '-')}</div></div>
        </div>
      </div>
    </div>

    <div class="flex gap-sm mb-md">
      <button class="btn btn-primary btn-block" id="btn-lihat-kartu">👁 Lihat Kartu</button>
      <button class="btn btn-secondary btn-block" id="btn-unduh-kartu">⬇ Unduh PDF</button>
    </div>

    <div class="card text-sm text-secondary">
      Kartu ini otomatis diberi catatan kehadiran sebelum ditampilkan/diunduh. Tunjukkan ke Pembina Ekstra untuk discan sebagai bukti kehadiran.
    </div>
  `;

  document.getElementById('btn-lihat-kartu').onclick = () => openOrDownloadKartu('view');
  document.getElementById('btn-unduh-kartu').onclick = () => openOrDownloadKartu('download');
}

async function openOrDownloadKartu(mode) {
  const wrap = document.getElementById('kartu-wrap');
  const base64 = wrap.dataset.base64;
  const notice = wrap.dataset.notice;
  const fileName = wrap.dataset.filename || 'kartu-peserta.pdf';
  showLoading(true);
  try {
    const blob = await stampPdfWithNotice(base64, notice);
    const url = URL.createObjectURL(blob);
    if (mode === 'view') {
      window.open(url, '_blank');
    } else {
      const a = document.createElement('a');
      a.href = url; a.download = fileName;
      document.body.appendChild(a); a.click(); a.remove();
    }
    setTimeout(() => URL.revokeObjectURL(url), 30000);
  } catch (e) {
    showToast('Gagal memproses PDF: ' + e.message, 'error');
  }
  showLoading(false);
}

// =====================================================
// ADMIN / PEMBINA SHELL
// =====================================================
const ADMIN_NAV = [
  { id: 'dashboard', label: 'Dashboard', icon: '▦' },
  { id: 'upload', label: 'Upload Kartu', icon: '⬆' },
  { id: 'siswa', label: 'Data Siswa', icon: '👥' },
  { id: 'akun', label: 'Kelola Akun', icon: '🔑' },
  { id: 'laporan', label: 'Laporan', icon: '📈' }
];

function renderAdminShell(role) {
  const session = Session.get();
  const p = session.profile || {};
  const initial = (p.nama || '?').trim().charAt(0).toUpperCase();

  root.innerHTML = `
    <div class="app-shell">
      <aside class="sidebar">
        <div class="sidebar-brand">
          <div class="logo-badge">SK</div>
          <div>
            <div class="brand-name">${APP_INFO.name}</div>
            <div class="brand-sub">${APP_INFO.school}</div>
          </div>
        </div>
        <nav class="sidebar-nav" id="sidebar-nav">
          ${ADMIN_NAV.map(n => `<button class="nav-item" data-nav="${n.id}"><span class="nav-icon">${n.icon}</span>${n.label}</button>`).join('')}
        </nav>
        <div class="sidebar-footer">
          <div class="sidebar-user">
            <div class="avatar">${initial}</div>
            <div>
              <div class="u-name">${escapeHtml(p.nama || '-')}</div>
              <div class="u-role">${role === 'admin' ? 'Admin Tata Usaha' : 'Pembina Ekstra'}</div>
            </div>
          </div>
          <button class="btn btn-outline btn-sm btn-block" id="btn-logout-admin">🚪 Keluar</button>
        </div>
      </aside>

      <div class="main-area">
        <div class="topbar">
          <div class="topbar-title" id="topbar-title">Dashboard</div>
          <button class="btn btn-outline btn-sm hidden" id="btn-logout-admin-mobile">🚪 Keluar</button>
        </div>
        <div class="content-area" id="admin-content"></div>
      </div>

      <nav class="bottom-nav">
        <div class="bottom-nav-inner" id="bottom-nav-inner">
          ${ADMIN_NAV.map(n => `<button class="nav-item" data-nav="${n.id}"><span class="nav-icon">${n.icon}</span>${n.label}</button>`).join('')}
        </div>
      </nav>
    </div>
  `;

  document.getElementById('btn-logout-admin').onclick = logout;
  document.querySelectorAll('[data-nav]').forEach(btn => {
    btn.onclick = () => navigateAdmin(btn.dataset.nav, role);
  });

  navigateAdmin('dashboard', role);
}

function setActiveNav(sectionId, label) {
  document.querySelectorAll('[data-nav]').forEach(b => b.classList.toggle('active', b.dataset.nav === sectionId));
  document.getElementById('topbar-title').textContent = label;
}

function navigateAdmin(section, role) {
  role = role || Session.get().role;
  const contentArea = document.getElementById('admin-content');
  const nav = ADMIN_NAV.find(n => n.id === section);
  setActiveNav(section, nav ? nav.label : section);

  if (section === 'dashboard') return renderDashboardSection(contentArea, role);
  if (section === 'upload') return renderUploadSection(contentArea, role);
  if (section === 'siswa') return renderDataSiswaSection(contentArea, role);
  if (section === 'akun') return renderAkunSection(contentArea, role);
  if (section === 'laporan') return renderLaporanSection(contentArea, role);
}

// -------- DASHBOARD --------
async function renderDashboardSection(el, role) {
  el.innerHTML = `<div class="flex items-center gap-sm text-secondary"><div class="spinner" style="width:18px;height:18px;border-width:2px"></div> Memuat ringkasan...</div>`;
  const res = await api('adminDashboard');
  if (!res.success) { el.innerHTML = errorBox(res.message); return; }
  el.innerHTML = `
    <div class="stat-grid">
      <div class="stat-card"><div class="stat-label">Total Siswa</div><div class="stat-value">${res.totalSiswa}</div></div>
      <div class="stat-card"><div class="stat-label">Kartu Terunggah</div><div class="stat-value">${res.totalKartu}</div></div>
      <div class="stat-card"><div class="stat-label">Akun Aktif</div><div class="stat-value">${res.totalAkunAktif}</div></div>
      <div class="stat-card"><div class="stat-label">Ekskul Aktif</div><div class="stat-value">${res.totalEkskul}</div></div>
    </div>
    <div class="card">
      <div class="card-header"><div class="card-title">Progres Kelengkapan Kartu</div><span class="chip chip-success">${res.persenKartuSiap}% Siap</span></div>
      <div style="height:10px;background:var(--surface-1);border-radius:999px;overflow:hidden;">
        <div style="height:100%;width:${res.persenKartuSiap}%;background:var(--electric-blue);"></div>
      </div>
      <p class="text-secondary text-sm mt-md">Pantau progres unggah kartu peserta. Gunakan menu <strong>Upload Kartu</strong> untuk melengkapi sisanya.</p>
    </div>
  `;
}

function errorBox(msg) {
  return `<div class="card"><p class="text-secondary">${escapeHtml(msg || 'Terjadi kesalahan.')}</p></div>`;
}

// -------- UPLOAD KARTU --------
async function renderUploadSection(el, role) {
  el.innerHTML = `<div class="flex items-center gap-sm text-secondary"><div class="spinner" style="width:18px;height:18px;border-width:2px"></div> Memuat data siswa...</div>`;
  const res = await api('adminListSiswa', {});
  if (!res.success) { el.innerHTML = errorBox(res.message); return; }
  appState.siswaList = res.list;

  el.innerHTML = `
    <div class="card" style="max-width:560px">
      <h3 class="mb-sm">Unggah Kartu Peserta</h3>
      <p class="text-secondary mb-md">Pilih siswa, lalu unggah file PDF kartu peserta. Mengunggah ulang akan mengganti file sebelumnya.</p>
      <div class="field">
        <label>Pilih Siswa</label>
        <select class="input" id="up-siswa">
          <option value="">— Pilih siswa —</option>
          ${res.list.map(s => `<option value="${s.noInduk}">${escapeHtml(s.nama)} · ${escapeHtml(s.noInduk)} · ${escapeHtml(s.kelas)} ${s.adaKartu ? '(sudah ada kartu)' : ''}</option>`).join('')}
        </select>
      </div>
      <div class="field">
        <label>File PDF Kartu Peserta (maks. 5 MB)</label>
        <div class="dropzone" id="up-dropzone">
          <div class="dz-icon">📄</div>
          <div id="up-filename">Klik atau seret file PDF ke sini</div>
          <input type="file" id="up-file" accept="application/pdf" class="hidden">
        </div>
      </div>
      <button class="btn btn-primary btn-block" id="up-submit">Unggah Kartu</button>
    </div>
  `;

  const dz = document.getElementById('up-dropzone');
  const fileInput = document.getElementById('up-file');
  let selectedFile = null;

  dz.onclick = () => fileInput.click();
  fileInput.onchange = () => { selectedFile = fileInput.files[0]; updateFilenameLabel(); };
  ['dragover'].forEach(evt => dz.addEventListener(evt, e => { e.preventDefault(); dz.classList.add('drag-over'); }));
  ['dragleave', 'drop'].forEach(evt => dz.addEventListener(evt, e => { e.preventDefault(); dz.classList.remove('drag-over'); }));
  dz.addEventListener('drop', e => { selectedFile = e.dataTransfer.files[0]; updateFilenameLabel(); });

  function updateFilenameLabel() {
    document.getElementById('up-filename').textContent = selectedFile ? selectedFile.name : 'Klik atau seret file PDF ke sini';
  }

  document.getElementById('up-submit').onclick = async () => {
    const noInduk = document.getElementById('up-siswa').value;
    if (!noInduk) return showToast('Pilih siswa terlebih dahulu.', 'error');
    if (!selectedFile) return showToast('Pilih file PDF terlebih dahulu.', 'error');
    if (selectedFile.type !== 'application/pdf') return showToast('File harus berformat PDF.', 'error');
    if (selectedFile.size > 5 * 1024 * 1024) return showToast('Ukuran file melebihi 5 MB.', 'error');

    showLoading(true);
    const base64 = await fileToBase64(selectedFile);
    const res = await api('adminUploadKartu', { noInduk, fileBase64: base64, fileName: selectedFile.name, mimeType: selectedFile.type });
    showLoading(false);
    if (res.success) {
      showToast(res.message, 'success');
      selectedFile = null; updateFilenameLabel(); fileInput.value = '';
      renderUploadSection(el, role);
    } else {
      showToast(res.message, 'error');
    }
  };
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// -------- DATA SISWA (CRUD) --------
async function renderDataSiswaSection(el, role) {
  el.innerHTML = `<div class="flex items-center gap-sm text-secondary"><div class="spinner" style="width:18px;height:18px;border-width:2px"></div> Memuat data siswa...</div>`;
  await loadSiswaList();
  el.innerHTML = `
    <div class="toolbar">
      <input class="input" id="ds-search" placeholder="Cari nama / No. Induk / NISN...">
      <div class="spacer"></div>
      <button class="btn btn-primary" id="ds-add">+ Tambah Siswa</button>
    </div>
    <div class="table-wrap">
      <table class="data-table">
        <thead><tr><th>Nama</th><th>No. Induk</th><th>NISN</th><th>Kelas</th><th>Ekstrakurikuler</th><th>Kartu</th><th>Akun</th><th></th></tr></thead>
        <tbody id="ds-tbody"></tbody>
      </table>
    </div>
  `;
  renderSiswaTable(appState.siswaList);

  let debounce;
  document.getElementById('ds-search').oninput = (e) => {
    clearTimeout(debounce);
    const q = e.target.value.toLowerCase();
    debounce = setTimeout(() => {
      const filtered = appState.siswaList.filter(s =>
        s.nama.toLowerCase().includes(q) || String(s.noInduk).includes(q) || String(s.nisn).includes(q)
      );
      renderSiswaTable(filtered);
    }, 300);
  };
  document.getElementById('ds-add').onclick = () => openSiswaModal(null);
}

async function loadSiswaList() {
  const res = await api('adminListSiswa', {});
  if (res.success) appState.siswaList = res.list;
}

function renderSiswaTable(list) {
  const tbody = document.getElementById('ds-tbody');
  if (!list.length) { tbody.innerHTML = `<tr><td colspan="8" class="table-empty">Belum ada data siswa.</td></tr>`; return; }
  tbody.innerHTML = list.map(s => `
    <tr>
      <td>${escapeHtml(s.nama)}</td>
      <td class="cell-mono">${escapeHtml(s.noInduk)}</td>
      <td class="cell-mono">${escapeHtml(s.nisn)}</td>
      <td>${escapeHtml(s.kelas)}</td>
      <td>${escapeHtml(s.ekstrakurikuler || '-')}</td>
      <td>${s.adaKartu ? '<span class="chip chip-success">Ada</span>' : '<span class="chip chip-warning">Belum</span>'}</td>
      <td>${akunChip(s.statusAkun)}</td>
      <td>
        <div class="flex gap-sm">
          <button class="icon-btn" title="Ubah" data-edit="${s.noInduk}">✎</button>
          <button class="icon-btn" title="Hapus" data-del="${s.noInduk}">🗑</button>
        </div>
      </td>
    </tr>
  `).join('');

  tbody.querySelectorAll('[data-edit]').forEach(b => b.onclick = () => {
    const s = appState.siswaList.find(x => String(x.noInduk) === b.dataset.edit);
    openSiswaModal(s);
  });
  tbody.querySelectorAll('[data-del]').forEach(b => b.onclick = () => confirmDeleteSiswa(b.dataset.del));
}

function akunChip(status) {
  if (status === 'Aktif') return '<span class="chip chip-success">Aktif</span>';
  if (status === 'Nonaktif') return '<span class="chip chip-error">Nonaktif</span>';
  return '<span class="chip chip-neutral">Belum dibuat</span>';
}

function openSiswaModal(siswa) {
  const isEdit = !!siswa;
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal">
      <div class="modal-header">
        <h3>${isEdit ? 'Ubah Data Siswa' : 'Tambah Siswa Baru'}</h3>
        <button class="icon-btn" id="sm-close">✕</button>
      </div>
      <form id="sm-form">
        <div class="field"><label>Nama Lengkap</label><input class="input" id="sm-nama" value="${isEdit ? escapeHtml(siswa.nama) : ''}" required></div>
        <div class="field-row">
          <div class="field"><label>No. Induk Sekolah</label><input class="input" id="sm-noinduk" inputmode="numeric" value="${isEdit ? escapeHtml(siswa.noInduk) : ''}" ${isEdit ? 'readonly' : ''} required></div>
          <div class="field"><label>NISN</label><input class="input" id="sm-nisn" inputmode="numeric" value="${isEdit ? escapeHtml(siswa.nisn) : ''}" required></div>
        </div>
        <div class="field-row">
          <div class="field"><label>Kelas</label><input class="input" id="sm-kelas" value="${isEdit ? escapeHtml(siswa.kelas) : ''}" required></div>
          <div class="field"><label>Ekstrakurikuler</label><input class="input" id="sm-ekskul" value="${isEdit ? escapeHtml(siswa.ekstrakurikuler) : ''}"></div>
        </div>
        <button type="submit" class="btn btn-primary btn-block">${isEdit ? 'Simpan Perubahan' : 'Tambah Siswa'}</button>
      </form>
    </div>
  `;
  document.body.appendChild(overlay);
  document.getElementById('sm-close').onclick = () => overlay.remove();
  overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };

  document.getElementById('sm-form').onsubmit = async (e) => {
    e.preventDefault();
    const payload = {
      noInduk: document.getElementById('sm-noinduk').value.trim(),
      nama: document.getElementById('sm-nama').value.trim(),
      nisn: document.getElementById('sm-nisn').value.trim(),
      kelas: document.getElementById('sm-kelas').value.trim(),
      ekstrakurikuler: document.getElementById('sm-ekskul').value.trim()
    };
    showLoading(true);
    const res = await api('adminUpsertSiswa', { siswa: payload });
    showLoading(false);
    if (res.success) {
      showToast(res.message, 'success');
      overlay.remove();
      await loadSiswaList();
      renderSiswaTable(appState.siswaList);
    } else {
      showToast(res.message, 'error');
    }
  };
}

function confirmDeleteSiswa(noInduk) {
  const s = appState.siswaList.find(x => String(x.noInduk) === noInduk);
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal" style="max-width:380px">
      <h3 class="mb-sm">Hapus Data Siswa?</h3>
      <p class="text-secondary mb-md">Data <strong>${escapeHtml(s ? s.nama : noInduk)}</strong> beserta kartu dan akunnya akan dihapus permanen.</p>
      <div class="flex gap-sm">
        <button class="btn btn-outline btn-block" id="cd-cancel">Batal</button>
        <button class="btn btn-danger btn-block" id="cd-confirm">Ya, Hapus</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  document.getElementById('cd-cancel').onclick = () => overlay.remove();
  document.getElementById('cd-confirm').onclick = async () => {
    showLoading(true);
    const res = await api('adminDeleteSiswa', { noInduk });
    showLoading(false);
    overlay.remove();
    if (res.success) {
      showToast(res.message, 'success');
      await loadSiswaList();
      renderSiswaTable(appState.siswaList);
    } else {
      showToast(res.message, 'error');
    }
  };
}

// -------- KELOLA AKUN (Siswa + Staff) --------
async function renderAkunSection(el, role) {
  el.innerHTML = `<div class="flex items-center gap-sm text-secondary"><div class="spinner" style="width:18px;height:18px;border-width:2px"></div> Memuat data akun...</div>`;
  const res = await api('adminListAkunSiswa', {});
  if (!res.success) { el.innerHTML = errorBox(res.message); return; }
  appState.akunList = res.list;
  appState.belumPunyaAkun = res.belumPunyaAkun;

  el.innerHTML = `
    <div class="card mb-lg">
      <div class="card-header">
        <div class="card-title">Akun Siswa</div>
        <button class="btn btn-primary btn-sm" id="ak-bulk" ${appState.belumPunyaAkun.length === 0 ? 'disabled' : ''}>
          + Buat Akun Massal (${appState.belumPunyaAkun.length} belum punya akun)
        </button>
      </div>
      <div class="table-wrap">
        <table class="data-table">
          <thead><tr><th>Nama</th><th>No. Induk</th><th>Kelas</th><th>Status</th><th>Terakhir Login</th><th></th></tr></thead>
          <tbody id="ak-tbody">
            ${appState.akunList.length ? appState.akunList.map(a => `
              <tr>
                <td>${escapeHtml(a.nama)}</td>
                <td class="cell-mono">${escapeHtml(a.noInduk)}</td>
                <td>${escapeHtml(a.kelas)}</td>
                <td>${akunChip(a.status)}</td>
                <td class="text-sm text-secondary">${a.terakhirLogin && a.terakhirLogin !== '-' ? new Date(a.terakhirLogin).toLocaleString('id-ID') : 'Belum pernah'}</td>
                <td><button class="btn btn-outline btn-sm" data-toggle="${a.noInduk}" data-status="${a.status}">${a.status === 'Aktif' ? 'Nonaktifkan' : 'Aktifkan'}</button></td>
              </tr>
            `).join('') : `<tr><td colspan="6" class="table-empty">Belum ada akun siswa.</td></tr>`}
          </tbody>
        </table>
      </div>
    </div>

    ${role === 'admin' ? await renderStaffAkunCardHtml() : ''}
  `;

  document.getElementById('ak-bulk').onclick = openBulkCreateModal;
  el.querySelectorAll('[data-toggle]').forEach(b => {
    b.onclick = async () => {
      const newStatus = b.dataset.status === 'Aktif' ? 'Nonaktif' : 'Aktif';
      showLoading(true);
      const res = await api('adminSetAkunStatus', { noInduk: b.dataset.toggle, status: newStatus });
      showLoading(false);
      if (res.success) { showToast(res.message, 'success'); renderAkunSection(el, role); }
      else showToast(res.message, 'error');
    };
  });

  if (role === 'admin') bindStaffAkunEvents(el);
}

function openBulkCreateModal() {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal">
      <div class="modal-header"><h3>Buat Akun Massal</h3><button class="icon-btn" id="bk-close">✕</button></div>
      <p class="text-secondary mb-md">Pilih siswa yang akan dibuatkan akun. Username = No. Induk, Password = NISN.</p>
      <div style="max-height:320px;overflow-y:auto;border:1px solid var(--border-hairline);border-radius:var(--radius);padding:var(--space-sm)">
        <label class="flex items-center gap-sm mb-sm"><input type="checkbox" id="bk-all"> <strong>Pilih Semua</strong></label>
        ${appState.belumPunyaAkun.map(s => `
          <label class="flex items-center gap-sm mb-sm">
            <input type="checkbox" class="bk-item" value="${s.noInduk}">
            ${escapeHtml(s.nama)} · <span class="mono text-sm">${escapeHtml(s.noInduk)}</span> · ${escapeHtml(s.kelas)}
          </label>
        `).join('')}
      </div>
      <button class="btn btn-primary btn-block mt-md" id="bk-submit">Buat Akun Terpilih</button>
    </div>
  `;
  document.body.appendChild(overlay);
  document.getElementById('bk-close').onclick = () => overlay.remove();
  document.getElementById('bk-all').onchange = (e) => {
    overlay.querySelectorAll('.bk-item').forEach(cb => cb.checked = e.target.checked);
  };
  document.getElementById('bk-submit').onclick = async () => {
    const selected = Array.from(overlay.querySelectorAll('.bk-item:checked')).map(cb => cb.value);
    if (!selected.length) return showToast('Pilih minimal satu siswa.', 'error');
    showLoading(true);
    const res = await api('adminBulkCreateAkun', { noIndukList: selected });
    showLoading(false);
    overlay.remove();
    if (res.success) {
      showToast(res.message, 'success');
      navigateAdmin('akun');
    } else showToast(res.message, 'error');
  };
}

async function renderStaffAkunCardHtml() {
  const res = await api('adminListStaff', {});
  const list = res.success ? res.list : [];
  appState.staffList = list;
  return `
    <div class="card">
      <div class="card-header">
        <div class="card-title">Akun Admin &amp; Pembina Ekstra</div>
        <button class="btn btn-primary btn-sm" id="st-add">+ Tambah Akun Staff</button>
      </div>
      <div class="table-wrap">
        <table class="data-table">
          <thead><tr><th>Username</th><th>Nama</th><th>Peran</th><th>Status</th><th></th></tr></thead>
          <tbody id="st-tbody">
            ${list.length ? list.map(s => `
              <tr>
                <td class="cell-mono">${escapeHtml(s.username)}</td>
                <td>${escapeHtml(s.nama)}</td>
                <td>${s.role === 'admin' ? 'Admin Tata Usaha' : 'Pembina Ekstra'}</td>
                <td>${akunChip(s.status)}</td>
                <td>
                  <div class="flex gap-sm">
                    <button class="icon-btn" title="Ubah" data-st-edit="${s.username}">✎</button>
                    <button class="icon-btn" title="${s.status === 'Aktif' ? 'Nonaktifkan' : 'Aktifkan'}" data-st-toggle="${s.username}" data-st-status="${s.status}">${s.status === 'Aktif' ? '⏸' : '▶'}</button>
                  </div>
                </td>
              </tr>
            `).join('') : `<tr><td colspan="5" class="table-empty">Belum ada akun staff.</td></tr>`}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function bindStaffAkunEvents(el) {
  const addBtn = document.getElementById('st-add');
  if (addBtn) addBtn.onclick = () => openStaffModal(null, el);
  el.querySelectorAll('[data-st-edit]').forEach(b => b.onclick = () => {
    const s = appState.staffList.find(x => x.username === b.dataset.stEdit);
    openStaffModal(s, el);
  });
  el.querySelectorAll('[data-st-toggle]').forEach(b => b.onclick = async () => {
    const newStatus = b.dataset.stStatus === 'Aktif' ? 'Nonaktif' : 'Aktif';
    showLoading(true);
    const res = await api('adminSetStaffStatus', { username: b.dataset.stToggle, status: newStatus });
    showLoading(false);
    if (res.success) { showToast(res.message, 'success'); navigateAdmin('akun'); }
    else showToast(res.message, 'error');
  });
}

function openStaffModal(staff, parentEl) {
  const isEdit = !!staff;
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal">
      <div class="modal-header"><h3>${isEdit ? 'Ubah Akun Staff' : 'Tambah Akun Staff'}</h3><button class="icon-btn" id="stm-close">✕</button></div>
      <form id="stm-form">
        <div class="field"><label>Username</label><input class="input" id="stm-username" value="${isEdit ? escapeHtml(staff.username) : ''}" ${isEdit ? 'readonly' : ''} required></div>
        <div class="field"><label>Nama Lengkap</label><input class="input" id="stm-nama" value="${isEdit ? escapeHtml(staff.nama) : ''}" required></div>
        <div class="field">
          <label>Peran</label>
          <select class="input" id="stm-role">
            <option value="admin" ${isEdit && staff.role === 'admin' ? 'selected' : ''}>Admin Tata Usaha</option>
            <option value="pembina" ${isEdit && staff.role === 'pembina' ? 'selected' : ''}>Pembina Ekstra</option>
          </select>
        </div>
        <div class="field">
          <label>${isEdit ? 'Kata Sandi Baru (kosongkan jika tidak diubah)' : 'Kata Sandi'}</label>
          <input class="input" type="password" id="stm-password" placeholder="Minimal 6 karakter" ${isEdit ? '' : 'required'}>
        </div>
        <button type="submit" class="btn btn-primary btn-block">${isEdit ? 'Simpan Perubahan' : 'Buat Akun'}</button>
      </form>
    </div>
  `;
  document.body.appendChild(overlay);
  document.getElementById('stm-close').onclick = () => overlay.remove();
  document.getElementById('stm-form').onsubmit = async (e) => {
    e.preventDefault();
    const payload = {
      username: document.getElementById('stm-username').value.trim(),
      nama: document.getElementById('stm-nama').value.trim(),
      role: document.getElementById('stm-role').value,
      password: document.getElementById('stm-password').value
    };
    showLoading(true);
    const res = await api('adminUpsertStaff', { staff: payload });
    showLoading(false);
    if (res.success) {
      showToast(res.message, 'success');
      overlay.remove();
      navigateAdmin('akun');
    } else showToast(res.message, 'error');
  };
}

// -------- LAPORAN & GRAFIK --------
async function renderLaporanSection(el, role) {
  el.innerHTML = `<div class="flex items-center gap-sm text-secondary"><div class="spinner" style="width:18px;height:18px;border-width:2px"></div> Memuat laporan...</div>`;
  const res = await api('adminLaporan', {});
  if (!res.success) { el.innerHTML = errorBox(res.message); return; }
  const rekap = res.rekap;
  const maxVal = Math.max(1, ...rekap.map(r => r.jumlahSiswa));

  el.innerHTML = `
    <div class="card mb-lg">
      <h3 class="mb-md">Rekap Peserta per Ekstrakurikuler</h3>
      <div class="flex flex-col gap-sm" style="display:flex;flex-direction:column;gap:12px">
        ${rekap.map(r => `
          <div>
            <div class="flex justify-between text-sm mb-sm"><span>${escapeHtml(r.ekstrakurikuler)}</span><strong>${r.jumlahSiswa} siswa</strong></div>
            <div style="height:10px;background:var(--surface-1);border-radius:999px;overflow:hidden;">
              <div style="height:100%;width:${(r.jumlahSiswa / maxVal) * 100}%;background:var(--electric-blue);"></div>
            </div>
          </div>
        `).join('') || '<p class="text-secondary">Belum ada data.</p>'}
      </div>
    </div>

    <div class="card">
      <h3 class="mb-md">Tabel Rekap</h3>
      <div class="table-wrap">
        <table class="data-table">
          <thead><tr><th>Ekstrakurikuler</th><th>Jumlah Siswa</th><th>Kartu Terunggah</th></tr></thead>
          <tbody>
            ${rekap.map(r => `<tr><td>${escapeHtml(r.ekstrakurikuler)}</td><td>${r.jumlahSiswa}</td><td>${r.jumlahKartu}</td></tr>`).join('') || `<tr><td colspan="3" class="table-empty">Belum ada data.</td></tr>`}
          </tbody>
        </table>
      </div>
    </div>
  `;
}
