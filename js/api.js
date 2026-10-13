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
  const t0 = performance.now();
  try {
    const res = await fetch(GAS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action, data })
    });
    const json = await res.json();
    Perf.log(action, t0, json);
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

// ============================================
// PERF — pengukur sederhana (gas-scale-turbo §4.1)
// ============================================
const Perf = {
  calls: [],
  log(action, t0, res) {
    const total = Math.round(performance.now() - t0);
    this.calls.push({ action, total, ms: res && res.ms, cached: !!(res && res.cached) });
    if (this.calls.length > 100) this.calls.shift();
  },
  table() { console.table(this.calls); },
  summary() {
    const byAction = {};
    this.calls.forEach(c => { (byAction[c.action] = byAction[c.action] || []).push(c.total); });
    console.table(Object.entries(byAction).map(([action, arr]) => ({
      action, calls: arr.length, avgMs: Math.round(arr.reduce((a, b) => a + b, 0) / arr.length)
    })));
  }
};

// ============================================
// SWR — tampilkan data lokal dulu (instan), segarkan di belakang layar
// (gas-scale-turbo §4.5). Dipakai agar pindah menu admin tidak nunggu server.
// ============================================
const SWR = {
  KEY_PREFIX: 'sikartu_swr_',
  FRESH_MS: 25000, // selama ini dianggap masih segar -> tidak perlu nunggu server

  read(key) {
    try {
      const raw = localStorage.getItem(this.KEY_PREFIX + key);
      if (!raw) return null;
      return JSON.parse(raw); // { data, at }
    } catch (e) { return null; }
  },
  write(key, data) {
    try { localStorage.setItem(this.KEY_PREFIX + key, JSON.stringify({ data, at: Date.now() })); }
    catch (e) { /* localStorage penuh/diblokir — abaikan, SWR hanya optimisasi */ }
  },
  isFresh(entry) { return entry && (Date.now() - entry.at) < this.FRESH_MS; },

  /**
   * load(key, action, data, render, opts)
   * - Render langsung dari cache lokal bila ada (instan).
   * - Lalu tetap memanggil server: kalau cache tadi sudah "segar" dan bukan forceFresh,
   *   panggilan server tetap jalan di belakang layar tanpa memblokir render pertama.
   * - render(result, fromCache) dipanggil setiap ada data baru (cache lalu server).
   */
  async load(key, action, data, render, opts = {}) {
    const cached = this.read(key);
    let renderedFromCache = false;
    if (cached && cached.data && cached.data.success) {
      render(cached.data, true);
      renderedFromCache = true;
    }
    const payload = opts.forceFresh ? Object.assign({}, data, { _fresh: true }) : data;
    const res = await api(action, payload);
    if (res.success) {
      this.write(key, res);
      render(res, false);
    } else if (!renderedFromCache) {
      render(res, false);
    }
    return res;
  }
};

// ============================================
// WARMUP — bangunkan server sebelum dipakai (gas-scale-turbo §4.7)
// GET no-cors, dibatasi 1x/4 menit per lingkup lewat sessionStorage.
// ============================================
function warmUpServer(scope) {
  try {
    const key = 'sikartu_warm_' + scope;
    const last = Number(sessionStorage.getItem(key) || 0);
    if (Date.now() - last < 4 * 60 * 1000) return;
    sessionStorage.setItem(key, String(Date.now()));
    fetch(GAS_URL + '?action=warmup&scope=' + scope, { method: 'GET', mode: 'no-cors' }).catch(() => {});
  } catch (e) { /* lingkungan tanpa sessionStorage — abaikan */ }
}
