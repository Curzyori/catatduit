/**
 * CatatDuit - js/transactions.js
 * Task T3: Form Catat Transaksi (F1)
 * Implementasi asli: Tri (PR #1) — integrasi styling & pembersihan fallback: Yuken
 *
 * Mengikuti: PRD.md (F1, 7.1, 13), DESIGN.md, TASK.md
 * Akses data HANYA lewat Store.* dan navigasi/helper lewat App.*
 */

(function () {
  'use strict';

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

  function renderTransactionScreen(container, params) {
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
      <header style="display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--sp-md);">
        <button type="button" class="btn btn-ghost" id="tx-btn-back" style="min-height: 40px; padding: 6px 12px;">
          &larr; Beranda
        </button>
        <h1 style="font-size: 1.5rem; margin: 0;">${escapeHtml(titleText)}</h1>
        <div style="width: 70px;"></div>
      </header>

      <form id="tx-form" class="card" novalidate>
        <!-- 1. Jenis Transaksi: Pengeluaran / Pemasukan -->
        <div class="field">
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
        <div class="field">
          <label for="tx-amount">Jumlah (Rp) <span class="required">*</span></label>
          <input
            type="text"
            id="tx-amount"
            class="input mono"
            inputmode="numeric"
            placeholder="0"
            autocomplete="off"
            value="${editingTx ? escapeHtml(editingTx.amount) : ''}"
            required
          />
          <div id="tx-amount-preview" class="amount-preview mono">
            ${editingTx ? App.formatRupiah(editingTx.amount) : 'Rp 0'}
          </div>
          <div id="tx-amount-error" class="field-error" style="display: none;"></div>
        </div>

        <!-- 3. Kategori -->
        <div class="field">
          <label for="tx-category">Kategori <span class="required">*</span></label>
          <select id="tx-category" class="input" required>
            <option value="" disabled ${!editingTx ? 'selected' : ''}>Pilih Kategori</option>
          </select>
          <div id="tx-category-error" class="field-error" style="display: none;"></div>
        </div>

        <!-- 4. Tanggal & Jam -->
        <div class="field">
          <label for="tx-datetime">Tanggal &amp; Waktu <span class="required">*</span></label>
          <input
            type="datetime-local"
            id="tx-datetime"
            class="input"
            value="${toLocalDatetimeInput(editingTx ? editingTx.datetime : new Date())}"
            required
          />
          <div id="tx-datetime-warning" class="field-error" style="display: none;">
            Perhatian: Tanggal transaksi berada di masa depan.
          </div>
          <div id="tx-datetime-error" class="field-error" style="display: none;"></div>
        </div>

        <!-- 5. Nama Toko (Opsional) -->
        <div class="field">
          <label for="tx-merchant">Nama Toko / Pihak (Opsional)</label>
          <input
            type="text"
            id="tx-merchant"
            class="input"
            placeholder="Misal: Indomaret, Warung Kopi, Tokopedia"
            value="${editingTx && editingTx.merchant ? escapeHtml(editingTx.merchant) : ''}"
          />
        </div>

        <!-- 6. Catatan (Opsional) -->
        <div class="field">
          <label for="tx-note">Catatan (Opsional)</label>
          <textarea
            id="tx-note"
            class="input"
            rows="2"
            placeholder="Catatan tambahan (misal: patungan, traktiran)"
          >${editingTx && editingTx.note ? escapeHtml(editingTx.note) : ''}</textarea>
        </div>

        <!-- Tombol Aksi -->
        <div style="display: flex; flex-direction: column; gap: var(--sp-sm); margin-top: var(--sp-lg);">
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
      amountInput.classList.remove('input-error');

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
      datetimeInput.classList.remove('input-error');

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
        amountInput.classList.add('input-error');
        amountInput.focus();
        hasError = true;
      }

      // 2. Validasi Kategori
      const selectedCatOption = categorySelect.options[categorySelect.selectedIndex];
      if (!categorySelect.value || !selectedCatOption || selectedCatOption.disabled) {
        categoryError.textContent = 'Silakan pilih kategori transaksi.';
        categoryError.style.display = 'block';
        categorySelect.classList.add('input-error');
        if (!hasError) {
          categorySelect.focus();
          hasError = true;
        }
      } else {
        categoryError.style.display = 'none';
        categorySelect.classList.remove('input-error');
      }

      // 3. Validasi Tanggal
      const dtCheck = checkDatetimeWarning();
      if (!dtCheck.valid) {
        datetimeError.textContent = dtCheck.error;
        datetimeError.style.display = 'block';
        datetimeInput.classList.add('input-error');
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
        source: isEdit ? (editingTx.source || 'manual') : 'manual'
      };

      // Simpan lewat Store
      if (typeof Store !== 'undefined' && Store.saveTransaction) {
        Store.saveTransaction(transactionData);
      }

      // Kembali ke Beranda setelah simpan tanpa reload halaman
      goBack();
    });
  }

  // Dialog Konfirmasi Hapus (frame 2px, radius 0, hard shadow)
  function showDeleteConfirmation(tx, onConfirm) {
    const existing = document.getElementById('cd-delete-dialog');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'cd-delete-dialog';
    overlay.className = 'dialog-backdrop';

    const txDesc = `${tx.categoryName || 'Transaksi'} sebesar ${App.formatRupiah(tx.amount)}`;

    overlay.innerHTML = `
      <div class="dialog" role="dialog" aria-modal="true" aria-labelledby="dialog-title">
        <h2 id="dialog-title" style="font-size: 1.25rem; margin-bottom: var(--sp-sm);">Hapus Transaksi?</h2>
        <p style="font-size: 0.9375rem; color: var(--ink-muted); margin: 0 0 var(--sp-lg);">
          Kamu yakin ingin menghapus <strong>${escapeHtml(txDesc)}</strong>? Data yang dihapus tidak dapat dikembalikan.
        </p>
        <div style="display: flex; gap: var(--sp-sm); justify-content: flex-end;">
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

  // Registrasi layar ke App
  App.registerScreen('transaksi', {
    title: 'Catat Transaksi',
    render: renderTransactionScreen
  });

})();
