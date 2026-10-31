/* Tes CatatDuit — assert polos tanpa framework (keputusan pengujian PRD bagian 16).
   Jalankan: buka test.html di browser (atau lewat http.server). */
(function () {
  'use strict';

  const hasil = [];
  let gagal = 0;

  const antrean = [];

  function tes(nama, fn) {
    antrean.push({ nama, fn });
  }

  function sama(a, b, pesan) {
    if (a !== b) throw new Error((pesan || 'nilai beda') + ' (dapat ' + JSON.stringify(a) + ', harap ' + JSON.stringify(b) + ')');
  }
  function norm(s) { return String(s).replace(/\u00a0/g, ' '); }

  // ===== App (T1) =====
  tes('formatRupiah: 1250000 -> "Rp 1.250.000"', () => {
    sama(norm(App.formatRupiah(1250000)), 'Rp 1.250.000');
  });
  tes('formatRupiah: 0 -> "Rp 0"', () => {
    sama(norm(App.formatRupiah(0)), 'Rp 0');
  });
  tes('formatRupiah: tanpa desimal', () => {
    sama(norm(App.formatRupiah(1250.75)).includes(','), false, 'tidak boleh ada koma desimal');
  });
  tes('esc: netralkan HTML berbahaya', () => {
    sama(App.esc('<img src=x onerror=alert(1)>"\''), '&lt;img src=x onerror=alert(1)&gt;&quot;&#39;');
  });

  // ===== Store (T2) =====
  tes('Store ada dan punya API kontrak', () => {
    for (const fn of ['listTransactions', 'saveTransaction', 'deleteTransaction', 'listCategories', 'saveCategory', 'deleteCategory', 'getSettings', 'saveSettings']) {
      if (typeof Store[fn] !== 'function') throw new Error('Store.' + fn + ' bukan fungsi');
    }
  });

  tes('init isi kategori bawaan sesuai PRD bagian 17', () => {
    const exp = ['Makan', 'Transport', 'Belanja', 'Tagihan', 'Kesehatan', 'Hiburan', 'Lainnya'];
    const belanja = Store.listCategories('expense').map((k) => k.name);
    for (const n of exp) if (!belanja.includes(n)) throw new Error('kategori expense hilang: ' + n);
    const masuk = Store.listCategories('income').map((k) => k.name);
    for (const n of ['Gaji', 'Bonus', 'Usaha', 'Lainnya']) if (!masuk.includes(n)) throw new Error('kategori income hilang: ' + n);
  });

  tes('simpan transaksi valid: id & timestamp terisi otomatis', () => {
    const tx = Store.saveTransaction({ type: 'expense', amount: 15000, categoryId: 'c-makan', categoryName: 'Makan', note: 'siomay', datetime: '2026-10-31T09:00:00' });
    if (!tx.id) throw new Error('id kosong');
    if (!tx.createdAt || !tx.updatedAt) throw new Error('timestamp kosong');
    sama(Store.listTransactions().some((t) => t.id === tx.id), true);
  });

  tes('tolak jumlah 0 / negatif / desimal / bukan angka', () => {
    for (const jml of [0, -5, 12.5, 'seribu', NaN]) {
      let ditolak = false;
      try { Store.saveTransaction({ type: 'expense', amount: jml, categoryId: 'c-makan', categoryName: 'Makan', datetime: '2026-10-31T09:00:00' }); }
      catch (e) { ditolak = true; }
      sama(ditolak, true, 'jumlah ' + jml + ' harusnya ditolak');
    }
  });

  tes('tolak jumlah di atas Rp 999.999.999.999', () => {
    let ditolak = false;
    try { Store.saveTransaction({ type: 'expense', amount: 1000000000000, categoryId: 'c-makan', categoryName: 'Makan', datetime: '2026-10-31T09:00:00' }); }
    catch (e) { ditolak = true; }
    sama(ditolak, true);
  });

  tes('tolak jenis/type tidak dikenal', () => {
    let ditolak = false;
    try { Store.saveTransaction({ type: 'transfer', amount: 1000, categoryId: 'c-makan', categoryName: 'Makan', datetime: '2026-10-31T09:00:00' }); }
    catch (e) { ditolak = true; }
    sama(ditolak, true);
  });

  tes('listTransactions urut terbaru di atas', () => {
    const a = Store.saveTransaction({ type: 'income', amount: 1000, categoryId: 'c-gaji', categoryName: 'Gaji', datetime: '2026-10-30T08:00:00' });
    const b = Store.saveTransaction({ type: 'income', amount: 2000, categoryId: 'c-gaji', categoryName: 'Gaji', datetime: '2026-10-31T08:00:00' });
    const list = Store.listTransactions();
    sama(list.findIndex((t) => t.id === b.id) < list.findIndex((t) => t.id === a.id), true);
  });

  tes('edit transaksi: updatedAt berubah, createdAt tetap', () => {
    const tx = Store.saveTransaction({ type: 'expense', amount: 5000, categoryId: 'c-makan', categoryName: 'Makan', datetime: '2026-10-31T07:00:00' });
    const edited = Store.saveTransaction({ ...tx, amount: 6000 });
    sama(edited.amount, 6000);
    sama(edited.createdAt, tx.createdAt);
    if (edited.updatedAt === tx.updatedAt) throw new Error('updatedAt tidak berubah');
  });

  tes('kategori duplikat (beda huruf besar/kecil) ditolak', () => {
    let ditolak = false;
    try { Store.saveCategory({ name: 'makan', type: 'expense', keywords: [] }); }
    catch (e) { ditolak = true; }
    sama(ditolak, true, '"makan" vs "Makan" harusnya ditolak');
  });

  tes('hapus kategori terpakai: transaksi tetap simpan nama snapshot', () => {
    const kat = Store.saveCategory({ name: 'Kost', type: 'expense', keywords: [] });
    const tx = Store.saveTransaction({ type: 'expense', amount: 700000, categoryId: kat.id, categoryName: kat.name, datetime: '2026-10-31T06:00:00' });
    Store.deleteCategory(kat.id);
    sama(Store.listCategories('expense').some((k) => k.id === kat.id), false);
    const setelah = Store.listTransactions().find((t) => t.id === tx.id);
    sama(setelah.categoryName, 'Kost', 'snapshot nama harus bertahan');
  });

  tes('schemaVersion tersimpan', () => {
    const raw = JSON.parse(localStorage.getItem('catatduit:data') || '{}');
    sama(raw.schemaVersion, 1);
  });

  tes('getSettings/saveSettings bolak-balik', () => {
    Store.saveSettings({ backupTerakhir: '2026-10-31T00:00:00Z' });
    sama(Store.getSettings().backupTerakhir, '2026-10-31T00:00:00Z');
  });

  // Hapus transaksi berfoto: blob receipt ikut terhapus (IndexedDB, async)
  tes('hapus transaksi berfoto: blob receipt ikut terhapus (IndexedDB)', async () => {
    const blob = new Blob(['x'], { type: 'image/png' });
    const kat = Store.listCategories('expense')[0];
    const tx = Store.saveTransaction({ type: 'expense', amount: 9000, categoryId: kat.id, categoryName: kat.name, datetime: '2026-10-31T05:00:00', receipt: blob });
    if (!tx.receiptId) throw new Error('receiptId tidak dibuat');
    const ada = await Store.getReceipt(tx.receiptId);
    if (!ada) throw new Error('receipt gagal disimpan');
    Store.deleteTransaction(tx.id);
    const sisa = await Store.getReceipt(tx.receiptId);
    if (sisa) throw new Error('blob receipt tidak ikut terhapus');
  });

  // ===== Integrasi layar (E2E ringan): form T3 + Beranda T4 lewat UI beneran =====
  function tesAlurForm() {
    // Mulai dari kondisi bersih untuk alur ini
    for (const id of Store.listTransactions().map((t) => t.id)) Store.deleteTransaction(id);
    App.openScreen('transaksi', {});

    const input = document.querySelector('#tx-amount');
    if (!input) throw new Error('form transaksi tidak dirender');
    input.value = '25000';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    sama(document.querySelector('#tx-amount-preview').textContent.replace(/\u00a0/g, ' '), 'Rp 25.000', 'pratinjau live');

    document.querySelector('#tx-btn-type-income').click();
    const cat = document.querySelector('#tx-category');
    if (cat.options.length < 2) throw new Error('kategori income tidak termuat');
    cat.selectedIndex = 1;

    document.querySelector('#tx-btn-submit').click();
    if (!document.querySelector('#layar-beranda.is-active')) throw new Error('tidak kembali ke Beranda setelah simpan');
    const saldo = document.getElementById('dash-total-balance');
    sama(saldo.textContent.replace(/\u00a0/g, ' ').trim(), 'Rp 25.000', 'saldo Beranda setelah simpan');
    if (!document.querySelector('#dash-today-tx-list .list-row')) throw new Error('transaksi baru tidak muncul di daftar hari ini');
  }

  tes('alur form: isi -> simpan -> Beranda terupdate (E2E)', tesAlurForm);

  // ===== Backup & restore (T7) =====
  tes('Backup: API kontrak ada', () => {
    for (const fn of ['buildExport', 'parseImport']) {
      if (typeof Backup[fn] !== 'function') throw new Error('Backup.' + fn + ' bukan fungsi');
    }
  });

  tes('Backup: buildExport sesuai format PRD 9.3', () => {
    const data = Backup.buildExport({ includeReceipts: false });
    sama(data.app, 'catatduit');
    sama(data.schemaVersion, 1);
    sama(data.includesReceipts, false);
    if (!Array.isArray(data.categories) || !Array.isArray(data.transactions) || !Array.isArray(data.merchantRules)) {
      throw new Error('koleksi tidak berupa array');
    }
    if (typeof data.settings !== 'object') throw new Error('settings hilang');
    if (!data.exportedAt) throw new Error('exportedAt hilang');
    if ('receipts' in data) throw new Error('tanpa foto tidak boleh bawa receipts');
  });

  tes('Backup: parseImport menolak file bukan catatduit', () => {
    let ditolak = false;
    try { Backup.parseImport({ app: 'aplikasi-lain', schemaVersion: 1 }); }
    catch (e) { ditolak = true; }
    sama(ditolak, true);
  });

  tes('Backup: parseImport menolak versi lebih baru', () => {
    let pesan = '';
    try { Backup.parseImport({ app: 'catatduit', schemaVersion: 99, categories: [], transactions: [], merchantRules: [], settings: {} }); }
    catch (e) { pesan = e.message; }
    if (!pesan.includes('perbarui aplikasi')) throw new Error('pesan harus menyuruh perbarui aplikasi, dapat: ' + pesan);
  });

  tes('Backup: impor Gabungkan — ID yang ada dilewati, data lama menang', async () => {
    const sebelum = Store.listTransactions();
    if (!sebelum.length) throw new Error('butuh minimal 1 transaksi dari tes sebelumnya');
    const lama = sebelum[0];
    const masuk = {
      app: 'catatduit', schemaVersion: 1, exportedAt: '2026-11-01T00:00:00Z',
      categories: [{ id: 'c-impor-1', name: 'KategoriImpor', type: 'expense', keywords: [], createdAt: '2026-11-01T00:00:00Z' }],
      transactions: [
        { ...lama, amount: lama.amount + 777 },                 // ID sama, isi beda -> harus dilewati
        { id: 'tx-impor-baru', type: 'income', amount: 1000, categoryId: 'x', categoryName: 'X', datetime: '2026-11-01T00:00:00Z' }
      ],
      merchantRules: [], settings: {}
    };
    const hasil = Backup.parseImport(masuk);
    const ringkas = await Backup.terapkanImport(hasil, 'gabung');
    sama(ringkas.transaksiBaru, 1);
    const sesudah = Store.listTransactions();
    sama(sesudah.find((t) => t.id === lama.id).amount, lama.amount, 'data lama harus menang');
    if (!sesudah.find((t) => t.id === 'tx-impor-baru')) throw new Error('transaksi baru tidak masuk');
    if (!Store.listCategories('expense').some((k) => k.id === 'c-impor-1')) throw new Error('kategori impor tidak masuk');
  });

  tes('Backup: impor Timpa — seluruh data diganti', async () => {
    const masuk = {
      app: 'catatduit', schemaVersion: 1, exportedAt: '2026-11-01T00:00:00Z',
      categories: [{ id: 'c-timpa-1', name: 'SatuSatu', type: 'expense', keywords: [], createdAt: '2026-11-01T00:00:00Z' }],
      transactions: [{ id: 'tx-timpa-1', type: 'expense', amount: 500, categoryId: 'c-timpa-1', categoryName: 'SatuSatu', datetime: '2026-11-01T00:00:00Z' }],
      merchantRules: [], settings: {}
    };
    await Backup.terapkanImport(Backup.parseImport(masuk), 'timpa');
    const tx = Store.listTransactions();
    sama(tx.length, 1);
    sama(tx[0].id, 'tx-timpa-1');
    sama(Store.listCategories('expense').length, 1);
  });

  tes('Store.resetAll: kembali ke kondisi awal dengan kategori bawaan', () => {
    Store.resetAll();
    sama(Store.listTransactions().length, 0);
    sama(Store.listCategories('expense').length, 7, 'kategori expense bawaan harus 7');
    sama(Store.listCategories('income').length, 4, 'kategori income bawaan harus 4');
  });

  // ===== Eksekusi berurutan (sync & async satu antrean, urutan dijamin) =====
  function render() {
    const ul = document.getElementById('hasil');
    ul.innerHTML = '';
    for (const [status, teks] of hasil) {
      const li = document.createElement('li');
      li.className = status;
      li.textContent = (status === 'ok' ? 'PASS  ' : 'FAIL  ') + teks;
      ul.appendChild(li);
    }
    const total = antrean.length;
    document.getElementById('ringkasan').innerHTML =
      '<p><strong>' + (total - gagal) + '/' + total + '</strong> tes lulus' + (gagal ? ' - ' + gagal + ' GAGAL' : ' - SEMUA HIJAU') + '</p>';
    document.title = (gagal ? 'FAIL ' : 'PASS ') + 'CatatDuit — Tes';
    window.__TEST_DONE__ = true;
    window.__TEST_FAILED__ = gagal;
  }

  async function jalankan() {
    // Suite selalu mulai dari kondisi bersih — localStorage browser asli persisten
    // antar-run, jadi tanpa reset hasilnya bergantung pada run sebelumnya.
    if (typeof Store !== 'undefined' && typeof Store.resetAll === 'function') Store.resetAll();
    for (const { nama, fn } of antrean) {
      try {
        await fn();
        hasil.push(['ok', nama]);
      } catch (err) {
        gagal += 1;
        hasil.push(['fail', nama + ' :: ' + (err && err.message ? err.message : err)]);
      }
      render();
    }
  }

  jalankan();
})();
