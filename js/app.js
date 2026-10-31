/* CatatDuit — cangkang aplikasi (T1).
   App global: registrasi layar, navigasi, helper. Modul layar di-load dinamis
   supaya index.html tidak pernah disentuh task UI (lihat TASK.md). */
(function () {
  'use strict';

  const NAV_IDS = ['beranda', 'riwayat', 'transaksi', 'laporan', 'pengaturan'];
  const MODULES = ['js/store.js', 'js/transactions.js', 'js/dashboard.js', 'js/categories.js', 'js/history.js', 'js/backup.js'];

  const App = {
    _screens: new Map(),
    _current: null,

    esc(s) {
      return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => (
        { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
      ));
    },

    formatRupiah(n) {
      return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);
    },

    /* Layar: App.registerScreen('transaksi', { title, render(el, params) }) */
    registerScreen(id, def) {
      if (!id || typeof def.render !== 'function') throw new Error('registerScreen butuh id dan render(el, params)');
      this._screens.set(id, { id, title: def.title || id, render: def.render });
    },

    openScreen(id, params) {
      const layar = this._screens.get(id);
      if (!layar) return;
      const wadah = document.getElementById('screens');
      let el = document.getElementById('layar-' + id);
      if (!el) {
        el = document.createElement('section');
        el.id = 'layar-' + id;
        el.className = 'screen';
        wadah.appendChild(el);
      }
      if (this._current) this._current.el.classList.remove('is-active');
      el.classList.add('is-active');
      this._current = { id, el };
      el.innerHTML = '<h1>' + this.esc(layar.title) + '</h1>';
      layar.render(el, params || {});
      document.querySelectorAll('.bottom-nav [data-screen]').forEach((b) => {
        if (b.dataset.screen === id) b.setAttribute('aria-current', 'page');
        else b.removeAttribute('aria-current');
      });
      document.title = layar.id === 'beranda' ? 'CatatDuit' : 'CatatDuit — ' + layar.title;
      window.scrollTo(0, 0);
    },

    toast(pesan) {
      const lama = document.querySelector('.toast');
      if (lama) lama.remove();
      const t = document.createElement('div');
      t.className = 'toast';
      t.setAttribute('role', 'status');
      t.textContent = pesan;
      document.body.appendChild(t);
      setTimeout(() => t.remove(), 3000);
    },

    _loadModule(src) {
      return new Promise((resolve) => {
        const s = document.createElement('script');
        s.src = src;
        s.onload = () => resolve(true);
        s.onerror = () => resolve(false); // modul belum ada = task lain belum merge
        document.head.appendChild(s);
      });
    },

    _placeholders() {
      for (const id of NAV_IDS) {
        if (this._screens.has(id)) continue;
        this.registerScreen(id, {
          title: id.charAt(0).toUpperCase() + id.slice(1),
          render(el) {
            const d = document.createElement('div');
            d.className = 'empty';
            d.textContent = 'Layar ini sedang dibangun.';
            el.appendChild(d);
          },
        });
      }
    },

    _wireNav() {
      document.querySelectorAll('.bottom-nav [data-screen]').forEach((b) => {
        b.addEventListener('click', () => this.openScreen(b.dataset.screen, {}));
      });
    },

    _registerSW() {
      if (!('serviceWorker' in navigator)) return;
      if (location.protocol !== 'https:' && !['localhost', '127.0.0.1'].includes(location.hostname)) return;
      navigator.serviceWorker.register('./sw.js').catch(() => {});
    },

    init() {
      this._wireNav();
      this._placeholders();
      Promise.all(MODULES.map((m) => this._loadModule(m))).then(() => {
        const idAwal = (location.hash || '').replace('#', '').trim();
        const tujuan = idAwal && this._screens.has(idAwal) ? idAwal : 'beranda';
        this.openScreen(tujuan, {});
        document.body.setAttribute('data-app-ready', 'true');
        this._registerSW();
      });
      window.addEventListener('hashchange', () => {
        const id = (location.hash || '').replace('#', '').trim();
        if (id && this._screens.has(id)) this.openScreen(id, {});
      });
    },
  };

  window.App = App;

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => App.init());
  else App.init();
})();
