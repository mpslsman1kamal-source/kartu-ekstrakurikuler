// ============================================
// API HELPERS — komunikasi ke GAS via fetch()
// Tidak pakai google.script.run. POST wajib text/plain
// untuk menghindari CORS preflight yang diblok GAS.
// ============================================

const Session = {
  KEY: 'sikartu_session',

  save(token, role, profile) {
    localStorage.setItem(this.KEY, JSON.stringify({ token, role, profile, savedAt: Date.now() }));
  },
  get() {
    try { return JSON.parse(localStorage.getItem(this.KEY) || 'null'); }
    catch (e) { return null; }
  },
  clear() { localStorage.removeItem(this.KEY); },
  token() { const s = this.get(); return s ? s.token : null; }
};

async function callApi(action, data = {}) {
  try {
    const res = await fetch(GAS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action, data })
    });
    const json = await res.json();
    if (json.code === 'UNAUTHORIZED') {
      Session.clear();
      showToast('Sesi berakhir. Silakan login kembali.', 'error');
      renderLoginView();
    }
    return json;
  } catch (err) {
    showToast('Gagal terhubung ke server: ' + err.message, 'error');
    return { success: false, message: 'Koneksi gagal.' };
  }
}

// Pemanggil otomatis menyertakan token sesi aktif
async function api(action, data = {}) {
  const token = Session.token();
  return callApi(action, Object.assign({}, data, { token }));
}
