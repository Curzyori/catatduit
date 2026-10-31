/* CatatDuit — satu pintu data (T2). Semua UI wajib lewat Store.*, dilarang
   menyentuh localStorage/indexedDB langsung (lihat TASK.md).
   Aturan data PRD bagian 9: uang integer Rupiah, waktu ISO 8601, id UUID
   sisi klien, schemaVersion untuk migrasi. Foto struk = blob di IndexedDB. */
const Store = (function () {
  'use strict';

  const KEY = 'catatduit:data';
  const SCHEMA_VERSION = 1;
  const MAX_AMOUNT = 999999999999;
  const DB_NAME = 'catatduit';
  const DB_RECEIPTS = 'receipts';

  const DEFAULT_CATEGORIES = [
    { name: 'Makan', type: 'expense', keywords: ['Resto', 'Cafe', 'Warung'] },
    { name: 'Transport', type: 'expense', keywords: ['Pertamina', 'SPBU'] },
    { name: 'Belanja', type: 'expense', keywords: ['Indomaret', 'Alfamart'] },
    { name: 'Tagihan', type: 'expense', keywords: [] },
    { name: 'Kesehatan', type: 'expense', keywords: [] },
    { name: 'Hiburan', type: 'expense', keywords: [] },
    { name: 'Lainnya', type: 'expense', keywords: [] },
    { name: 'Gaji', type: 'income', keywords: [] },
    { name: 'Bonus', type: 'income', keywords: [] },
    { name: 'Usaha', type: 'income', keywords: [] },
    { name: 'Lainnya', type: 'income', keywords: [] },
  ];

  let data = null;
  let dbPromise = null;
  let lastIso = '';
  let storageOk = true; // false = browser menolak penyimpanan (mode privat/sandbox) → mode memori
  const pendingWrites = new Map(); // receiptId -> Promise tulis blob

  function uid() {
    if (window.crypto && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
    return 'id-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
  }

  /* Monotonik: dua panggilan tidak pernah menghasilkan ISO yang sama,
     supaya updatedAt selalu naik dan urutan transaksi stabil. */
  function sekarang() {
    let iso = new Date().toISOString();
    if (iso <= lastIso) iso = new Date(Date.parse(lastIso) + 1).toISOString();
    lastIso = iso;
    return iso;
  }

  function openDB() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => { req.result.createObjectStore(DB_RECEIPTS); };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error || new Error('IndexedDB gagal dibuka'));
    });
    return dbPromise;
  }

  function simpanBlob(receiptId, blob) {
    return openDB().then((db) => new Promise((resolve, reject) => {
      const tx = db.transaction(DB_RECEIPTS, 'readwrite');
      tx.objectStore(DB_RECEIPTS).put(blob, receiptId);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error || new Error('Gagal menyimpan foto'));
    }));
  }

  function bacaBlob(receiptId) {
    return openDB().then((db) => new Promise((resolve, reject) => {
      const req = db.transaction(DB_RECEIPTS, 'readonly').objectStore(DB_RECEIPTS).get(receiptId);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error || new Error('Gagal membaca foto'));
    }));
  }

  function hapusBlob(receiptId) {
    return openDB().then((db) => new Promise((resolve, reject) => {
      const tx = db.transaction(DB_RECEIPTS, 'readwrite');
      tx.objectStore(DB_RECEIPTS).delete(receiptId);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error || new Error('Gagal menghapus foto'));
    }));
  }

  function muat() {
    try {
      const raw = JSON.parse(localStorage.getItem(KEY) || 'null');
      if (raw && raw.schemaVersion === SCHEMA_VERSION) {
        data = raw;
        return;
      }
    } catch (e) { /* korup = mulai baru, data lama tidak dipakai */ }
    data = {
      schemaVersion: SCHEMA_VERSION,
      categories: DEFAULT_CATEGORIES.map((k) => ({
        id: 'c-' + k.type + '-' + k.name.toLowerCase(),
        name: k.name, type: k.type, keywords: k.keywords.slice(), createdAt: sekarang(),
      })),
      transactions: [],
      merchantRules: [],
      settings: {},
    };
    persist();
  }

  function persist() {
    try {
      localStorage.setItem(KEY, JSON.stringify(data));
      storageOk = true;
    } catch (e) {
      // Mode privat / penyimpanan diblokir: aplikasi tetap jalan (data sesi saja).
      if (storageOk) {
        storageOk = false;
        console.error('Penyimpanan browser tidak tersedia — data hanya hidup selama sesi ini. Backup rutin tetap disarankan.');
      }
    }
  }

  function kategoriBerdasarkanId(id) {
    return data.categories.find((k) => k.id === id) || null;
  }

  function validasi(tx) {
    if (!tx || (tx.type !== 'income' && tx.type !== 'expense')) {
      throw new Error('Jenis transaksi harus "income" atau "expense".');
    }
    if (!Number.isInteger(tx.amount) || tx.amount < 1 || tx.amount > MAX_AMOUNT) {
      throw new Error('Jumlah harus bilangan bulat antara Rp 1 dan Rp 999.999.999.999.');
    }
    if (tx.datetime !== undefined && Number.isNaN(new Date(tx.datetime).getTime())) {
      throw new Error('Tanggal dan jam tidak valid.');
    }
  }

  function bersihUntukSimpan(tx) {
    const { receipt, ...rest } = tx; // blob tidak masuk JSON — hidup di IndexedDB
    return rest;
  }

  function saveTransaction(masuk) {
    validasi(masuk);
    const now = sekarang();
    const id = masuk.id || uid();
    const lama = data.transactions.find((t) => t.id === id) || null;
    const kat = masuk.categoryId ? kategoriBerdasarkanId(masuk.categoryId) : null;

    // receiptId dipakai ulang kalau sudah ada supaya blob lama tertimpa, tidak jadi yatim.
    const receiptId = masuk.receiptId || (lama && lama.receiptId)
      || (masuk.receipt instanceof Blob ? uid() : '');

    const berikutnya = {
      id,
      type: masuk.type,
      amount: masuk.amount,
      categoryId: masuk.categoryId || '',
      categoryName: kat ? kat.name : (masuk.categoryName || ''),
      merchant: masuk.merchant || '',
      note: masuk.note || '',
      datetime: masuk.datetime ? new Date(masuk.datetime).toISOString() : now,
      receiptId,
      source: masuk.source || (lama && lama.source) || 'manual',
      createdAt: (lama && lama.createdAt) || now,
      updatedAt: now,
    };

    if (masuk.receipt instanceof Blob) {
      const tulis = simpanBlob(receiptId, masuk.receipt)
        .catch((err) => console.error('Simpan foto gagal:', err))
        .finally(() => pendingWrites.delete(receiptId));
      pendingWrites.set(receiptId, tulis);
    }

    if (lama) data.transactions.splice(data.transactions.indexOf(lama), 1, berikutnya);
    else data.transactions.push(berikutnya);
    persist();
    return { ...berikutnya };
  }

  function listTransactions() {
    return data.transactions
      .slice()
      .sort((a, b) => (a.datetime < b.datetime ? 1 : a.datetime > b.datetime ? -1 : 0))
      .map((t) => ({ ...t }));
  }

  function deleteTransaction(id) {
    const tx = data.transactions.find((t) => t.id === id);
    if (!tx) return Promise.resolve();
    data.transactions.splice(data.transactions.indexOf(tx), 1);
    persist();
    return tx.receiptId ? hapusBlob(tx.receiptId) : Promise.resolve();
  }

  function listCategories(type) {
    return data.categories.filter((k) => !type || k.type === type).map((k) => ({ ...k, keywords: k.keywords.slice() }));
  }

  function saveCategory(kat) {
    const name = String(kat && kat.name || '').trim();
    const type = kat && kat.type;
    if (!name) throw new Error('Nama kategori tidak boleh kosong.');
    if (type !== 'income' && type !== 'expense') throw new Error('Jenis kategori harus "income" atau "expense".');
    const duplikat = data.categories.some((k) =>
      k.type === type && k.name.toLowerCase() === name.toLowerCase() && k.id !== kat.id);
    if (duplikat) throw new Error('Kategori "' + name + '" sudah ada untuk jenis ini.');

    const lama = kat.id ? data.categories.find((k) => k.id === kat.id) : null;
    if (lama) {
      lama.name = name;
      lama.keywords = Array.isArray(kat.keywords) ? kat.keywords.slice() : lama.keywords;
      persist();
      return { ...lama };
    }
    const baru = { id: uid(), name, type, keywords: Array.isArray(kat.keywords) ? kat.keywords.slice() : [], createdAt: sekarang() };
    data.categories.push(baru);
    persist();
    return { ...baru };
  }

  function deleteCategory(id) {
    const idx = data.categories.findIndex((k) => k.id === id);
    if (idx === -1) return;
    data.categories.splice(idx, 1);
    // Transaksi lama TIDAK disentuh: categoryName snapshot bertahan (PRD F2).
    persist();
  }

  function getSettings() { return { ...data.settings }; }

  function saveSettings(obj) {
    data.settings = { ...data.settings, ...(obj || {}) };
    persist();
    return getSettings();
  }

  function getReceipt(receiptId) {
    if (!receiptId) return Promise.resolve(null);
    const pending = pendingWrites.get(receiptId) || Promise.resolve();
    return pending.then(() => bacaBlob(receiptId));
  }

  function whenReady() { return openDB(); }

  muat();
  if (navigator.storage && typeof navigator.storage.persist === 'function') {
    navigator.storage.persist().catch(() => {});
  }

  return {
    listTransactions, saveTransaction, deleteTransaction,
    listCategories, saveCategory, deleteCategory,
    getSettings, saveSettings, getReceipt, whenReady,
  };
})();
