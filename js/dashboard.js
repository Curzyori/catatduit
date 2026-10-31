/**
 * CatatDuit - js/dashboard.js
 * Task T4: Beranda: saldo, jam, grafik (F3 & F4)
 * Pemilik: Tri
 *
 * Mengikuti: PRD.md (F3, F4, 8), DESIGN.md, TASK.md
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
    const today = new Date();
    const dMinus = (days) => new Date(today.getTime() - days * 86400000).toISOString();

    const DUMMY_CATEGORIES = [
      { id: 'cat-exp-1', name: 'Makan', type: 'expense', keywords: ['makan', 'warung'], createdAt: dMinus(10) },
      { id: 'cat-exp-2', name: 'Transport', type: 'expense', keywords: ['bensin', 'ojek'], createdAt: dMinus(10) },
      { id: 'cat-exp-3', name: 'Belanja', type: 'expense', keywords: ['mart'], createdAt: dMinus(10) },
      { id: 'cat-inc-1', name: 'Gaji', type: 'income', keywords: ['gaji'], createdAt: dMinus(10) },
      { id: 'cat-inc-2', name: 'Bonus', type: 'income', keywords: ['bonus'], createdAt: dMinus(10) }
    ];

    let _transactions = [
      {
        id: 'tx-init-1',
        type: 'income',
        amount: 3500000,
        categoryId: 'cat-inc-1',
        categoryName: 'Gaji',
        merchant: 'PT Berkah Sentosa',
        note: 'Gaji bulanan',
        datetime: dMinus(5),
        source: 'manual',
        createdAt: dMinus(5),
        updatedAt: dMinus(5)
      },
      {
        id: 'tx-init-2',
        type: 'expense',
        amount: 150000,
        categoryId: 'cat-exp-2',
        categoryName: 'Transport',
        merchant: 'SPBU Shell',
        note: 'Isi bensin motor',
        datetime: dMinus(2),
        source: 'manual',
        createdAt: dMinus(2),
        updatedAt: dMinus(2)
      },
      {
        id: 'tx-init-3',
        type: 'expense',
        amount: 35000,
        categoryId: 'cat-exp-1',
        categoryName: 'Makan',
        merchant: 'Warung Nasi',
        note: 'Makan siang soto ayam',
        datetime: new Date().toISOString(),
        source: 'manual',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

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
        if (!kat.id) kat.id = 'cat_' + Date.now();
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

  const DAY_NAMES = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const MONTH_NAMES = ['Okt', 'Nov', 'Des', 'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep'];
  const REAL_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

  function formatRealtimeClock(date) {
    const d = date || new Date();
    const dayName = DAY_NAMES[d.getDay()];
    const dateNum = d.getDate();
    const monthName = REAL_MONTHS[d.getMonth()];
    const year = d.getFullYear();

    const pad = n => String(n).padStart(2, '0');
    const hours = pad(d.getHours());
    const minutes = pad(d.getMinutes());
    const seconds = pad(d.getSeconds());

    return `${dayName}, ${dateNum} ${monthName} ${year} - ${hours}:${minutes}:${seconds}`;
  }

  function isSameDay(d1, d2) {
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
  }

  function isSameMonth(d1, d2) {
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth();
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
      .cd-header { margin-bottom: 16px; }
      .cd-brand { display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 6px; }
      .cd-title { font-family: 'Space Grotesk', sans-serif; font-size: 1.5rem; font-weight: 700; color: var(--color-primary); letter-spacing: -0.02em; }
      .clock-display {
        font-family: 'JetBrains Mono', monospace;
        font-size: 0.8125rem;
        font-weight: 500;
        color: var(--color-text-muted);
        background: var(--color-surface-alt);
        padding: 6px 10px;
        border: 1px solid var(--color-line-soft);
        display: inline-block;
      }
      .card-receipt {
        background: var(--color-paper);
        border: 2px solid var(--color-line-strong);
        box-shadow: 6px 6px 0 0 var(--color-line-soft);
        padding: 20px 16px;
        margin-bottom: 20px;
        position: relative;
      }
      .receipt-header { border-bottom: 2px dashed var(--color-line-soft); padding-bottom: 12px; margin-bottom: 14px; text-align: center; }
      .receipt-title { font-size: 0.8125rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: var(--color-text-muted); }
      .receipt-balance { font-family: 'Space Grotesk', sans-serif; font-size: 2rem; font-weight: 700; color: var(--color-primary); margin: 4px 0; }
      .recap-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 14px; }
      .recap-box { background: #FFFFFF; border: 1px solid var(--color-stroke); padding: 10px; }
      .recap-box-title { font-size: 0.75rem; font-weight: 600; color: var(--color-text-muted); text-transform: uppercase; margin-bottom: 4px; }
      .recap-item { display: flex; justify-content: space-between; font-size: 0.8125rem; margin-top: 2px; }
      .text-success { color: var(--color-success) !important; }
      .text-danger { color: var(--color-danger) !important; }
      .quick-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 20px; }
      .btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 48px;
        padding: 10px 14px;
        font-family: inherit;
        font-size: 0.9375rem;
        font-weight: 600;
        cursor: pointer;
        text-decoration: none;
        border: 2px solid var(--color-line-strong);
        box-shadow: 6px 6px 0 0 var(--color-line-soft);
        transition: transform 0.1s, box-shadow 0.1s;
      }
      .btn:active:not(:disabled) {
        transform: translate(2px, 2px);
        box-shadow: 4px 4px 0 0 var(--color-line-soft);
      }
      .btn-primary { background: var(--color-primary); color: #FFFFFF; }
      .btn-accent { background: var(--color-accent); color: var(--color-on-accent); }
      .btn-ghost { background: transparent; color: var(--color-text); border-color: var(--color-stroke); box-shadow: none; }
      .btn:disabled {
        opacity: 0.55;
        cursor: not-allowed;
        box-shadow: none;
      }
      .section-card {
        background: var(--color-surface);
        border: 2px solid var(--color-line-strong);
        box-shadow: 6px 6px 0 0 var(--color-line-soft);
        padding: 16px;
        margin-bottom: 20px;
      }
      .section-title { font-family: 'Space Grotesk', sans-serif; font-size: 1.125rem; font-weight: 700; color: var(--color-primary); margin-bottom: 12px; }
      .chart-container {
        background: var(--color-surface-alt);
        border: 2px solid var(--color-line-soft);
        padding: 12px 8px;
        position: relative;
      }
      .chart-canvas { width: 100%; height: 180px; display: block; }
      .tx-list { display: flex; flex-direction: column; }
      .tx-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        min-height: 52px;
        padding: 10px 0;
        border-bottom: 1px dashed var(--color-line-soft);
        cursor: pointer;
        transition: background 0.1s;
      }
      .tx-item:last-child { border-bottom: none; }
      .tx-item:hover { background: var(--color-surface-alt); }
      .tx-info { display: flex; flex-direction: column; gap: 2px; }
      .tx-meta { display: flex; align-items: center; gap: 8px; }
      .chip-cat {
        display: inline-block;
        padding: 2px 8px;
        font-size: 0.75rem;
        font-weight: 600;
        background: var(--color-surface-alt);
        border: 1px solid var(--color-stroke);
        color: var(--color-accent);
      }
      .tx-merchant { font-weight: 600; font-size: 0.9375rem; color: var(--color-text); }
      .tx-note { font-size: 0.8125rem; color: var(--color-text-muted); }
      .tx-amount { font-family: 'JetBrains Mono', monospace; font-size: 0.9375rem; font-weight: 700; text-align: right; }
      .empty-state {
        border: 2px dashed var(--color-stroke);
        padding: 24px 16px;
        text-align: center;
        color: var(--color-text-muted);
        margin: 8px 0;
      }
      .empty-state p { font-size: 0.875rem; margin-bottom: 12px; }
    `;
    document.head.appendChild(style);
  }

  // ---------------------------------------------------------------------------
  // 3. Render Layar "Beranda"
  // ---------------------------------------------------------------------------
  let clockIntervalId = null;
  let visibilityListenerAttached = false;

  function renderDashboardScreen(container, params) {
    ensureStyles();

    // Hentikan interval jam lama jika ada
    if (clockIntervalId) {
      clearInterval(clockIntervalId);
      clockIntervalId = null;
    }

    // Ambil data transaksi dari Store
    const allTx = (typeof Store !== 'undefined' && Store.listTransactions)
      ? Store.listTransactions()
      : [];

    const now = new Date();

    // 1. Hitung Saldo Total
    let totalIncome = 0;
    let totalExpense = 0;
    allTx.forEach(tx => {
      const amt = Number(tx.amount) || 0;
      if (tx.type === 'income') totalIncome += amt;
      else if (tx.type === 'expense') totalExpense += amt;
    });
    const totalSaldo = totalIncome - totalExpense;

    // 2. Hitung Pemasukan & Pengeluaran Hari Ini
    let todayIncome = 0;
    let todayExpense = 0;
    const todayTransactions = [];

    allTx.forEach(tx => {
      const dt = new Date(tx.datetime);
      if (isSameDay(dt, now)) {
        todayTransactions.push(tx);
        const amt = Number(tx.amount) || 0;
        if (tx.type === 'income') todayIncome += amt;
        else if (tx.type === 'expense') todayExpense += amt;
      }
    });

    // 3. Hitung Pemasukan & Pengeluaran Bulan Ini
    let monthIncome = 0;
    let monthExpense = 0;
    allTx.forEach(tx => {
      const dt = new Date(tx.datetime);
      if (isSameMonth(dt, now)) {
        const amt = Number(tx.amount) || 0;
        if (tx.type === 'income') monthIncome += amt;
        else if (tx.type === 'expense') monthExpense += amt;
      }
    });

    // Template HTML Beranda
    container.innerHTML = `
      <div class="cd-screen cd-screen-dashboard" id="screen-dashboard">
        <header class="cd-header">
          <div class="cd-brand">
            <h1 class="cd-title">CatatDuit</h1>
          </div>
          <!-- Jam Real-time (F4) -->
          <div id="realtime-clock" class="clock-display font-mono" aria-live="off">
            ${escapeHtml(formatRealtimeClock(now))}
          </div>
        </header>

        <!-- Kartu Struk Saldo & Ringkasan (F3) -->
        <section class="card-receipt">
          <div class="receipt-header">
            <div class="receipt-title">Saldo Total</div>
            <div class="receipt-balance font-mono" id="dash-total-balance">
              ${escapeHtml(App.formatRupiah(totalSaldo))}
            </div>
          </div>

          <div class="recap-grid">
            <!-- Rekap Hari Ini -->
            <div class="recap-box">
              <div class="recap-box-title">Hari Ini</div>
              <div class="recap-item font-mono text-success">
                <span>+</span>
                <span>${escapeHtml(App.formatRupiah(todayIncome))}</span>
              </div>
              <div class="recap-item font-mono text-danger">
                <span>-</span>
                <span>${escapeHtml(App.formatRupiah(todayExpense))}</span>
              </div>
            </div>

            <!-- Rekap Bulan Ini -->
            <div class="recap-box">
              <div class="recap-box-title">Bulan Ini</div>
              <div class="recap-item font-mono text-success">
                <span>+</span>
                <span>${escapeHtml(App.formatRupiah(monthIncome))}</span>
              </div>
              <div class="recap-item font-mono text-danger">
                <span>-</span>
                <span>${escapeHtml(App.formatRupiah(monthExpense))}</span>
              </div>
            </div>
          </div>
        </section>

        <!-- Tombol Cepat (F3) -->
        <section class="quick-actions">
          <button type="button" class="btn btn-accent" id="dash-btn-add-tx">
            + Catat Transaksi
          </button>
          <button type="button" class="btn btn-ghost" id="dash-btn-scan" disabled title="Segera hadir di Tahap 2">
            Scan Struk (Segera)
          </button>
        </section>

        <!-- Grafik Saldo Akhir 7 Hari (F3) -->
        <section class="section-card">
          <h2 class="section-title">Grafik Saldo 7 Hari</h2>
          <div class="chart-container">
            <canvas id="chart-7-days" class="chart-canvas"></canvas>
          </div>
        </section>

        <!-- Daftar Transaksi Hari Ini (F3) -->
        <section class="section-card">
          <h2 class="section-title">Transaksi Hari Ini</h2>
          <div class="tx-list" id="dash-today-tx-list">
            ${todayTransactions.length === 0 ? `
              <div class="empty-state">
                <p>Belum ada transaksi hari ini.</p>
                <button type="button" class="btn btn-primary" id="dash-empty-add-btn">
                  + Catat Transaksi Sekarang
                </button>
              </div>
            ` : todayTransactions.map(tx => `
              <div class="tx-item" data-id="${escapeHtml(tx.id)}">
                <div class="tx-info">
                  <div class="tx-meta">
                    <span class="chip-cat">${escapeHtml(tx.categoryName || 'Lainnya')}</span>
                    <span class="tx-merchant">${escapeHtml(tx.merchant || tx.categoryName || 'Transaksi')}</span>
                  </div>
                  ${tx.note ? `<div class="tx-note">${escapeHtml(tx.note)}</div>` : ''}
                </div>
                <div class="tx-amount ${tx.type === 'income' ? 'text-success' : 'text-danger'}">
                  ${tx.type === 'income' ? '+' : '-'} ${escapeHtml(App.formatRupiah(tx.amount))}
                </div>
              </div>
            `).join('')}
          </div>
        </section>
      </div>
    `;

    // -------------------------------------------------------------------------
    // Inisialisasi Jam Real-time (F4)
    // -------------------------------------------------------------------------
    const clockEl = container.querySelector('#realtime-clock');

    function updateClock() {
      if (clockEl) {
        clockEl.textContent = formatRealtimeClock(new Date());
      }
    }

    // Jalankan interval per detik
    clockIntervalId = setInterval(updateClock, 1000);

    // Tangani visibilitychange agar jam tidak melompat dan selalu akurat saat tab kembali aktif
    if (!visibilityListenerAttached) {
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
          updateClock();
        }
      });
      visibilityListenerAttached = true;
    }

    // -------------------------------------------------------------------------
    // Event Handler Tombol Cepat & Baris Transaksi
    // -------------------------------------------------------------------------
    const btnAddTx = container.querySelector('#dash-btn-add-tx');
    const emptyAddBtn = container.querySelector('#dash-empty-add-btn');

    function openAddTransaction() {
      if (typeof App !== 'undefined' && App.openScreen) {
        App.openScreen('transaksi');
      }
    }

    if (btnAddTx) btnAddTx.addEventListener('click', openAddTransaction);
    if (emptyAddBtn) emptyAddBtn.addEventListener('click', openAddTransaction);

    // Klik transaksi hari ini untuk membuka mode edit
    const txItems = container.querySelectorAll('.tx-item');
    txItems.forEach(item => {
      item.addEventListener('click', () => {
        const txId = item.dataset.id;
        if (typeof App !== 'undefined' && App.openScreen) {
          App.openScreen('transaksi', { id: txId });
        }
      });
    });

    // -------------------------------------------------------------------------
    // Gambar Grafik Saldo 7 Hari Pakai Canvas Murni Tanpa Library (F3)
    // -------------------------------------------------------------------------
    const canvas = container.querySelector('#chart-7-days');
    if (canvas) {
      render7DayChart(canvas, allTx);
    }
  }

  // ---------------------------------------------------------------------------
  // 4. Engine Grafik Batang Canvas Murni (Tanpa Library)
  // ---------------------------------------------------------------------------
  function render7DayChart(canvas, allTx) {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Hitung saldo akhir untuk 7 hari terakhir (H-6 s.d. Hari Ini)
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    const daysData = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today.getTime() - i * 86400000);
      const year = d.getFullYear();
      const month = d.getMonth();
      const dateNum = d.getDate();

      const endOfDay = new Date(year, month, dateNum, 23, 59, 59, 999);

      // Hitung kumulatif saldo sampai akhir hari ini
      let balance = 0;
      allTx.forEach(tx => {
        const txTime = new Date(tx.datetime).getTime();
        if (txTime <= endOfDay.getTime()) {
          const amt = Number(tx.amount) || 0;
          if (tx.type === 'income') balance += amt;
          else if (tx.type === 'expense') balance -= amt;
        }
      });

      const pad = n => String(n).padStart(2, '0');
      const label = `${pad(dateNum)}/${pad(month + 1)}`;
      daysData.push({ label, balance, date: d });
    }

    // Resolusi HD / Retina
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const width = rect.width || 320;
    const height = 180;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    // Bersihkan canvas
    ctx.fillStyle = '#F0F7FB'; // surface-alt
    ctx.fillRect(0, 0, width, height);

    // Cari rentang nilai (min & max)
    const balances = daysData.map(d => d.balance);
    let maxVal = Math.max(...balances, 0);
    let minVal = Math.min(...balances, 0);

    // Beri sedikit margin atas dan bawah agar batang tidak menempel ke tepi
    if (maxVal === 0 && minVal === 0) {
      maxVal = 100000;
      minVal = 0;
    }
    const range = (maxVal - minVal) || 1;

    const padLeft = 14;
    const padRight = 14;
    const padTop = 26;
    const padBottom = 28;
    const plotWidth = width - padLeft - padRight;
    const plotHeight = height - padTop - padBottom;

    // Hitung posisi baseline (Y untuk nilai 0)
    const zeroY = padTop + plotHeight * (maxVal / range);

    // Garis Grid (line-soft #CFE2EE)
    ctx.lineWidth = 1;
    ctx.strokeStyle = '#CFE2EE';
    ctx.setLineDash([4, 4]);

    // Garis atas
    ctx.beginPath();
    ctx.moveTo(padLeft, padTop);
    ctx.lineTo(width - padRight, padTop);
    ctx.stroke();

    // Garis tengah / zero
    ctx.beginPath();
    ctx.moveTo(padLeft, zeroY);
    ctx.lineTo(width - padRight, zeroY);
    ctx.stroke();

    ctx.setLineDash([]); // Reset line dash

    // Gambar Batang Flat / Kotak (Radius 0 sesuai DESIGN.md)
    const barCount = daysData.length;
    const slotWidth = plotWidth / barCount;
    const barWidth = Math.max(14, slotWidth * 0.58);

    daysData.forEach((day, idx) => {
      const centerX = padLeft + idx * slotWidth + slotWidth / 2;
      const x = Math.round(centerX - barWidth / 2);

      const val = day.balance;
      const barHeight = Math.abs(val) / range * plotHeight;
      const y = val >= 0 ? Math.round(zeroY - barHeight) : Math.round(zeroY);

      // Warna batang: aksen (#0369A1) untuk positif, bahaya (#BE123C) untuk negatif
      ctx.fillStyle = val >= 0 ? '#0369A1' : '#BE123C';
      ctx.fillRect(x, y, barWidth, Math.max(2, barHeight));

      // Frame 1.5px garis kuat #163A55
      ctx.strokeStyle = '#163A55';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(x, y, barWidth, Math.max(2, barHeight));

      // Label Tanggal di Bawah (JetBrains Mono)
      ctx.fillStyle = '#3B5A70';
      ctx.font = '500 10px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(day.label, centerX, height - 10);

      // Teks nominal ringkas di atas batang (misal: 50k, 1.2jt)
      let shortVal = '';
      const absVal = Math.abs(val);
      if (absVal >= 1000000) {
        shortVal = (val / 1000000).toFixed(1).replace('.0', '') + 'jt';
      } else if (absVal >= 1000) {
        shortVal = (val / 1000).toFixed(0) + 'k';
      } else {
        shortVal = String(val);
      }

      ctx.fillStyle = val >= 0 ? '#072033' : '#BE123C';
      ctx.font = '700 9px "JetBrains Mono", monospace';
      const labelY = val >= 0 ? Math.max(12, y - 4) : Math.min(height - padBottom - 4, y + barHeight + 10);
      ctx.fillText(shortVal, centerX, labelY);
    });
  }

  // ---------------------------------------------------------------------------
  // 5. Registrasi Layar ke App
  // ---------------------------------------------------------------------------
  App.registerScreen('beranda', {
    title: 'Beranda',
    render: renderDashboardScreen
  });

})();
