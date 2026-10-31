/**
 * CatatDuit - js/transactions.js
 * Task T3: Form Catat Transaksi (F1)
 * Pemilik: Tri
 *
 * Mengikuti: PRD.md (F1, 7.1, 13), DESIGN.md, TASK.md
 * Akses data HANYA lewat Store.* dan navigasi/helper lewat App.*
 */

(function () {
  'use strict';

  // ---------------------------------------------------------------------------
  // 1. Fallback Dummy Store & App (Bila T1/T2 belum di-merge di main)
  // ---------------------------------------------------------------------------
  if (typeof window.App === 'undefined') {
    window.App = {
      _screens: {},
      currentScreen: null,
      registerScreen(id, screen) {
        this._screens[id] = screen;
      },
      openScreen(id, params) {
        this.currentScreen = id;
        const root = document.getElementById('app-root') || document.getElementById('app') || document.body;
        const screen = this._screens[id];
        if (screen && typeof screen.render === 'function') {
          screen.render(root, params);
        } else {
          console.warn(`Layar [${id}] belum terdaftar.`);
        }
      },
      formatRupiah(n) {
        if (typeof n !== 'number' || isNaN(n)) return 'Rp 0';
        return new Intl.NumberFormat('id-ID', {
          style: 'currency',
          currency: 'IDR',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        }).format(n).replace(/\s+/g, ' ');
      }
    };
  }

  if (typeof window.Store === 'undefined') {
    const DUMMY_CATEGORIES = [
      { id: 'cat-exp-1', name: 'Makan', type: 'expense', keywords: ['makan', 'warung', 'nasi'], createdAt: new Date().toISOString() },
      { id: 'cat-exp-2', name: 'Transport', type: 'expense', keywords: ['bensin', 'ojek', 'tol'], createdAt: new Date().toISOString() },
      { id: 'cat-exp-3', name: 'Belanja', type: 'expense', keywords: ['supermarket', 'mart'], createdAt: new Date().toISOString() },
      { id: 'cat-exp-4', name: 'Tagihan', type: 'expense', keywords: ['listrik', 'air', 'wifi'], createdAt: new Date().toISOString() },
      { id: 'cat-exp-5', name: 'Kesehatan', type: 'expense', keywords: ['obat', 'dokter'], createdAt: new Date().toISOString() },
      { id: 'cat-exp-6', name: 'Hiburan', type: 'expense', keywords: ['bioskop', 'game'], createdAt: new Date().toISOString() },
      { id: 'cat-exp-7', name: 'Lainnya', type: 'expense', keywords: [], createdAt: new Date().toISOString() },
      { id: 'cat-inc-1', name: 'Gaji', type: 'income', keywords: ['gaji', 'payroll'], createdAt: new Date().toISOString() },
      { id: 'cat-inc-2', name: 'Bonus', type: 'income', keywords: ['bonus', 'thr'], createdAt: new Date().toISOString() },
      { id: 'cat-inc-3', name: 'Usaha', type: 'income', keywords: ['omzet', 'jual'], createdAt: new Date().toISOString() },
      { id: 'cat-inc-4', name: 'Lainnya', type: 'income', keywords: [], createdAt: new Date().toISOString() }
    ];

    let _transactions = [];
    let _categories = [...DUMMY_CATEGORIES];
    let _settings = { lastBackupAt: null, reminderDays: 7 };

    window.Store = {
      listTransactions() {
        return [..._transactions].sort((a, b) => new Date(b.datetime) - new Date(a.datetime));
      },
      saveTransaction(tx) {
        if (!tx.id) {
          tx.id = (typeof crypto !== 'undefined' && crypto.randomUUID)
            ? crypto.randomUUID()
            : 'tx_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        }
        if (!tx.createdAt) tx.createdAt = new Date().toISOString();
        tx.updatedAt = new Date().toISOString();

        const idx = _transactions.findIndex(t => t.id === tx.id);
        if (idx >= 0) {
          _transactions[idx] = { ...tx };
        } else {
          _transactions.unshift({ ...tx });
        }
        return tx;
      },
      deleteTransaction(id) {
        _transactions = _transactions.filter(t => t.id !== id);
        return true;
      },
      listCategories(type) {
        if (!type) return [..._categories];
        return _categories.filter(c => c.type === type);
      },
      saveCategory(kat) {
        if (!kat.id) {
          kat.id = 'cat_' + Date.now();
        }
        _categories.push(kat);
        return kat;
      },
      deleteCategory(id) {
        _categories = _categories.filter(c => c.id !== id);
        return true;
      },
      getSettings() {
        return { ..._settings };
      },
      saveSettings(obj) {
        _settings = { ..._settings, ...obj };
        return _settings;
      }
    };
  }

  // ---------------------------------------------------------------------------
  // 2. Helper Functions
  // ---------------------------------------------------------------------------
  function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function toLocalDatetimeInput(date) {
    const d = date instanceof Date ? date : new Date(date);
    if (isNaN(d.getTime())) return '';
    const pad = n => String(n).padStart(2, '0');
    const yyyy = d.getFullYear();
    const mm = pad(d.getMonth() + 1);
    const dd = pad(d.getDate());
    const hh = pad(d.getHours());
    const min = pad(d.getMinutes());
    return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
  }

  function parsePositiveInteger(raw) {
    if (typeof raw !== 'string' && typeof raw !== 'number') return null;
    const cleaned = String(raw).trim();
    if (!/^\d+$/.test(cleaned)) return null;
    const num = parseInt(cleaned, 10);
    if (isNaN(num)) return null;
    return num;
  }

  // Inject fallback styles matching DESIGN.md if css/style.css is not yet present
  function ensureStyles() {
    if (document.getElementById('catatduit-theme-style') || document.querySelector('link[href*="style.css"]')) {
      return;
    }
    const style = document.createElement('style');
    style.id = 'catatduit-theme-style';
    style.textContent = `
      :root {
        --color-primary: #072033;
        --color-secondary: #3B5A70;
        --color-background: #F7FAFC;
        --color-surface: #FFFFFF;
        --color-surface-alt: #F0F7FB;
        --color-stroke: #D9E5ED;
        --color-text: #072033;
        --color-text-muted: #3B5A70;
        --color-accent: #0369A1;
        --color-accent-hover: #075985;
        --color-on-accent: #FFFFFF;
        --color-accent-muted: rgba(3, 105, 161, 0.12);
        --color-success: #0F766E;
        --color-warning: #9A3412;
        --color-danger: #BE123C;
        --color-line-strong: #163A55;
        --color-line-soft: #CFE2EE;
        --color-paper: #FFFDF7;
        --color-paper-shade: #F3EBDD;
      }
      * { box-sizing: border-box; margin: 0; padding: 0; border-radius: 0 !important; }
      body {
        background-color: var(--color-background);
        color: var(--color-text);
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        line-height: 1.5;
        -webkit-font-smoothing: antialiased;
      }
      .font-mono { font-family: 'JetBrains Mono', monospace; font-variant-numeric: tabular-nums; }
      .cd-screen { max-width: 480px; margin: 0 auto; padding: 16px; min-height: 100vh; background-color: var(--color-background); }
      .cd-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
      .cd-title { font-family: 'Space Grotesk', sans-serif; font-size: 1.5rem; font-weight: 700; color: var(--color-primary); letter-spacing: -0.02em; }
      .cd-card {
        background: var(--color-surface);
        border: 2px solid var(--color-line-strong);
        box-shadow: 6px 6px 0 0 var(--color-line-soft);
        padding: 20px 16px;
        margin-bottom: 20px;
      }
      .form-group { margin-bottom: 16px; }
      .form-label { display: block; font-size: 0.875rem; font-weight: 600; color: var(--color-text); margin-bottom: 6px; }
      .form-label .required { color: var(--color-danger); }
      .form-input, .form-select, .form-textarea {
        width: 100%;
        min-height: 48px;
        padding: 10px 14px;
        background: #FFFFFF;
        border: 2px solid var(--color-stroke);
        color: var(--color-text);
        font-family: inherit;
        font-size: 1rem;
        outline: none;
        transition: border-color 0.15s, outline 0.15s;
      }
      .form-input:focus, .form-select:focus, .form-textarea:focus {
        border-color: var(--color-line-strong);
        outline: 2px solid var(--color-accent);
        outline-offset: 2px;
      }
      .form-input.is-invalid, .form-select.is-invalid {
        border-color: var(--color-danger);
      }
      .form-error {
        margin-top: 6px;
        font-size: 0.8125rem;
        color: var(--color-danger);
        font-weight: 500;
      }
      .form-warning {
        margin-top: 6px;
        padding: 8px 10px;
        background: #FEF3C7;
        border: 1px solid var(--color-warning);
        font-size: 0.8125rem;
        color: var(--color-warning);
        font-weight: 500;
      }
      .amount-preview {
        margin-top: 6px;
        font-family: 'JetBrains Mono', monospace;
        font-size: 1.125rem;
        font-weight: 700;
        color: var(--color-accent);
      }
      .segmented-control {
        display: grid;
        grid-template-columns: 1fr 1fr;
        border: 2px solid var(--color-line-strong);
        background: var(--color-surface-alt);
        margin-bottom: 18px;
      }
      .segmented-btn {
        min-height: 44px;
        background: transparent;
        border: none;
        font-family: inherit;
        font-size: 0.9375rem;
        font-weight: 600;
        cursor: pointer;
        color: var(--color-text-muted);
        transition: background 0.15s, color 0.15s;
        text-align: center;
      }
      .segmented-btn.active.type-expense {
        background: var(--color-danger);
        color: #FFFFFF;
      }
      .segmented-btn.active.type-income {
        background: var(--color-success);
        color: #FFFFFF;
      }
      .btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 48px;
        padding: 10px 18px;
        font-family: inherit;
        font-size: 1rem;
        font-weight: 600;
        cursor: pointer;
        text-decoration: none;
        border: 2px solid var(--color-line-strong);
        box-shadow: 6px 6px 0 0 var(--color-line-soft);
        transition: transform 0.1s, box-shadow 0.1s;
      }
      .btn:active {
        transform: translate(2px, 2px);
        box-shadow: 4px 4px 0 0 var(--color-line-soft);
      }
      .btn-block { width: 100%; }
      .btn-primary { background: var(--color-primary); color: #FFFFFF; }
      .btn-accent { background: var(--color-accent); color: var(--color-on-accent); }
      .btn-ghost { background: transparent; color: var(--color-text); border-color: var(--color-stroke); box-shadow: none; }
      .btn-danger { background: var(--color-danger); color: #FFFFFF; }
      .btn-group { display: flex; flex-direction: column; gap: 12px; margin-top: 24px; }
      .dialog-overlay {
        position: fixed;
        top: 0; left: 0; right: 0; bottom: 0;
        background: rgba(7, 32, 51, 0.45);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
        padding: 20px;
      }
      .dialog-box {
        background: var(--color-surface);
        border: 2px solid var(--color-line-strong);
        box-shadow: 6px 6px 0 0 var(--color-line-soft);
        width: 100%;
        max-width: 360px;
        padding: 20px;
      }
      .dialog-title { font-family: 'Space Grotesk', sans-serif; font-size: 1.25rem; font-weight: 700; margin-bottom: 8px; color: var(--color-primary); }
      .dialog-desc { font-size: 0.9375rem; color: var(--color-text-muted); margin-bottom: 20px; }
      .dialog-actions { display: flex; gap: 10px; justify-content: flex-end; }
    `;
    document.head.appendChild(style);
  }

  // ---------------------------------------------------------------------------
  // 3. Render Layar "Catat Transaksi"
  // ---------------------------------------------------------------------------
  function renderTransactionScreen(container, params) {
    ensureStyles();

    // Tentukan apakah mode Edit atau Baru
    let editingTx = null;
    if (params) {
      if (params.id && typeof Store !== 'undefined' && Store.listTransactions) {
        const allTx = Store.listTransactions();
        editingTx = allTx.find(t => t.id === params.id) || params.transaction || params;
      } else if (params.amount !== undefined) {
        editingTx = params;
      }
    }

    const isEdit = Boolean(editingTx && editingTx.id);
    let currentType = editingTx ? editingTx.type : 'expense'; // default 'expense' (pengeluaran)

    const titleText = isEdit ? 'Edit Transaksi' : 'Catat Transaksi';
    const submitBtnText = isEdit ? 'Simpan Perubahan' : 'Simpan Transaksi';

    container.innerHTML = `
      <div class="cd-screen cd-screen-transaction" id="screen-transaction">
        <header class="cd-header">
          <button type="button" class="btn btn-ghost" id="tx-btn-back" style="min-height: 40px; padding: 6px 12px;">
            &larr; Beranda
          </button>
          <h1 class="cd-title">${escapeHtml(titleText)}</h1>
          <div style="width: 70px;"></div>
        </header>

        <form id="tx-form" class="cd-card" novalidate>
          <!-- 1. Jenis Transaksi: Pengeluaran / Pemasukan -->
          <div class="form-group">
            <label class="form-label">Jenis Transaksi <span class="required">*</span></label>
            <div class="segmented-control" role="radiogroup" aria-label="Jenis Transaksi">
              <button type="button" class="segmented-btn ${currentType === 'expense' ? 'active type-expense' : ''}" id="tx-btn-type-expense" role="radio" aria-checked="${currentType === 'expense'}">
                Pengeluaran
              </button>
              <button type="button" class="segmented-btn ${currentType === 'income' ? 'active type-income' : ''}" id="tx-btn-type-income" role="radio" aria-checked="${currentType === 'income'}">
                Pemasukan
              </button>
            </div>
          </div>

          <!-- 2. Jumlah Uang -->
          <div class="form-group">
            <label for="tx-amount" class="form-label">Jumlah (Rp) <span class="required">*</span></label>
            <input
              type="text"
              id="tx-amount"
              class="form-input font-mono"
              inputmode="numeric"
              placeholder="0"
              autocomplete="off"
              value="${editingTx ? escapeHtml(editingTx.amount) : ''}"
              required
            />
            <div id="tx-amount-preview" class="amount-preview font-mono">
              ${editingTx ? App.formatRupiah(editingTx.amount) : 'Rp 0'}
            </div>
            <div id="tx-amount-error" class="form-error" style="display: none;"></div>
          </div>

          <!-- 3. Kategori -->
          <div class="form-group">
            <label for="tx-category" class="form-label">Kategori <span class="required">*</span></label>
            <select id="tx-category" class="form-select" required>
              <option value="" disabled ${!editingTx ? 'selected' : ''}>Pilih Kategori</option>
            </select>
            <div id="tx-category-error" class="form-error" style="display: none;"></div>
          </div>

          <!-- 4. Tanggal & Jam -->
          <div class="form-group">
            <label for="tx-datetime" class="form-label">Tanggal &amp; Waktu <span class="required">*</span></label>
            <input
              type="datetime-local"
              id="tx-datetime"
              class="form-input"
              value="${toLocalDatetimeInput(editingTx ? editingTx.datetime : new Date())}"
              required
            />
            <div id="tx-datetime-warning" class="form-warning" style="display: none;">
              Perhatian: Tanggal transaksi berada di masa depan.
            </div>
            <div id="tx-datetime-error" class="form-error" style="display: none;"></div>
          </div>

          <!-- 5. Nama Toko (Opsional) -->
          <div class="form-group">
            <label for="tx-merchant" class="form-label">Nama Toko / Pihak (Opsional)</label>
            <input
              type="text"
              id="tx-merchant"
              class="form-input"
              placeholder="Misal: Indomaret, Warung Kopi, Tokopedia"
              value="${editingTx && editingTx.merchant ? escapeHtml(editingTx.merchant) : ''}"
            />
          </div>

          <!-- 6. Catatan (Opsional) -->
          <div class="form-group">
            <label for="tx-note" class="form-label">Catatan (Opsional)</label>
            <textarea
              id="tx-note"
              class="form-textarea"
              rows="2"
              placeholder="Catatan tambahan (misal: patungan, traktiran)"
            >${editingTx && editingTx.note ? escapeHtml(editingTx.note) : ''}</textarea>
          </div>

          <!-- Tombol Aksi -->
          <div class="btn-group">
            <button type="submit" class="btn btn-accent btn-block" id="tx-btn-submit">
              ${escapeHtml(submitBtnText)}
            </button>
            ${isEdit ? `
              <button type="button" class="btn btn-danger btn-block" id="tx-btn-delete">
                Hapus Transaksi
              </button>
            ` : ''}
            <button type="button" class="btn btn-ghost btn-block" id="tx-btn-cancel">
              Batal
            </button>
          </div>
        </form>
      </div>
    `;

    // Ambil referensi elemen
    const form = container.querySelector('#tx-form');
    const btnExpense = container.querySelector('#tx-btn-type-expense');
    const btnIncome = container.querySelector('#tx-btn-type-income');
    const amountInput = container.querySelector('#tx-amount');
    const amountPreview = container.querySelector('#tx-amount-preview');
    const amountError = container.querySelector('#tx-amount-error');
    const categorySelect = container.querySelector('#tx-category');
    const categoryError = container.querySelector('#tx-category-error');
    const datetimeInput = container.querySelector('#tx-datetime');
    const datetimeWarning = container.querySelector('#tx-datetime-warning');
    const datetimeError = container.querySelector('#tx-datetime-error');
    const merchantInput = container.querySelector('#tx-merchant');
    const noteInput = container.querySelector('#tx-note');
    const btnBack = container.querySelector('#tx-btn-back');
    const btnCancel = container.querySelector('#tx-btn-cancel');
    const btnDelete = container.querySelector('#tx-btn-delete');

    // Muat daftar kategori sesuai jenis
    function loadCategories(selectedCatId) {
      categorySelect.innerHTML = '<option value="" disabled selected>Pilih Kategori</option>';
      const list = (typeof Store !== 'undefined' && Store.listCategories)
        ? Store.listCategories(currentType)
        : [];

      list.forEach(cat => {
        const opt = document.createElement('option');
        opt.value = cat.id;
        opt.textContent = cat.name;
        opt.dataset.name = cat.name;
        if (selectedCatId && (cat.id === selectedCatId || cat.name === selectedCatId)) {
          opt.selected = true;
        }
        categorySelect.appendChild(opt);
      });

      // Jika editing dan kategori lama sudah dihapus dari daftar master
      if (editingTx && editingTx.categoryName && !categorySelect.value && currentType === editingTx.type) {
        const oldOpt = document.createElement('option');
        oldOpt.value = editingTx.categoryId || 'old-cat';
        oldOpt.textContent = `${editingTx.categoryName} (kategori lama)`;
        oldOpt.dataset.name = editingTx.categoryName;
        oldOpt.selected = true;
        categorySelect.appendChild(oldOpt);
      }
    }

    // Inisialisasi dropdown kategori
    loadCategories(editingTx ? editingTx.categoryId : null);

    // Event: Ubah jenis transaksi
    btnExpense.addEventListener('click', () => {
      if (currentType === 'expense') return;
      currentType = 'expense';
      btnExpense.classList.add('active', 'type-expense');
      btnExpense.setAttribute('aria-checked', 'true');
      btnIncome.classList.remove('active', 'type-income');
      btnIncome.setAttribute('aria-checked', 'false');
      loadCategories(null);
    });

    btnIncome.addEventListener('click', () => {
      if (currentType === 'income') return;
      currentType = 'income';
      btnIncome.classList.add('active', 'type-income');
      btnIncome.setAttribute('aria-checked', 'true');
      btnExpense.classList.remove('active', 'type-expense');
      btnExpense.setAttribute('aria-checked', 'false');
      loadCategories(null);
    });

    // Validasi & format live input jumlah
    function validateAmount() {
      const raw = amountInput.value.trim();
      amountError.style.display = 'none';
      amountError.textContent = '';
      amountInput.classList.remove('is-invalid');

      if (!raw) {
        amountPreview.textContent = 'Rp 0';
        return { valid: false, error: 'Jumlah harus diisi.' };
      }

      // Deteksi karakter non-angka (seperti "abc", simbol, tanda minus, koma/titik)
      // Bersihkan pemisah ribuan jika pengguna mengetik format Rupiah
      const digitsOnly = raw.replace(/\./g, '').replace(/,/g, '');
      if (!/^\d+$/.test(digitsOnly)) {
        amountPreview.textContent = '-';
        return { valid: false, error: 'Jumlah harus berupa angka bulat positif tanpa huruf/simbol.' };
      }

      const num = parseInt(digitsOnly, 10);
      if (isNaN(num) || num <= 0) {
        amountPreview.textContent = 'Rp 0';
        return { valid: false, error: 'Jumlah harus lebih besar dari 0.' };
      }

      // Sesuai PRD Bagian 13: batas maksimal 999.999.999.999
      if (num > 999999999999) {
        amountPreview.textContent = App.formatRupiah(num);
        return { valid: false, error: 'Jumlah maksimal adalah Rp 999.999.999.999.' };
      }

      amountPreview.textContent = App.formatRupiah(num);
      return { valid: true, value: num };
    }

    amountInput.addEventListener('input', () => {
      validateAmount();
    });

    // Validasi tanggal masa depan
    function checkDatetimeWarning() {
      const val = datetimeInput.value;
      datetimeError.style.display = 'none';
      datetimeError.textContent = '';
      datetimeInput.classList.remove('is-invalid');

      if (!val) {
        datetimeWarning.style.display = 'none';
        return { valid: false, error: 'Tanggal dan waktu harus diisi.' };
      }

      const dt = new Date(val);
      if (isNaN(dt.getTime())) {
        datetimeWarning.style.display = 'none';
        return { valid: false, error: 'Format tanggal tidak valid.' };
      }

      // PRD 13: Tanggal di masa depan diperbolehkan tetapi diberi peringatan
      if (dt.getTime() > Date.now()) {
        datetimeWarning.style.display = 'block';
      } else {
        datetimeWarning.style.display = 'none';
      }
      return { valid: true, value: dt.toISOString() };
    }

    datetimeInput.addEventListener('change', checkDatetimeWarning);
    datetimeInput.addEventListener('input', checkDatetimeWarning);
    checkDatetimeWarning(); // Cek awal

    // Navigasi Kembali / Batal ke Beranda
    function goBack() {
      if (typeof App !== 'undefined' && App.openScreen) {
        App.openScreen('beranda');
      }
    }
    btnBack.addEventListener('click', goBack);
    btnCancel.addEventListener('click', goBack);

    // Konfirmasi Hapus Transaksi
    if (btnDelete && isEdit) {
      btnDelete.addEventListener('click', () => {
        showDeleteConfirmation(editingTx, () => {
          if (typeof Store !== 'undefined' && Store.deleteTransaction) {
            Store.deleteTransaction(editingTx.id);
          }
          goBack();
        });
      });
    }

    // Submit Form
    form.addEventListener('submit', (e) => {
      e.preventDefault();

      let hasError = false;

      // 1. Validasi Jumlah
      const amountCheck = validateAmount();
      if (!amountCheck.valid) {
        amountError.textContent = amountCheck.error;
        amountError.style.display = 'block';
        amountInput.classList.add('is-invalid');
        amountInput.focus();
        hasError = true;
      }

      // 2. Validasi Kategori
      const selectedCatOption = categorySelect.options[categorySelect.selectedIndex];
      if (!categorySelect.value || !selectedCatOption || selectedCatOption.disabled) {
        categoryError.textContent = 'Silakan pilih kategori transaksi.';
        categoryError.style.display = 'block';
        categorySelect.classList.add('is-invalid');
        if (!hasError) {
          categorySelect.focus();
          hasError = true;
        }
      } else {
        categoryError.style.display = 'none';
        categorySelect.classList.remove('is-invalid');
      }

      // 3. Validasi Tanggal
      const dtCheck = checkDatetimeWarning();
      if (!dtCheck.valid) {
        datetimeError.textContent = dtCheck.error;
        datetimeError.style.display = 'block';
        datetimeInput.classList.add('is-invalid');
        if (!hasError) {
          datetimeInput.focus();
          hasError = true;
        }
      }

      if (hasError) return;

      // Susun objek transaksi sesuai kontrak TASK.md & PRD.md
      const transactionData = {
        ...(isEdit ? { id: editingTx.id, createdAt: editingTx.createdAt || new Date().toISOString() } : {}),
        type: currentType,
        amount: amountCheck.value,
        categoryId: categorySelect.value,
        categoryName: selectedCatOption.dataset.name || selectedCatOption.textContent,
        merchant: merchantInput.value.trim(),
        note: noteInput.value.trim(),
        datetime: dtCheck.value,
        source: isEdit ? (editingTx.source || 'manual') : 'manual',
        updatedAt: new Date().toISOString()
      };

      // Simpan lewat Store
      if (typeof Store !== 'undefined' && Store.saveTransaction) {
        Store.saveTransaction(transactionData);
      }

      // Kembali ke Beranda setelah simpan tanpa reload halaman
      goBack();
    });
  }

  // ---------------------------------------------------------------------------
  // 4. Dialog Konfirmasi Hapus (Pixel-art frame 2px, radius 0, hard shadow)
  // ---------------------------------------------------------------------------
  function showDeleteConfirmation(tx, onConfirm) {
    const existing = document.getElementById('cd-delete-dialog');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'cd-delete-dialog';
    overlay.className = 'dialog-overlay';

    const txDesc = `${tx.categoryName || 'Transaksi'} sebesar ${App.formatRupiah(tx.amount)}`;

    overlay.innerHTML = `
      <div class="dialog-box" role="dialog" aria-modal="true" aria-labelledby="dialog-title">
        <h2 id="dialog-title" class="dialog-title">Hapus Transaksi?</h2>
        <p class="dialog-desc">
          Kamu yakin ingin menghapus <strong>${escapeHtml(txDesc)}</strong>? Data yang dihapus tidak dapat dikembalikan.
        </p>
        <div class="dialog-actions">
          <button type="button" class="btn btn-ghost" id="dlg-btn-cancel">Batal</button>
          <button type="button" class="btn btn-danger" id="dlg-btn-confirm">Ya, Hapus</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    const btnCancel = overlay.querySelector('#dlg-btn-cancel');
    const btnConfirm = overlay.querySelector('#dlg-btn-confirm');

    function close() {
      overlay.remove();
    }

    btnCancel.addEventListener('click', close);
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) close();
    });

    btnConfirm.addEventListener('click', () => {
      close();
      if (typeof onConfirm === 'function') onConfirm();
    });
  }

  // ---------------------------------------------------------------------------
  // 5. Registrasi Layar ke App
  // ---------------------------------------------------------------------------
  App.registerScreen('transaksi', {
    title: 'Catat Transaksi',
    render: renderTransactionScreen
  });

})();
