/**
 * CatatDuit - js/history.js
 * Task T6: Riwayat + filter + pencarian (F5)
 * Pemilik: Tri (mengambil alih dari Predi)
 *
 * Mengikuti: PRD.md (F5, 8), DESIGN.md, TASK.md
 * Akses data HANYA lewat Store.* dan navigasi/helper lewat App.*
 */

(function () {
  'use strict';

  const selectedTxIds = new Set();
  const PAGE_SIZE = 50;

  const DAY_NAMES = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

  function formatDateGroup(dateStr) {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = DAY_NAMES[d.getDay()];
    const dateNum = d.getDate();
    const month = MONTH_NAMES[d.getMonth()];
    const year = d.getFullYear();
    return `${day}, ${dateNum} ${month} ${year}`;
  }

  function formatTime(isoStr) {
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return '';
    const pad = n => String(n).padStart(2, '0');
    return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  function formatDateTimeFull(isoStr) {
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return isoStr || '-';
    const day = DAY_NAMES[d.getDay()];
    const dateNum = d.getDate();
    const month = MONTH_NAMES[d.getMonth()];
    const year = d.getFullYear();
    const pad = n => String(n).padStart(2, '0');
    return `${day}, ${dateNum} ${month} ${year} - ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  }

  function renderHistoryScreen(container, params) {
    const staleDialogs = document.querySelectorAll('#hist-detail-dialog, #hist-delete-dialog');
    staleDialogs.forEach(d => d.remove());

    let filterType = 'all'; // 'all' | 'expense' | 'income'
    let filterCategory = 'all'; // 'all' | categoryId
    let filterStartDate = '';
    let filterEndDate = '';
    let searchQuery = '';
    let displayedCount = PAGE_SIZE;

    container.innerHTML = `
      <header style="display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--sp-md);">
        <h1 style="font-size: 1.5rem; margin: 0;">Riwayat Transaksi</h1>
        <button type="button" class="btn btn-ghost" id="hist-btn-filter-toggle" style="min-height: 40px; padding: 6px 12px;">
          <span class="msr" aria-hidden="true" style="font-size: 20px;">filter_list</span>
          <span>Filter</span>
        </button>
      </header>

      <!-- Panel Filter & Pencarian -->
      <section class="card" id="hist-filter-card" style="margin-bottom: var(--sp-md);">
        <!-- Kolom Pencarian -->
        <div class="field">
          <label for="hist-search-input">Cari Transaksi</label>
          <input
            type="search"
            id="hist-search-input"
            class="input"
            placeholder="Cari toko, merchant, atau catatan..."
            autocomplete="off"
          />
        </div>

        <!-- Filter Jenis: Semua, Pengeluaran, Pemasukan -->
        <div class="field">
          <label>Jenis Transaksi</label>
          <div style="display: flex; gap: var(--sp-xs); flex-wrap: wrap;">
            <button type="button" class="chip chip-active" id="chip-type-all" data-type="all">Semua</button>
            <button type="button" class="chip" id="chip-type-expense" data-type="expense">Pengeluaran</button>
            <button type="button" class="chip" id="chip-type-income" data-type="income">Pemasukan</button>
          </div>
        </div>

        <!-- Filter Kategori -->
        <div class="field">
          <label for="hist-filter-category">Kategori</label>
          <select id="hist-filter-category" class="input">
            <option value="all">Semua Kategori</option>
          </select>
        </div>

        <!-- Filter Rentang Tanggal -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--sp-sm);">
          <div class="field">
            <label for="hist-filter-start">Dari Tanggal</label>
            <input type="date" id="hist-filter-start" class="input" />
          </div>
          <div class="field">
            <label for="hist-filter-end">Sampai Tanggal</label>
            <input type="date" id="hist-filter-end" class="input" />
          </div>
        </div>

        <!-- Tombol Reset Filter -->
        <div style="display: flex; justify-content: flex-end; margin-top: var(--sp-xs);">
          <button type="button" class="btn btn-ghost" id="hist-btn-reset-filter" style="min-height: 36px; padding: 4px 12px; font-size: 0.875rem;">
            Reset Filter
          </button>
        </div>
      </section>

      <!-- Ringkasan Seleksi / Laporan -->
      <div id="hist-selection-bar" style="display: none; align-items: center; justify-content: space-between; background: var(--surface-alt); border: 2px solid var(--stroke); padding: var(--sp-xs) var(--sp-sm); margin-bottom: var(--sp-sm);">
        <span id="hist-selection-count" style="font-size: 0.875rem; font-weight: 600;">0 transaksi dipilih</span>
        <button type="button" class="btn btn-ghost" id="hist-btn-clear-selection" style="min-height: 32px; padding: 2px 8px; font-size: 0.8125rem;">
          Batal Pilih
        </button>
      </div>

      <!-- Container Daftar Transaksi -->
      <div id="hist-list-container"></div>

      <!-- Tombol Muat Lebih Banyak (untuk 5.000 transaksi tetap lancar) -->
      <div id="hist-load-more-container" style="text-align: center; margin: var(--sp-md) 0; display: none;">
        <button type="button" class="btn btn-ghost btn-block" id="hist-btn-load-more">
          Muat Lebih Banyak
        </button>
      </div>
    `;

    const searchInput = container.querySelector('#hist-search-input');
    const categorySelect = container.querySelector('#hist-filter-category');
    const startDateInput = container.querySelector('#hist-filter-start');
    const endDateInput = container.querySelector('#hist-filter-end');
    const resetFilterBtn = container.querySelector('#hist-btn-reset-filter');
    const filterToggleBtn = container.querySelector('#hist-btn-filter-toggle');
    const filterCard = container.querySelector('#hist-filter-card');
    const listContainer = container.querySelector('#hist-list-container');
    const loadMoreContainer = container.querySelector('#hist-load-more-container');
    const loadMoreBtn = container.querySelector('#hist-btn-load-more');
    const selectionBar = container.querySelector('#hist-selection-bar');
    const selectionCount = container.querySelector('#hist-selection-count');
    const clearSelectionBtn = container.querySelector('#hist-btn-clear-selection');

    const chipAll = container.querySelector('#chip-type-all');
    const chipExpense = container.querySelector('#chip-type-expense');
    const chipIncome = container.querySelector('#chip-type-income');

    // Toggle panel filter
    let filterVisible = true;
    filterToggleBtn.addEventListener('click', () => {
      filterVisible = !filterVisible;
      filterCard.style.display = filterVisible ? 'block' : 'none';
    });

    // Populate Kategori dropdown
    function populateCategories() {
      categorySelect.innerHTML = '<option value="all">Semua Kategori</option>';
      const categories = (typeof Store !== 'undefined' && Store.listCategories)
        ? Store.listCategories(filterType === 'all' ? undefined : filterType)
        : [];

      categories.forEach(cat => {
        const opt = document.createElement('option');
        opt.value = cat.id;
        opt.textContent = `${cat.name} (${cat.type === 'income' ? 'Pemasukan' : 'Pengeluaran'})`;
        categorySelect.appendChild(opt);
      });
    }

    populateCategories();

    // Event filter jenis (chip)
    function setTypeChip(type) {
      filterType = type;
      [chipAll, chipExpense, chipIncome].forEach(chip => chip.classList.remove('chip-active'));
      if (type === 'all') chipAll.classList.add('chip-active');
      else if (type === 'expense') chipExpense.classList.add('chip-active');
      else if (type === 'income') chipIncome.classList.add('chip-active');

      filterCategory = 'all';
      populateCategories();
      displayedCount = PAGE_SIZE;
      renderTransactions();
    }

    chipAll.addEventListener('click', () => setTypeChip('all'));
    chipExpense.addEventListener('click', () => setTypeChip('expense'));
    chipIncome.addEventListener('click', () => setTypeChip('income'));

    // Filter Kategori
    categorySelect.addEventListener('change', () => {
      filterCategory = categorySelect.value;
      displayedCount = PAGE_SIZE;
      renderTransactions();
    });

    // Filter Tanggal
    startDateInput.addEventListener('change', () => {
      filterStartDate = startDateInput.value;
      displayedCount = PAGE_SIZE;
      renderTransactions();
    });

    endDateInput.addEventListener('change', () => {
      filterEndDate = endDateInput.value;
      displayedCount = PAGE_SIZE;
      renderTransactions();
    });

    // Pencarian Catatan & Nama Toko
    searchInput.addEventListener('input', () => {
      searchQuery = searchInput.value.trim().toLowerCase();
      displayedCount = PAGE_SIZE;
      renderTransactions();
    });

    // Reset filter
    resetFilterBtn.addEventListener('click', () => {
      searchInput.value = '';
      searchQuery = '';
      startDateInput.value = '';
      filterStartDate = '';
      endDateInput.value = '';
      filterEndDate = '';
      categorySelect.value = 'all';
      filterCategory = 'all';
      setTypeChip('all');
    });

    // Update selection bar UI
    function updateSelectionUI() {
      if (selectedTxIds.size > 0) {
        selectionBar.style.display = 'flex';
        selectionCount.textContent = `${selectedTxIds.size} transaksi dipilih`;
      } else {
        selectionBar.style.display = 'none';
      }
    }

    clearSelectionBtn.addEventListener('click', () => {
      selectedTxIds.clear();
      updateSelectionUI();
      renderTransactions();
    });

    // Render daftar transaksi
    function renderTransactions() {
      const allTx = (typeof Store !== 'undefined' && Store.listTransactions)
        ? Store.listTransactions()
        : [];

      // 1. Terapkan Filter
      const filtered = allTx.filter(tx => {
        // Filter Jenis
        if (filterType !== 'all' && tx.type !== filterType) {
          return false;
        }

        // Filter Kategori
        if (filterCategory !== 'all') {
          if (tx.categoryId !== filterCategory && tx.categoryName !== filterCategory) {
            return false;
          }
        }

        // Filter Tanggal Mulai (start date, YYYY-MM-DD)
        if (filterStartDate) {
          const txDate = tx.datetime ? tx.datetime.slice(0, 10) : '';
          if (txDate < filterStartDate) return false;
        }

        // Filter Tanggal Selesai (end date, YYYY-MM-DD)
        if (filterEndDate) {
          const txDate = tx.datetime ? tx.datetime.slice(0, 10) : '';
          if (txDate > filterEndDate) return false;
        }

        // Filter Pencarian (nama toko / merchant & catatan / note)
        if (searchQuery) {
          const m = (tx.merchant || '').toLowerCase();
          const n = (tx.note || '').toLowerCase();
          const c = (tx.categoryName || '').toLowerCase();
          if (!m.includes(searchQuery) && !n.includes(searchQuery) && !c.includes(searchQuery)) {
            return false;
          }
        }

        return true;
      });

      // 2. Tangani Kondisi Kosong
      if (filtered.length === 0) {
        listContainer.innerHTML = `
          <div class="empty">
            <p style="margin: 0 0 var(--sp-sm);">Belum ada transaksi yang sesuai.</p>
            ${allTx.length === 0 ? `
              <button type="button" class="btn btn-primary" id="hist-empty-add-btn">
                + Catat Transaksi Sekarang
              </button>
            ` : ''}
          </div>
        `;
        loadMoreContainer.style.display = 'none';
        const addBtn = listContainer.querySelector('#hist-empty-add-btn');
        if (addBtn) {
          addBtn.addEventListener('click', () => {
            if (typeof App !== 'undefined' && App.openScreen) {
              App.openScreen('transaksi');
            }
          });
        }
        return;
      }

      // 3. Batasi item yang dirender untuk performa tinggi (5.000 transaksi)
      const toShow = filtered.slice(0, displayedCount);

      if (filtered.length > displayedCount) {
        loadMoreContainer.style.display = 'block';
        loadMoreBtn.textContent = `Muat Lebih Banyak (${filtered.length - displayedCount} lagi)`;
      } else {
        loadMoreContainer.style.display = 'none';
      }

      // 4. Kelompokkan per tanggal (terbaru di atas)
      const groups = {}; // 'YYYY-MM-DD' -> [tx]
      toShow.forEach(tx => {
        const dateKey = tx.datetime ? tx.datetime.slice(0, 10) : 'Lainnya';
        if (!groups[dateKey]) groups[dateKey] = [];
        groups[dateKey].push(tx);
      });

      // Urutkan key tanggal terbaru di atas
      const sortedDates = Object.keys(groups).sort((a, b) => (a < b ? 1 : a > b ? -1 : 0));

      let html = '';
      sortedDates.forEach(dateKey => {
        const items = groups[dateKey];
        html += `
          <div class="hist-group" style="margin-bottom: var(--sp-md);">
            <div style="font-size: 0.8125rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--ink-muted); margin: var(--sp-sm) 0 var(--sp-xs);">
              ${App.esc(formatDateGroup(dateKey))}
            </div>
            <div class="list">
              ${items.map(tx => {
                const isChecked = selectedTxIds.has(tx.id);
                const isIncome = tx.type === 'income';
                return `
                  <div class="list-row hist-tx-row" data-id="${App.esc(tx.id)}" style="cursor: pointer;">
                    <!-- Checkbox Centang -->
                    <div style="display: flex; align-items: center;" class="hist-check-wrapper">
                      <input
                        type="checkbox"
                        class="hist-tx-check"
                        data-id="${App.esc(tx.id)}"
                        ${isChecked ? 'checked' : ''}
                        style="width: 20px; height: 20px; cursor: pointer; accent-color: var(--accent);"
                        aria-label="Pilih transaksi"
                      />
                    </div>
                    <!-- Info Transaksi -->
                    <div class="grow" style="margin-left: var(--sp-xs);">
                      <div style="display: flex; align-items: center; gap: var(--sp-xs); flex-wrap: wrap;">
                        <span class="chip" style="min-height: 24px; padding: 0 6px; font-size: 0.75rem;">
                          ${App.esc(tx.categoryName || 'Lainnya')}
                        </span>
                        <span class="title" style="font-size: 0.9375rem;">
                          ${App.esc(tx.merchant || tx.categoryName || 'Transaksi')}
                        </span>
                      </div>
                      <div class="sub" style="margin-top: 2px;">
                        ${tx.note ? `<span>${App.esc(tx.note)}</span> &bull; ` : ''}
                        <span>${App.esc(formatTime(tx.datetime))}</span>
                      </div>
                    </div>
                    <!-- Nominal Uang -->
                    <div class="amount mono ${isIncome ? 'amount-plus' : 'amount-minus'}">
                      ${isIncome ? '+' : '-'} ${App.esc(App.formatRupiah(tx.amount))}
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        `;
      });

      listContainer.innerHTML = html;

      // Event listener klik baris -> buka Detail Transaksi
      listContainer.querySelectorAll('.hist-tx-row').forEach(row => {
        row.addEventListener('click', (e) => {
          // Jika yang diklik adalah checkbox, jangan buka detail
          if (e.target.closest('.hist-check-wrapper') || e.target.classList.contains('hist-tx-check')) {
            return;
          }
          const txId = row.dataset.id;
          const targetTx = filtered.find(t => t.id === txId) || allTx.find(t => t.id === txId);
          if (targetTx) {
            showDetailDialog(targetTx);
          }
        });
      });

      // Event listener checkbox
      listContainer.querySelectorAll('.hist-tx-check').forEach(chk => {
        chk.addEventListener('change', (e) => {
          e.stopPropagation();
          const id = chk.dataset.id;
          if (chk.checked) {
            selectedTxIds.add(id);
          } else {
            selectedTxIds.delete(id);
          }
          updateSelectionUI();
        });
      });
    }

    // Tombol Muat Lebih Banyak
    loadMoreBtn.addEventListener('click', () => {
      displayedCount += PAGE_SIZE;
      renderTransactions();
    });

    // Dialog Detail Transaksi (lengkap dengan Edit & Hapus)
    function showDetailDialog(tx) {
      const existing = document.getElementById('hist-detail-dialog');
      if (existing) existing.remove();

      const overlay = document.createElement('div');
      overlay.id = 'hist-detail-dialog';
      overlay.className = 'dialog-backdrop';

      const isIncome = tx.type === 'income';

      overlay.innerHTML = `
        <div class="dialog" role="dialog" aria-modal="true" aria-labelledby="hist-detail-title">
          <div style="display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: var(--sp-sm);">
            <div>
              <span class="chip" style="font-size: 0.75rem; min-height: 24px; padding: 0 6px;">
                ${isIncome ? 'Pemasukan' : 'Pengeluaran'}
              </span>
              <h2 id="hist-detail-title" style="font-size: 1.25rem; margin: var(--sp-xs) 0 0;">
                ${App.esc(tx.merchant || tx.categoryName || 'Transaksi')}
              </h2>
            </div>
            <button type="button" class="btn btn-ghost" id="hist-detail-btn-close" style="min-height: 36px; padding: 4px 8px;" title="Tutup">
              <span class="msr" aria-hidden="true">close</span>
            </button>
          </div>

          <!-- Nominal Besar Monospace -->
          <div class="card" style="text-align: center; background: var(--surface-alt); margin-bottom: var(--sp-md); padding: var(--sp-sm);">
            <div style="font-size: 0.75rem; text-transform: uppercase; color: var(--ink-muted); font-weight: 600;">Jumlah</div>
            <div class="amount mono ${isIncome ? 'amount-plus' : 'amount-minus'}" style="font-size: 1.5rem; font-weight: 700; margin-top: 4px;">
              ${isIncome ? '+' : '-'} ${App.esc(App.formatRupiah(tx.amount))}
            </div>
          </div>

          <!-- Rincian -->
          <div style="display: flex; flex-direction: column; gap: var(--sp-xs); font-size: 0.9375rem; margin-bottom: var(--sp-lg);">
            <div style="display: flex; justify-content: space-between; border-bottom: 1px dashed var(--line-soft); padding-bottom: 4px;">
              <span style="color: var(--ink-muted);">Kategori:</span>
              <strong>${App.esc(tx.categoryName || 'Lainnya')}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; border-bottom: 1px dashed var(--line-soft); padding-bottom: 4px;">
              <span style="color: var(--ink-muted);">Tanggal & Waktu:</span>
              <span>${App.esc(formatDateTimeFull(tx.datetime))}</span>
            </div>
            ${tx.merchant ? `
              <div style="display: flex; justify-content: space-between; border-bottom: 1px dashed var(--line-soft); padding-bottom: 4px;">
                <span style="color: var(--ink-muted);">Nama Toko / Pihak:</span>
                <span>${App.esc(tx.merchant)}</span>
              </div>
            ` : ''}
            ${tx.note ? `
              <div style="display: flex; justify-content: space-between; border-bottom: 1px dashed var(--line-soft); padding-bottom: 4px;">
                <span style="color: var(--ink-muted);">Catatan:</span>
                <span>${App.esc(tx.note)}</span>
              </div>
            ` : ''}
            <div style="display: flex; justify-content: space-between; padding-bottom: 4px;">
              <span style="color: var(--ink-muted);">Sumber:</span>
              <span>${App.esc(tx.source || 'manual')}</span>
            </div>
          </div>

          <!-- Tombol Aksi: Edit & Hapus -->
          <div style="display: flex; flex-direction: column; gap: var(--sp-sm);">
            <button type="button" class="btn btn-accent btn-block" id="hist-detail-btn-edit">
              <span class="msr" aria-hidden="true">edit</span>
              <span>Edit Transaksi</span>
            </button>
            <button type="button" class="btn btn-danger btn-block" id="hist-detail-btn-delete">
              <span class="msr" aria-hidden="true">delete</span>
              <span>Hapus Transaksi</span>
            </button>
          </div>
        </div>
      `;

      document.body.appendChild(overlay);

      const close = () => overlay.remove();
      overlay.querySelector('#hist-detail-btn-close').addEventListener('click', close);
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) close();
      });

      // Tombol Edit: panggil App.openScreen('transaksi', { editId })
      overlay.querySelector('#hist-detail-btn-edit').addEventListener('click', () => {
        close();
        if (typeof App !== 'undefined' && App.openScreen) {
          App.openScreen('transaksi', { id: tx.id, editId: tx.id });
        }
      });

      // Tombol Hapus: konfirmasi hapus
      overlay.querySelector('#hist-detail-btn-delete').addEventListener('click', () => {
        close();
        showDeleteTxConfirmation(tx);
      });
    }

    // Dialog Konfirmasi Hapus Transaksi dari Riwayat
    function showDeleteTxConfirmation(tx) {
      const existing = document.getElementById('hist-delete-dialog');
      if (existing) existing.remove();

      const overlay = document.createElement('div');
      overlay.id = 'hist-delete-dialog';
      overlay.className = 'dialog-backdrop';

      overlay.innerHTML = `
        <div class="dialog" role="dialog" aria-modal="true" aria-labelledby="hist-del-title">
          <h2 id="hist-del-title" style="font-size: 1.25rem; margin: 0 0 var(--sp-sm);">
            Hapus Transaksi?
          </h2>
          <p style="font-size: 0.9375rem; color: var(--ink-muted); margin: 0 0 var(--sp-md);">
            Kamu yakin ingin menghapus transaksi <strong>${App.esc(tx.categoryName || 'Transaksi')}</strong> sebesar <strong>${App.esc(App.formatRupiah(tx.amount))}</strong>?
          </p>
          <div style="display: flex; gap: var(--sp-sm); justify-content: flex-end;">
            <button type="button" class="btn btn-ghost" id="hist-del-btn-cancel">Batal</button>
            <button type="button" class="btn btn-danger" id="hist-del-btn-confirm">Ya, Hapus</button>
          </div>
        </div>
      `;

      document.body.appendChild(overlay);

      const close = () => overlay.remove();
      overlay.querySelector('#hist-del-btn-cancel').addEventListener('click', close);
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) close();
      });

      overlay.querySelector('#hist-del-btn-confirm').addEventListener('click', () => {
        close();
        if (typeof Store !== 'undefined' && Store.deleteTransaction) {
          Store.deleteTransaction(tx.id);
          selectedTxIds.delete(tx.id);
          updateSelectionUI();
          renderTransactions();
          App.toast('Transaksi berhasil dihapus.');
        }
      });
    }

    // Inisialisasi tampilan
    updateSelectionUI();
    renderTransactions();
  }

  App.registerScreen('riwayat', {
    title: 'Riwayat',
    render: renderHistoryScreen
  });

})();
