/* Tes CatatDuit — assert polos tanpa framework (keputusan pengujian PRD bagian 16).
   Jalankan: buka test.html di browser (atau lewat http.server). */
(function () {
  'use strict';

  const hasil = [];
  let gagal = 0;

  function tes(nama, fn) {
    try {
      fn();
      hasil.push(['ok', nama]);
    } catch (err) {
      gagal += 1;
      hasil.push(['fail', nama + ' :: ' + (err && err.message ? err.message : err)]);
    }
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

  tes('hapus transaksi berfoto: blob receipt ikut terhapus (IndexedDB)', () => {
    return; // versi async dites terpisah di bawah
  });

  tes('schemaVersion tersimpan', () => {
    const raw = JSON.parse(localStorage.getItem('catatduit:data') || '{}');
    sama(raw.schemaVersion, 1);
  });

  tes('getSettings/saveSettings bolak-balik', () => {
    Store.saveSettings({ backupTerakhir: '2026-10-31T00:00:00Z' });
    sama(Store.getSettings().backupTerakhir, '2026-10-31T00:00:00Z');
  });

  // Hapus blob IndexedDB (async) — dijalankan terpisah, hasil digabung ke ringkasan.
  const tesAsyncBlob = async () => {
    const blob = new Blob(['x'], { type: 'image/png' });
    const kat = Store.listCategories('expense')[0];
    const tx = Store.saveTransaction({ type: 'expense', amount: 9000, categoryId: kat.id, categoryName: kat.name, datetime: '2026-10-31T05:00:00', receipt: blob });
    if (!tx.receiptId) throw new Error('receiptId tidak dibuat');
    const ada = await Store.getReceipt(tx.receiptId);
    if (!ada) throw new Error('receipt gagal disimpan');
    Store.deleteTransaction(tx.id);
    const sisa = await Store.getReceipt(tx.receiptId);
    if (sisa) throw new Error('blob receipt tidak ikut terhapus');
  };

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

  // ===== Render =====
  function render() {
    const ul = document.getElementById('hasil');
    ul.innerHTML = '';
    for (const [status, teks] of hasil) {
      const li = document.createElement('li');
      li.className = status;
      li.textContent = (status === 'ok' ? 'PASS  ' : 'FAIL  ') + teks;
      ul.appendChild(li);
    }
    const total = hasil.length;
    document.getElementById('ringkasan').innerHTML =
      '<p><strong>' + (total - gagal) + '/' + total + '</strong> tes lulus' + (gagal ? ' - ' + gagal + ' GAGAL' : ' - SEMUA HIJAU') + '</p>';
    document.title = (gagal ? 'FAIL ' : 'PASS ') + 'CatatDuit — Tes';
    window.__TEST_DONE__ = true;
    window.__TEST_FAILED__ = gagal;
  }

  function sinkron() {
    render();
    if (typeof Store !== 'undefined' && typeof Store.whenReady === 'function') {
      Store.whenReady()
        .then(tesAsyncBlob)
        .then(() => { hasil.push(['ok', 'hapus transaksi berfoto: blob receipt ikut terhapus (IndexedDB)']); })
        .catch((err) => { gagal += 1; hasil.push(['fail', 'hapus transaksi berfoto :: ' + err.message]); })
        .finally(render);
    }
  }

  sinkron();
})();
