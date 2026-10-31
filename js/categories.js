/**
 * CatatDuit - js/categories.js
 * Task T5: Kategori (F2)
 * Pemilik: Tri (mengambil alih dari Predi)
 *
 * Mengikuti: PRD.md (F2, 13), DESIGN.md, TASK.md
 * Akses data HANYA lewat Store.* dan navigasi/helper lewat App.*
 */

(function () {
  'use strict';

  let currentType = 'expense'; // 'expense' | 'income'

  function renderCategoryScreen(container, params) {
    if (params && (params.type === 'income' || params.type === 'expense')) {
      currentType = params.type;
    }

    container.innerHTML = `
      <header style="display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--sp-md);">
        <button type="button" class="btn btn-ghost" id="kat-btn-back" style="min-height: 40px; padding: 6px 12px;">
          &larr; Beranda
        </button>
        <h1 style="font-size: 1.5rem; margin: 0;">Kelola Kategori</h1>
        <div style="width: 70px;"></div>
      </header>

      <!-- Segmented Tab: Pengeluaran / Pemasukan -->
      <div class="field">
        <div class="segmented-control" role="tablist" aria-label="Jenis Kategori">
          <button type="button" class="segmented-btn ${currentType === 'expense' ? 'active type-expense' : ''}" id="kat-tab-expense" role="tab" aria-selected="${currentType === 'expense'}">
            Pengeluaran
          </button>
          <button type="button" class="segmented-btn ${currentType === 'income' ? 'active type-income' : ''}" id="kat-tab-income" role="tab" aria-selected="${currentType === 'income'}">
            Pemasukan
          </button>
        </div>
      </div>

      <!-- Form Tambah Kategori -->
      <section class="card">
        <h2 style="font-size: 1.125rem; margin-bottom: var(--sp-sm);" id="kat-form-title">
          Tambah Kategori ${currentType === 'expense' ? 'Pengeluaran' : 'Pemasukan'}
        </h2>
        <form id="kat-form-add" novalidate>
          <div class="field">
            <label for="kat-input-name">Nama Kategori <span class="required" style="color: var(--danger);">*</span></label>
            <input
              type="text"
              id="kat-input-name"
              class="input"
              placeholder="Misal: ${currentType === 'expense' ? 'Kopi, Belanja, Langganan' : 'Gaji Tambahan, Dividen'}"
              autocomplete="off"
              required
            />
            <div id="kat-add-error" class="field-error" style="display: none;"></div>
          </div>
          <button type="submit" class="btn btn-accent btn-block" id="kat-btn-submit-add">
            Tambah Kategori
          </button>
        </form>
      </section>

      <!-- Daftar Kategori -->
      <section>
        <h2 style="font-size: 1.125rem; margin-bottom: var(--sp-sm);">
          Daftar Kategori (${currentType === 'expense' ? 'Pengeluaran' : 'Pemasukan'})
        </h2>
        <div id="kat-list-container"></div>
      </section>
    `;

    const tabExpense = container.querySelector('#kat-tab-expense');
    const tabIncome = container.querySelector('#kat-tab-income');
    const formAdd = container.querySelector('#kat-form-add');
    const inputName = container.querySelector('#kat-input-name');
    const addError = container.querySelector('#kat-add-error');
    const formTitle = container.querySelector('#kat-form-title');
    const listContainer = container.querySelector('#kat-list-container');
    const btnBack = container.querySelector('#kat-btn-back');

    btnBack.addEventListener('click', () => {
      if (typeof App !== 'undefined' && App.openScreen) {
        App.openScreen('beranda');
      }
    });

    function setType(type) {
      if (currentType === type) return;
      currentType = type;
      if (currentType === 'expense') {
        tabExpense.classList.add('active', 'type-expense');
        tabExpense.setAttribute('aria-selected', 'true');
        tabIncome.classList.remove('active', 'type-income');
        tabIncome.setAttribute('aria-selected', 'false');
        formTitle.textContent = 'Tambah Kategori Pengeluaran';
        inputName.placeholder = 'Misal: Kopi, Belanja, Langganan';
      } else {
        tabIncome.classList.add('active', 'type-income');
        tabIncome.setAttribute('aria-selected', 'true');
        tabExpense.classList.remove('active', 'type-expense');
        tabExpense.setAttribute('aria-selected', 'false');
        formTitle.textContent = 'Tambah Kategori Pemasukan';
        inputName.placeholder = 'Misal: Gaji Tambahan, Dividen';
      }
      addError.style.display = 'none';
      inputName.value = '';
      inputName.classList.remove('input-error');
      renderList();
    }

    tabExpense.addEventListener('click', () => setType('expense'));
    tabIncome.addEventListener('click', () => setType('income'));

    function renderList() {
      const categories = (typeof Store !== 'undefined' && Store.listCategories)
        ? Store.listCategories(currentType)
        : [];

      if (categories.length === 0) {
        listContainer.innerHTML = `
          <div class="empty">
            Belum ada kategori untuk ${currentType === 'expense' ? 'pengeluaran' : 'pemasukan'}.
          </div>
        `;
        return;
      }

      listContainer.innerHTML = `
        <div class="list" id="kat-items-list">
          ${categories.map(cat => `
            <div class="list-row" data-id="${App.esc(cat.id)}">
              <div class="grow">
                <div class="title">${App.esc(cat.name)}</div>
                ${cat.keywords && cat.keywords.length > 0 ? `
                  <div class="sub">Kata kunci: ${App.esc(cat.keywords.join(', '))}</div>
                ` : ''}
              </div>
              <div style="display: flex; gap: var(--sp-xs); align-items: center;">
                <button
                  type="button"
                  class="btn btn-ghost btn-edit-kat"
                  data-id="${App.esc(cat.id)}"
                  title="Ganti Nama"
                  style="min-height: 40px; padding: 4px 10px;"
                >
                  <span class="msr" aria-hidden="true">edit</span>
                </button>
                <button
                  type="button"
                  class="btn btn-ghost btn-del-kat"
                  data-id="${App.esc(cat.id)}"
                  title="Hapus"
                  style="min-height: 40px; padding: 4px 10px; color: var(--danger); border-color: var(--danger);"
                >
                  <span class="msr" aria-hidden="true">delete</span>
                </button>
              </div>
            </div>
          `).join('')}
        </div>
      `;

      // Event listener edit
      listContainer.querySelectorAll('.btn-edit-kat').forEach(btn => {
        btn.addEventListener('click', () => {
          const catId = btn.dataset.id;
          const targetCat = categories.find(c => c.id === catId);
          if (targetCat) {
            showEditDialog(targetCat);
          }
        });
      });

      // Event listener delete
      listContainer.querySelectorAll('.btn-del-kat').forEach(btn => {
        btn.addEventListener('click', () => {
          const catId = btn.dataset.id;
          const targetCat = categories.find(c => c.id === catId);
          if (targetCat) {
            showDeleteDialog(targetCat);
          }
        });
      });
    }

    // Submit Tambah Kategori
    formAdd.addEventListener('submit', (e) => {
      e.preventDefault();
      addError.style.display = 'none';
      inputName.classList.remove('input-error');

      const nameVal = inputName.value.trim();
      if (!nameVal) {
        addError.textContent = 'Nama kategori tidak boleh kosong.';
        addError.style.display = 'block';
        inputName.classList.add('input-error');
        inputName.focus();
        return;
      }

      try {
        Store.saveCategory({
          name: nameVal,
          type: currentType
        });
        inputName.value = '';
        renderList();
        App.toast(`Kategori "${nameVal}" berhasil ditambahkan.`);
      } catch (err) {
        addError.textContent = err.message || 'Gagal menyimpan kategori.';
        addError.style.display = 'block';
        inputName.classList.add('input-error');
        inputName.focus();
      }
    });

    // Dialog Ganti Nama (Edit Kategori)
    function showEditDialog(cat) {
      const existing = document.getElementById('kat-edit-dialog');
      if (existing) existing.remove();

      const overlay = document.createElement('div');
      overlay.id = 'kat-edit-dialog';
      overlay.className = 'dialog-backdrop';
      overlay.innerHTML = `
        <div class="dialog" role="dialog" aria-modal="true" aria-labelledby="kat-edit-title">
          <h2 id="kat-edit-title" style="font-size: 1.25rem; margin: 0 0 var(--sp-sm);">
            Ganti Nama Kategori
          </h2>
          <p style="font-size: 0.875rem; color: var(--ink-muted); margin: 0 0 var(--sp-md);">
            Ubah nama kategori <strong>${App.esc(cat.name)}</strong>. Seluruh transaksi baru dan laporan akan menggunakan nama ini.
          </p>
          <div class="field">
            <label for="kat-edit-input-name">Nama Baru <span class="required" style="color: var(--danger);">*</span></label>
            <input
              type="text"
              id="kat-edit-input-name"
              class="input"
              value="${App.esc(cat.name)}"
              autocomplete="off"
            />
            <div id="kat-edit-error" class="field-error" style="display: none;"></div>
          </div>
          <div style="display: flex; gap: var(--sp-sm); justify-content: flex-end; margin-top: var(--sp-md);">
            <button type="button" class="btn btn-ghost" id="kat-edit-btn-cancel">Batal</button>
            <button type="button" class="btn btn-accent" id="kat-edit-btn-save">Simpan</button>
          </div>
        </div>
      `;

      document.body.appendChild(overlay);

      const editInput = overlay.querySelector('#kat-edit-input-name');
      const editError = overlay.querySelector('#kat-edit-error');
      const btnCancel = overlay.querySelector('#kat-edit-btn-cancel');
      const btnSave = overlay.querySelector('#kat-edit-btn-save');

      editInput.focus();
      editInput.select();

      const close = () => overlay.remove();
      btnCancel.addEventListener('click', close);
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) close();
      });

      function submitEdit() {
        const newName = editInput.value.trim();
        editError.style.display = 'none';
        editInput.classList.remove('input-error');

        if (!newName) {
          editError.textContent = 'Nama kategori tidak boleh kosong.';
          editError.style.display = 'block';
          editInput.classList.add('input-error');
          editInput.focus();
          return;
        }

        try {
          Store.saveCategory({
            id: cat.id,
            name: newName,
            type: cat.type,
            keywords: cat.keywords || []
          });
          close();
          renderList();
          App.toast(`Nama kategori berhasil diubah menjadi "${newName}".`);
        } catch (err) {
          editError.textContent = err.message || 'Gagal mengubah kategori.';
          editError.style.display = 'block';
          editInput.classList.add('input-error');
          editInput.focus();
        }
      }

      btnSave.addEventListener('click', submitEdit);
      editInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          submitEdit();
        } else if (e.key === 'Escape') {
          close();
        }
      });
    }

    // Dialog Konfirmasi Hapus Kategori
    function showDeleteDialog(cat) {
      const existing = document.getElementById('kat-delete-dialog');
      if (existing) existing.remove();

      const overlay = document.createElement('div');
      overlay.id = 'kat-delete-dialog';
      overlay.className = 'dialog-backdrop';
      overlay.innerHTML = `
        <div class="dialog" role="dialog" aria-modal="true" aria-labelledby="kat-del-title">
          <h2 id="kat-del-title" style="font-size: 1.25rem; margin: 0 0 var(--sp-sm);">
            Hapus Kategori?
          </h2>
          <p style="font-size: 0.9375rem; color: var(--ink-muted); margin: 0 0 var(--sp-md);">
            Kamu yakin ingin menghapus kategori <strong>${App.esc(cat.name)}</strong>? Transaksi lama yang memakai kategori ini tetap menampilkan nama lamanya.
          </p>
          <div style="display: flex; gap: var(--sp-sm); justify-content: flex-end;">
            <button type="button" class="btn btn-ghost" id="kat-del-btn-cancel">Batal</button>
            <button type="button" class="btn btn-danger" id="kat-del-btn-confirm">Ya, Hapus</button>
          </div>
        </div>
      `;

      document.body.appendChild(overlay);

      const btnCancel = overlay.querySelector('#kat-del-btn-cancel');
      const btnConfirm = overlay.querySelector('#kat-del-btn-confirm');

      const close = () => overlay.remove();
      btnCancel.addEventListener('click', close);
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) close();
      });

      btnConfirm.addEventListener('click', () => {
        try {
          Store.deleteCategory(cat.id);
          close();
          renderList();
          App.toast(`Kategori "${cat.name}" berhasil dihapus.`);
        } catch (err) {
          App.toast('Gagal menghapus kategori: ' + err.message);
          close();
        }
      });
    }

    renderList();
  }

  App.registerScreen('kategori', {
    title: 'Kategori',
    render: renderCategoryScreen
  });

})();
