/**
 * CatatDuit - js/backup.js
 * Task T7: Backup & restore (F6) + layar Pengaturan
 * Pemilik: Yuken
 *
 * Mengikuti: PRD.md (F6, 7.3, 9.3, 12, 13), DESIGN.md, TASK.md
 * Logika backup murni (buildExport/parseImport/terapkanImport) dipisah dari UI
 * supaya bisa diuji (keputusan pengujian PRD bagian 16).
 */

const Backup = (function () {
  'use strict';

  const APP = 'catatduit';
  const SCHEMA_VERSION = 1;

  // -------------------------------------------------------------------------
  // Logika murni: ekspor
  // -------------------------------------------------------------------------
  function buildExport({ includeReceipts = false } = {}) {
    const out = {
      app: APP,
      schemaVersion: SCHEMA_VERSION,
      exportedAt: new Date().toISOString(),
      includesReceipts: !!includeReceipts,
      categories: Store.listCategories(),
      transactions: Store.listTransactions(),
      merchantRules: [],
      settings: Store.getSettings(),
    };
    return out;
  }

  function blobKeBase64(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result).split(',')[1] || '');
      reader.onerror = () => reject(reader.error || new Error('Gagal membaca foto'));
      reader.readAsDataURL(blob);
    });
  }

  /* JSON lengkap siap unduh. Foto struk (kalau ikut) disimpan sebagai base64. */
  async function buildExportJson(includeReceipts) {
    const data = buildExport({ includeReceipts });
    if (includeReceipts) {
      data.receipts = [];
      for (const t of data.transactions) {
        if (!t.receiptId) continue;
        const blob = await Store.getReceipt(t.receiptId);
        if (!blob) continue;
        data.receipts.push({
          id: t.receiptId,
          mime: blob.type || 'image/jpeg',
          dataBase64: await blobKeBase64(blob),
        });
      }
    }
    return JSON.stringify(data, null, 2);
  }

  // -------------------------------------------------------------------------
  // Logika murni: validasi impor
  // -------------------------------------------------------------------------
  function parseImport(raw) {
    let d = raw;
    if (typeof d === 'string') {
      try { d = JSON.parse(d); }
      catch (e) { throw new Error('Berkas rusak atau bukan berkas backup CatatDuit.'); }
    }
    if (!d || typeof d !== 'object' || d.app !== APP) {
      throw new Error('Berkas ini bukan backup CatatDuit.');
    }
    if (typeof d.schemaVersion !== 'number') {
      throw new Error('Berkas rusak: versi data tidak ditemukan.');
    }
    if (d.schemaVersion > SCHEMA_VERSION) {
      throw new Error('Backup ini dibuat dengan versi aplikasi yang lebih baru. Silakan perbarui aplikasi terlebih dahulu, lalu impor lagi.');
    }
    if (!Array.isArray(d.categories) || !Array.isArray(d.transactions)) {
      throw new Error('Berkas rusak: data kategori/transaksi tidak lengkap.');
    }
    return {
      schemaVersion: d.schemaVersion,
      categories: d.categories,
      transactions: d.transactions,
      merchantRules: Array.isArray(d.merchantRules) ? d.merchantRules : [],
      settings: (d.settings && typeof d.settings === 'object') ? d.settings : {},
      receipts: Array.isArray(d.receipts) ? d.receipts : [],
    };
  }

  // -------------------------------------------------------------------------
  // Logika: terapkan impor
  // mode 'gabung' -> ID yang sudah ada dilewati apa pun isinya (data lama menang)
  // mode 'timpa'  -> seluruh data diganti (pemanggil wajib sudah konfirmasi)
  // -------------------------------------------------------------------------
  async function terapkanImport(parsed, mode) {
    let transaksiBaru = 0, kategoriBaru = 0, transaksiDilewati = 0, kategoriDilewati = 0;

    if (mode === 'timpa') {
      for (const t of Store.listTransactions()) await Store.deleteTransaction(t.id);
      for (const k of Store.listCategories()) Store.deleteCategory(k.id);
    }

    const idTxAda = new Set(Store.listTransactions().map((t) => t.id));
    for (const tx of parsed.transactions) {
      if (!tx || !tx.id || idTxAda.has(tx.id)) { transaksiDilewati += 1; continue; }
      try { Store.saveTransaction(tx); idTxAda.add(tx.id); transaksiBaru += 1; }
      catch (e) { transaksiDilewati += 1; }
    }

    const idKatAda = new Set(Store.listCategories().map((k) => k.id));
    const namaAda = new Set(Store.listCategories().map((k) => k.type + '|' + k.name.toLowerCase()));
    for (const kat of parsed.categories) {
      if (!kat || !kat.id || idKatAda.has(kat.id)) { kategoriDilewati += 1; continue; }
      try { Store.saveCategory(kat); idKatAda.add(kat.id); kategoriBaru += 1; }
      catch (e) { kategoriDilewati += 1; }
    }

    Store.saveSettings(parsed.settings);
    return { transaksiBaru, kategoriBaru, transaksiDilewati, kategoriDilewati };
  }

  // -------------------------------------------------------------------------
  // UI: layar Pengaturan
  // -------------------------------------------------------------------------
  function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
  }

  function unduh(json) {
    const tanggal = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const blob = new Blob([json], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'catatduit-backup-' + tanggal + '.json';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  function renderSettingsScreen(container) {
    const s = Store.getSettings();
    const backupTerakhir = s.backupTerakhir
      ? new Date(s.backupTerakhir).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })
      : 'belum pernah';

    container.innerHTML = `
      <h1>Pengaturan</h1>

      <section class="card">
        <h2>Backup Data</h2>
        <p style="font-size: 0.9375rem; color: var(--ink-muted); margin-top: 0;">
          Backup terakhir: <strong>${escapeHtml(backupTerakhir)}</strong>
        </p>
        <p style="font-size: 0.875rem; color: var(--ink-muted);">
          Data kamu tersimpan hanya di perangkat ini. Rutinlah membuat backup dan simpan berkasnya di tempat aman.
        </p>
        <div style="display: flex; flex-direction: column; gap: var(--sp-sm);">
          <button type="button" class="btn btn-accent btn-block" id="set-btn-backup-foto">Buat Backup (dengan foto struk)</button>
          <button type="button" class="btn btn-primary btn-block" id="set-btn-backup">Buat Backup (tanpa foto)</button>
        </div>
      </section>

      <section class="card">
        <h2>Impor Backup</h2>
        <p style="font-size: 0.875rem; color: var(--ink-muted); margin-top: 0;">
          Pilih berkas backup (.json) yang pernah kamu unduh.
        </p>
        <div class="field">
          <label for="set-file-impor">Berkas backup</label>
          <input type="file" id="set-file-impor" class="input" accept="application/json,.json">
        </div>
      </section>

      <section class="card">
        <h2>Zona Bahaya</h2>
        <p style="font-size: 0.875rem; color: var(--ink-muted); margin-top: 0;">
          Menghapus semua transaksi dan kategori di perangkat ini. Foto struk ikut terhapus.
        </p>
        <button type="button" class="btn btn-danger btn-block" id="set-btn-hapus">Hapus Semua Data</button>
      </section>
    `;

    // ----- Buat backup -----
    async function buatBackup(denganFoto) {
      try {
        unduh(await Backup.buildExportJson(denganFoto));
        Store.saveSettings({ backupTerakhir: new Date().toISOString() });
        App.toast('Backup berhasil diunduh.');
        renderSettingsScreen(container);
      } catch (e) {
        App.toast('Backup gagal: ' + e.message);
      }
    }
    container.querySelector('#set-btn-backup').addEventListener('click', () => buatBackup(false));
    container.querySelector('#set-btn-backup-foto').addEventListener('click', () => buatBackup(true));

    // ----- Impor -----
    container.querySelector('#set-file-impor').addEventListener('change', async (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      let parsed;
      try {
        parsed = Backup.parseImport(await file.text());
      } catch (err) {
        App.toast(err.message);
        e.target.value = '';
        return;
      }
      tanyaImpor(container, parsed, async (mode) => {
        if (mode === 'timpa') {
          // PRD bagian 12: simpan salinan otomatis sebelum menimpa
          unduh(await Backup.buildExportJson(true));
        }
        const r = await Backup.terapkanImport(parsed, mode);
        Store.saveSettings({ backupTerakhir: new Date().toISOString() });
        App.toast('Impor selesai: ' + r.transaksiBaru + ' transaksi baru, ' + r.transaksiDilewati + ' dilewati.');
        renderSettingsScreen(container);
      });
      e.target.value = '';
    });

    // ----- Hapus semua data (konfirmasi dua langkah) -----
    container.querySelector('#set-btn-hapus').addEventListener('click', () => {
      konfirmasiDuaLangkah(container);
    });
  }

  function tanyaImpor(container, parsed, onPilih) {
    const jumlahTx = parsed.transactions.length;
    const jumlahKat = parsed.categories.length;
    const overlay = document.createElement('div');
    overlay.className = 'dialog-backdrop';
    overlay.innerHTML = `
      <div class="dialog" role="dialog" aria-modal="true" aria-labelledby="impor-judul">
        <h2 id="impor-judul" style="font-size: 1.25rem; margin: 0 0 var(--sp-sm);">Cara Mengimpor?</h2>
        <p style="font-size: 0.9375rem; color: var(--ink-muted); margin: 0 0 var(--sp-md);">
          Berkas berisi ${jumlahTx} transaksi dan ${jumlahKat} kategori.
        </p>
        <div style="display: flex; flex-direction: column; gap: var(--sp-sm);">
          <button type="button" class="btn btn-primary btn-block" id="impor-gabung">Gabungkan (data lama tetap aman)</button>
          <button type="button" class="btn btn-danger btn-block" id="impor-timpa">Timpa Semua (hapus data lama)</button>
          <button type="button" class="btn btn-ghost btn-block" id="impor-batal">Batal</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    const tutup = () => overlay.remove();
    overlay.querySelector('#impor-batal').addEventListener('click', tutup);
    overlay.querySelector('#impor-gabung').addEventListener('click', () => { tutup(); onPilih('gabung'); });
    overlay.querySelector('#impor-timpa').addEventListener('click', () => { tutup(); onPilih('timpa'); });
  }

  /* Dua langkah: konfirmasi umum -> tawarkan backup -> konfirmasi final. */
  function konfirmasiDuaLangkah(container) {
    const overlay = document.createElement('div');
    overlay.className = 'dialog-backdrop';
    overlay.innerHTML = `
      <div class="dialog" role="dialog" aria-modal="true">
        <h2 style="font-size: 1.25rem; margin: 0 0 var(--sp-sm);">Hapus Semua Data?</h2>
        <p style="font-size: 0.9375rem; color: var(--ink-muted); margin: 0 0 var(--sp-md);">
          Sebaiknya buat backup dulu. Setelah dihapus, data tidak bisa dikembalikan.
        </p>
        <div style="display: flex; flex-direction: column; gap: var(--sp-sm);">
          <button type="button" class="btn btn-primary btn-block" id="hap-dulu">Buat Backup Dulu</button>
          <button type="button" class="btn btn-danger btn-block" id="hap-lanjut">Lanjutkan Hapus</button>
          <button type="button" class="btn btn-ghost btn-block" id="hap-batal">Batal</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    const tutup = () => overlay.remove();
    overlay.querySelector('#hap-batal').addEventListener('click', tutup);
    overlay.querySelector('#hap-dulu').addEventListener('click', async () => {
      unduh(await Backup.buildExportJson(true));
      Store.saveSettings({ backupTerakhir: new Date().toISOString() });
      App.toast('Backup diunduh. Tekan "Lanjutkan Hapus" bila yakin.');
    });
    overlay.querySelector('#hap-lanjut').addEventListener('click', () => {
      overlay.remove();
      konfirmasiFinal(container);
    });
  }

  function konfirmasiFinal(container) {
    const overlay = document.createElement('div');
    overlay.className = 'dialog-backdrop';
    overlay.innerHTML = `
      <div class="dialog" role="dialog" aria-modal="true">
        <h2 style="font-size: 1.25rem; margin: 0 0 var(--sp-sm);">Yakin 100%?</h2>
        <p style="font-size: 0.9375rem; color: var(--ink-muted); margin: 0 0 var(--sp-md);">
          Semua transaksi, kategori, dan foto struk akan dihapus permanen dari perangkat ini.
        </p>
        <div style="display: flex; gap: var(--sp-sm); justify-content: flex-end;">
          <button type="button" class="btn btn-ghost" id="final-batal">Batal</button>
          <button type="button" class="btn btn-danger" id="final-ya">Hapus Permanen</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    const tutup = () => overlay.remove();
    overlay.querySelector('#final-batal').addEventListener('click', tutup);
    overlay.querySelector('#final-ya').addEventListener('click', async () => {
      tutup();
      Store.resetAll();
      App.toast('Semua data dihapus.');
      renderSettingsScreen(container);
    });
  }

  App.registerScreen('pengaturan', {
    title: 'Pengaturan',
    render: renderSettingsScreen,
  });

  // Kembalikan API logika murni untuk pengujian
  return { buildExport, buildExportJson, parseImport, terapkanImport };
})();
