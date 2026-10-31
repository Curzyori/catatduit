/**
 * CatatDuit - js/dashboard.js
 * Task T4: Beranda: saldo, jam, grafik (F3 & F4)
 * Implementasi asli: Tri (PR #2) — integrasi styling & pembersihan fallback: Yuken
 *
 * Mengikuti: PRD.md (F3, F4, 8), DESIGN.md, TASK.md
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

  const DAY_NAMES = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
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

  let clockIntervalId = null;
  let visibilityHandler = null;

  function renderDashboardScreen(container, params) {
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
      <header style="display: flex; align-items: baseline; justify-content: space-between; margin-bottom: var(--sp-md); flex-wrap: wrap; gap: var(--sp-xs);">
        <h1 style="margin: 0;">CatatDuit</h1>
        <div id="realtime-clock" class="clock mono">
          ${escapeHtml(formatRealtimeClock(now))}
        </div>
      </header>

      <!-- Kartu Struk Saldo & Ringkasan (F3) -->
      <section class="card-receipt">
        <div class="receipt-header">
          <div class="receipt-title">Saldo Total</div>
          <div class="receipt-balance mono" id="dash-total-balance">
            ${escapeHtml(App.formatRupiah(totalSaldo))}
          </div>
        </div>

        <div class="recap-grid">
          <!-- Rekap Hari Ini -->
          <div class="recap-box">
            <div class="recap-box-title">Hari Ini</div>
            <div class="recap-item mono amount-plus">
              <span>+</span>
              <span>${escapeHtml(App.formatRupiah(todayIncome))}</span>
            </div>
            <div class="recap-item mono amount-minus">
              <span>-</span>
              <span>${escapeHtml(App.formatRupiah(todayExpense))}</span>
            </div>
          </div>

          <!-- Rekap Bulan Ini -->
          <div class="recap-box">
            <div class="recap-box-title">Bulan Ini</div>
            <div class="recap-item mono amount-plus">
              <span>+</span>
              <span>${escapeHtml(App.formatRupiah(monthIncome))}</span>
            </div>
            <div class="recap-item mono amount-minus">
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
        <button type="button" class="btn btn-ghost" id="dash-btn-kategori">
          Kategori
        </button>
      </section>

      <!-- Grafik Saldo Akhir 7 Hari (F3) -->
      <section class="card">
        <h2>Grafik Saldo 7 Hari</h2>
        <canvas id="chart-7-days" class="chart"></canvas>
      </section>

      <!-- Daftar Transaksi Hari Ini (F3) -->
      <section class="card">
        <h2>Transaksi Hari Ini</h2>
        <div class="list" id="dash-today-tx-list">
          ${todayTransactions.length === 0 ? `
            <div class="empty" style="border: 0; margin: 0;">
              <p>Belum ada transaksi hari ini.</p>
              <button type="button" class="btn btn-primary" id="dash-empty-add-btn">
                + Catat Transaksi Sekarang
              </button>
            </div>
          ` : todayTransactions.map(tx => `
            <div class="list-row" data-id="${escapeHtml(tx.id)}" role="button" tabindex="0">
              <span class="chip">${escapeHtml(tx.categoryName || 'Lainnya')}</span>
              <div class="grow">
                <div class="title">${escapeHtml(tx.merchant || tx.categoryName || 'Transaksi')}</div>
                ${tx.note ? `<div class="sub">${escapeHtml(tx.note)}</div>` : ''}
              </div>
              <div class="amount ${tx.type === 'income' ? 'amount-plus' : 'amount-minus'}">
                ${tx.type === 'income' ? '+' : '-'} ${escapeHtml(App.formatRupiah(tx.amount))}
              </div>
            </div>
          `).join('')}
        </div>
      </section>
    `;

    // -------------------------------------------------------------------------
    // Inisialisasi Jam Real-time (F4)
    // -------------------------------------------------------------------------
    const clockEl = container.querySelector('#realtime-clock');

    function updateClock() {
      // Layar sudah tidak terpasang (pengguna pindah menu) = matikan interval
      if (!clockEl || !clockEl.isConnected) {
        clearInterval(clockIntervalId);
        clockIntervalId = null;
        return;
      }
      clockEl.textContent = formatRealtimeClock(new Date());
    }

    // Jalankan interval per detik
    clockIntervalId = setInterval(updateClock, 1000);

    // Tab kembali aktif: langsung perbarui agar tidak melompat.
    // Ganti handler lama supaya tidak menumpuk tiap render.
    if (visibilityHandler) document.removeEventListener('visibilitychange', visibilityHandler);
    visibilityHandler = () => {
      if (!document.hidden) updateClock();
    };
    document.addEventListener('visibilitychange', visibilityHandler);

    // -------------------------------------------------------------------------
    // Event Handler Tombol Cepat & Baris Transaksi
    // -------------------------------------------------------------------------
    const btnAddTx = container.querySelector('#dash-btn-add-tx');
    const emptyAddBtn = container.querySelector('#dash-empty-add-btn');
    const btnKategori = container.querySelector('#dash-btn-kategori');

    function openAddTransaction() {
      if (typeof App !== 'undefined' && App.openScreen) {
        App.openScreen('transaksi');
      }
    }

    if (btnAddTx) btnAddTx.addEventListener('click', openAddTransaction);
    if (emptyAddBtn) emptyAddBtn.addEventListener('click', openAddTransaction);
    if (btnKategori) btnKategori.addEventListener('click', () => {
      if (typeof App !== 'undefined' && App.openScreen) App.openScreen('kategori');
    });

    // Klik transaksi hari ini untuk membuka mode edit
    const txItems = container.querySelectorAll('.list-row[data-id]');
    txItems.forEach(item => {
      const buka = () => {
        if (typeof App !== 'undefined' && App.openScreen) {
          App.openScreen('transaksi', { id: item.dataset.id });
        }
      };
      item.addEventListener('click', buka);
      item.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); buka(); }
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

  // Engine grafik batang canvas murni (tanpa library)
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
    const height = 160;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    // Bersihkan canvas (surface-alt)
    ctx.fillStyle = '#F0F7FB';
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

    // Garis grid (line-soft #CFE2EE)
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

    // Batang flat/kotak (radius 0 sesuai DESIGN.md)
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

      // Frame garis kuat #163A55
      ctx.strokeStyle = '#163A55';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(x, y, barWidth, Math.max(2, barHeight));

      // Label tanggal di bawah (JetBrains Mono)
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

  // Registrasi layar ke App
  App.registerScreen('beranda', {
    title: 'Beranda',
    render: renderDashboardScreen
  });

})();
