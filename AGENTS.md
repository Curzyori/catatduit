# AGENTS.md — Aturan Kerja untuk AI Agent

Repo: `Curzyori/catatduit` — **CatatDuit**, PWA pencatat keuangan offline.
Vanilla JS tanpa framework, tanpa build step, tanpa server, tanpa login.

Kamu (agent) mengerjakan SATU task dari `TASK.md` untuk satu anggota tim.
Baca urut sebelum melakukan apa pun:

1. `TASK.md` — task kamu, kontrak kode, peta berkas & pemiliknya
2. `DESIGN.md` — semua keputusan tampilan (wajib dipatuhi)
3. `PRD.md` — detail kebutuhan (bagian yang dirujuk task kamu)

## Batas Berkas (MUTLAK)

- Kerjakan HANYA berkas yang tercantum di task kamu. Dilarang mengedit berkas milik task lain.
- Berkas inti `index.html`, `css/style.css`, `js/app.js`, `js/store.js`, `manifest.json`, `sw.js` hanya milik T1/T2 (Yuken). Task UI TIDAK menyentuhnya sama sekali.
- Butuh data atau aksi dari berkas orang lain? Pakai kontrak yang sudah ada (`Store.*`, `App.*`). Yang kamu butuh tidak ada di kontrak? STOP — tulis kebutuhanmu di deskripsi PR, jangan ubah berkas orang lain diam-diam.
- Layar kamu didaftarkan dari berkas modul kamu sendiri lewat `App.registerScreen(id, { title, render })`. `index.html` tidak pernah diedit oleh task UI.

## Kontrak Kode

- Satu-satunya akses data: `Store.listTransactions`, `Store.saveTransaction`, `Store.deleteTransaction`, `Store.listCategories`, `Store.saveCategory`, `Store.deleteCategory`, `Store.getSettings`, `Store.saveSettings`. Dilarang menyentuh `localStorage` / `indexedDB` langsung.
- Uang: bilangan bulat Rupiah, selalu tampil lewat `App.formatRupiah(n)`.
- Semua teks dari data di-escape sebelum dirender (XSS).
- Tanpa framework, tanpa CDN (font dan ikon self-hosted), tanpa emoji sebagai ikon UI, tanpa em-dash di teks UI.
- Styling: pakai class `css/style.css`. Radius 0, frame 2px, hard shadow — detail di `DESIGN.md`.

## Alur Git (tiap task)

1. Fork `Curzyori/catatduit`, clone fork kamu, tambahkan `upstream` ke repo utama.
2. Sinkronkan `main` dari upstream, lalu bikin branch baru: `git checkout -b t<N>-<nama-pendek>` (contoh: `t3-form-transaksi`). WAJIB branch baru per task.
3. Commit kecil-kecil dengan Conventional Commits: `feat:`, `fix:`, `docs:`, `style:`. Contoh: `feat: form catat transaksi (T3)`.
4. Push branch ke fork kamu, lalu buka PR ke `main` repo utama. Judul: `[T3] Form Catat Transaksi`. Deskripsi wajib berisi: apa yang dikerjakan + cara mengujinya.
5. Reviewer: **Yuken**. JANGAN merge PR sendiri. JANGAN pernah push langsung ke `main`. JANGAN force-push.
6. Dapat catatan review? Perbaiki di branch yang sama, push ulang, PR otomatis ter-update.

> **Kebijakan merge:** PR yang lolos review di-**merge langsung** (commit kontributor tetap tercatat sebagai contributor). Perbaikan kecil pasca-review = **commit lanjutan di branch PR yang sama**, bukan menulis ulang berkasnya di repo utama — jangan buang kredit commit kontributor.

## Aturan Tambahan

- Kalau perubahanmu mengubah perilaku yang tertulis di `PRD.md`, perbarui bagian itu di PR yang sama (commit `docs:`).
- Kalau repo punya `graphify-out/`: pahami proyek pakai skill graphify, dan sebelum memperbaiki/ menyentuh kode, cari yang berhubungan dulu dengan `graphify query`.
- Dilarang menulis API key, token, atau secret apa pun di kode. Kalau kelak perlu konfigurasi rahasia, baca dari environment variable dan jangan pernah pakai nilai fallback.
- Jangan asal tempel perbaikan: pahami dulu penyebabnya, perbaiki di akar masalah. Kalau ada dua cara yang sama benarnya, pilih yang lebih sederhana.
- Teks UI bahasa Indonesia, santai tapi jelas. Ikon pakai Material Symbols (sudah disiapkan T1), bukan emoji.
- Sebelum mengklaim selesai: jalankan `python -m http.server` di root proyek, buka di browser (ukuran mobile 360px), dan pastikan SEMUA butir "Beres kalau" di task kamu lolos.
