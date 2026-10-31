# TASK.md — Pembagian Tugas MVP — CatatDuit

Proyek: **CatatDuit** (Pencatat Keuangan PWA) · repo publik: `Curzyori/catatduit`
Acuan: `PRD.md` (v0.3, kebutuhan) + `DESIGN.md` (tampilan) + `AGENTS.md` (aturan kerja agent — wajib dibaca agent kamu sebelum mulai)

| Orang | Peran |
|---|---|
| **Yuken** | Fondasi (store, kerangka, backup) + review semua task |
| **Tri** | UI transaksi + dashboard |
| **Predi** | Kategori + riwayat |

## Cara Kerja (WAJIB dibaca dulu)

1. Urutan: **T1 & T2 (Yuken) harus beres duluan.** Task lain memanggil fungsi `Store` dari T2.
2. Tiap task ada blok "Prompt Hermes" — tinggal copy-paste ke Hermes. Hasil kurang pas? Revisi di situ, jangan edit manual dulu.
3. **Satu orang satu file.** Jangan pernah mengedit file milik orang lain. Butuh data dari file orang lain? Panggil lewat fungsi di kontrak bawah.
4. Semua teks dari data HARUS di-escape sebelum dirender (XSS — aturan PRD bagian 11).
5. Mobile-first, bahasa Indonesia, vanilla JS tanpa framework, tanpa login, tanpa server.
6. Format uang di semua layar: pakai `App.formatRupiah(n)` (dibuat di T1). Jangan bikin format sendiri.
7. **Styling wajib ikut `DESIGN.md`**: radius 0, frame 2px, hard shadow, palet dari token-nya, font Space Grotesk / Inter / JetBrains Mono. Pakai class yang sudah ada di `css/style.css` (dibuat T1), jangan bikin gaya sendiri-sendiri.
8. **Alur git tiap task:** fork `Curzyori/catatduit` → branch baru `t<N>-<nama>` (contoh `t3-form-transaksi`) → commit konvensional (`feat:` / `fix:` / `docs:`) → push ke fork → buka PR ke `main` repo utama, judul `[T3] Nama Task`, deskripsi berisi apa yang dikerjakan + cara tes → review **Yuken** → merge. Dilarang merge PR sendiri, dilarang push langsung ke `main`, dilarang force-push.
9. Aturan lengkap untuk agent kamu ada di `AGENTS.md` — pastikan agent membacanya dulu. Belum di-merge = belum selesai.

## Kontrak Store (dibuat Yuken di `js/store.js` — semua UI panggil ini, jangan sentuh localStorage langsung)

```js
Store.listTransactions()      // -> [tx] urut terbaru di atas
Store.saveTransaction(tx)     // -> tx (id & timestamp diisi otomatis kalau kosong)
Store.deleteTransaction(id)   // ikut menghapus foto struknya kalau ada
Store.listCategories(type)    // -> [kategori], type: "income" | "expense"
Store.saveCategory(kat)       // -> kat (nama harus unik per jenis, case-insensitive)
Store.deleteCategory(id)      // transaksi lama tetap menyimpan categoryName (snapshot)
Store.getSettings()           // -> objek pengaturan
Store.saveSettings(obj)
App.formatRupiah(n)           // -> "Rp 1.250.000"
App.registerScreen(id, { title, render(el, params) })  // layar milik task UI daftar lewat ini
App.openScreen(id, params)    // pindah layar; params diteruskan ke render (mis. edit transaksi dari Riwayat)
```

Bentuk `tx`: `{ id, type, amount, categoryId, categoryName, merchant, note, datetime, source, createdAt, updatedAt }` — `amount` bilangan bulat Rupiah, `datetime` ISO 8601. Kategori: `{ id, name, type, keywords, createdAt }`.

---

## Peta Berkas & Layar (satu pemilik per berkas — anti tabrakan)

Layar TIDAK ditulis di `index.html`. Tiap layar hidup di berkas modul pemiliknya dan
daftar lewat `App.registerScreen`; `app.js` yang memanggil `render` saat navigasi.

| Berkas | Pemilik | Isi |
|---|---|---|
| `index.html`, `css/style.css`, `js/app.js`, `manifest.json`, `sw.js`, `icons/` | **Yuken** (T1) | Cangkang aplikasi, navigasi, tema. Dilarang diedit task lain. |
| `js/store.js` | **Yuken** (T2) | Satu-satunya pintu data (localStorage + IndexedDB). |
| `js/transactions.js` | **Tri** (T3) | `App.registerScreen("transaksi", ...)` — layar Catat Transaksi |
| `js/dashboard.js` | **Tri** (T4) | `App.registerScreen("beranda", ...)` — layar Beranda |
| `js/categories.js` | **Predi** (T5) | `App.registerScreen("kategori", ...)` — layar Kategori |
| `js/history.js` | **Predi** (T6) | `App.registerScreen("riwayat", ...)` — layar Riwayat |
| `js/backup.js` | **Yuken** (T7) | `App.registerScreen("pengaturan", ...)` — layar Pengaturan + backup |
| `vendor/`, `*.md` | **Yuken** | Ubah lewat PR, diskusi dulu. |

## Tugas

### T1 — Kerangka proyek + PWA (F7) — **Yuken**
File: `index.html`, `manifest.json`, `sw.js`, `css/style.css`, `js/app.js`, `icons/`

**Prompt Hermes:**
> Baca PRD.md bagian 8, 9.2, dan 15. Buatkan kerangka aplikasi vanilla JS tanpa framework:
> folder persis seperti bagian 15 PRD (tambah `js/history.js`). Nama aplikasi: **CatatDuit**
> (manifest: name & short_name "CatatDuit"). Isi: manifest.json + sw.js
> yang bikin aplikasi bisa dipasang dan jalan offline setelah kunjungan pertama; js/app.js
> dengan navigasi bilah bawah (Beranda, Riwayat, tombol tengah "+", Laporan, Pengaturan)
> yang menampilkan/menyembunyikan layar tanpa reload; sediakan `App.registerScreen(id,
> { title, render(el, params) })` sebagai tempat task UI mendaftarkan layarnya dan
> `App.openScreen(id, params)` untuk pindah layar (layar yang belum dibuat = placeholder);
> helper global `App.formatRupiah(n)`
> pakai Intl.NumberFormat id-ID currency IDR tanpa desimal; CSS dasar mobile-first nyaman
> dari lebar 360 px, ada variabel warna tema dan dukungan area aman iPhone. Layar tiap
> menu dikosongkan dulu (placeholder), nanti diisi task lain. CSS wajib mengikuti
> DESIGN.md: variabel warna dari paletnya, radius 0 semua, frame 2px, hard shadow
> `6px 6px 0 0 #CFE2EE`, bilah bawah 2px stroke + tombol tengah "+" 56px, kartu
> bergaya struk. Font Space Grotesk / Inter / JetBrains Mono di-copy dari
> `~/workspace/Fonts/Google/` ke `public/fonts/` dan di-load via @font-face
> (font-display: swap), nol CDN. Semua teks dinamis di-escape.

Beres kalau: buka di browser → bisa pindah menu tanpa reload; Lighthouse PWA tidak error; `App.formatRupiah(1250000)` = "Rp 1.250.000"; tampilan cocok dengan DESIGN.md (kotak semua, font lokal termuat, tidak ada request ke CDN).

### T2 — Penyimpanan data (inti F1 & F2) — **Yuken**
File: `js/store.js`

**Prompt Hermes:**
> Baca PRD.md bagian 9 (semua) dan 13. Buat js/store.js persis mengikuti "Kontrak Store"
> di TASK.md. Aturan wajib: uang bilangan bulat Rupiah (tolak nol, negatif, dan di atas
> 999.999.999.999); waktu ISO 8601; id UUID dibuat di sisi klien; semua koleksi punya
> `schemaVersion` 1. Kategori & transaksi & pengaturan di localStorage, foto struk di
> IndexedDB (blob). deleteTransaction ikut menghapus blob fotonya. saveCategory menolak
> nama duplikat per jenis tanpa memedulikan huruf besar/kecil. Saat pertama kali dipakai,
> isi kategori bawaan dari PRD bagian 17 (pengeluaran: Makan, Transport, Belanja, Tagihan,
> Kesehatan, Hiburan, Lainnya; pemasukan: Gaji, Bonus, Usaha, Lainnya) + kata kunci awal
> dari bagian 10. Panggil navigator.storage.persist() saat init. Data yang tidak valid
> ditolak dengan Error berbahasa Indonesia yang jelas.

Beres kalau: simpan → buka ulang tab → data masih ada; duplikat kategori ditolak; hapus transaksi berfoto tidak meninggalkan blob.

### T3 — Form Catat Transaksi (F1) — **Tri**
File: `js/transactions.js`

**Prompt Hermes:**
> Baca DESIGN.md dulu, lalu PRD.md bagian 6 (F1), 7.1, dan 13. Isi layar "Catat Transaksi" di js/transactions.js. Styling pakai class dari css/style.css.
> Data AMBIL & SIMPAN hanya lewat Store.* dari TASK.md — dilarang menyentuh localStorage
> langsung. Form: jenis (pemasukan/pengeluaran), jumlah, kategori (pilihan dari
> Store.listCategories sesuai jenis), tanggal + jam (default sekarang), nama toko opsional,
> catatan opsional. Jumlah: hanya angka bulat positif, tampil sebagai Rupiah saat mengetik;
> nol/negatif/lewat batas → pesan error jelas. Transaksi bisa diedit dan dihapus (hapus
> wajib konfirmasi). Setelah simpan, kembali ke Beranda dan rekap terbaru tanpa reload
> halaman. Tanggal masa depan boleh tapi diberi peringatan. Semua teks di-escape.

Beres kalau: catat pemasukan & pengeluaran muncul di daftar hari ini (Beranda); edit & hapus jalan; input "abc" atau 0 ditolak.

### T4 — Beranda: saldo, jam, grafik (F3 & F4) — **Tri**
File: `js/dashboard.js`

**Prompt Hermes:**
> Baca DESIGN.md dulu, lalu PRD.md bagian 6 (F3, F4) dan 8. Isi layar Beranda di js/dashboard.js, data hanya
> lewat Store.*. Isi: jam real-time (hari, tanggal, jam:menit:detik, update tiap detik,
> tetap akurat saat tab kembali aktif); saldo total; pemasukan & pengeluaran hari ini dan
> bulan ini; grafik batang saldo akhir 7 hari pakai canvas murni tanpa library; daftar
> transaksi hari ini (pakai App.formatRupiah); dua tombol cepat "+ Catat Transaksi" dan
> "Scan Struk" (Scan Struk sementara nonaktif dengan tulisan "segera"). Semua angka uang
> dan teks di-escape. Mobile-first.

Beres kalau: jam jalan tiap detik dan tidak melompat saat tab dipindah; saldo cocok dengan jumlah transaksi yang dibuat di T3; grafik 7 hari tampil.

### T5 — Kategori (F2) — **Predi**
File: `js/categories.js`

**Prompt Hermes:**
> Baca DESIGN.md dulu, lalu PRD.md bagian 6 (F2) dan 13. Isi layar "Kategori" di js/categories.js, data hanya
> lewat Store.*. Fitur: daftar kategori terpisah untuk pemasukan dan pengeluaran; tambah,
> ganti nama, dan hapus; nama harus unik per jenis tanpa memedulikan huruf besar/kecil
> (duplikat → pesan jelas); menghapus kategori yang sudah dipakai boleh — transaksi lama
> tetap menampilkan nama lamanya (ini sudah diurus Store, tinggal panggil); kategori bawaan
> boleh diubah/dihapus. Konfirmasi sebelum hapus. Semua teks di-escape.

Beres kalau: tambah "makan" saat "Makan" ada → ditolak; hapus kategori terpakai → transaksi lama masih baca namanya; kategori hilang dari pilihan form T3.

### T6 — Riwayat + filter + pencarian (F5) — **Predi**
File: `js/history.js`

**Prompt Hermes:**
> Baca DESIGN.md dulu, lalu PRD.md bagian 6 (F5) dan 8. Isi layar "Riwayat" di js/history.js, data hanya lewat
> Store.*. Fitur: daftar transaksi dikelompokkan per tanggal, terbaru di atas; filter
> rentang tanggal, jenis, dan kategori; pencarian pada catatan dan nama toko; tiap baris
> bisa dibuka untuk detail, edit, hapus (konsisten dengan perilaku T3); bisa mencentang
> beberapa transaksi (centangnya cukup disimpan di variabel, belum dipakai apa-apa —
> nanti dipakai laporan). Kosong → tampil pesan ramah "belum ada transaksi". Semua teks
> di-escape. Daftar tetap lancar dengan 5.000 transaksi.

Beres kalau: filter + pencarian kombinasi jalan; hasil kosong tidak error; edit dari riwayat cocok dengan perilaku form.

### T7 — Backup & restore (F6) — **Yuken**
File: `js/backup.js`

**Prompt Hermes:**
> Baca DESIGN.md (bagian dialog) dulu, lalu PRD.md bagian 6 (F6), 7.3, 9.3, 12, dan 13. Buat js/backup.js + bagian backup di
> layar Pengaturan. Buat backup: unduh .json sesuai format bagian 9.3, pilihan dengan /
> tanpa foto struk, catat tanggal backup terakhir. Impor: validasi format dan
> schemaVersion (versi lebih baru → tolak dengan pesan "perbarui aplikasi"); pilihan
> Gabungkan (ID yang sudah ada DILEWATI apa pun isinya — data di perangkat menang) atau
> Timpa semua (konfirmasi + simpan salinan otomatis sebelum menimpa); file rusak/tidak
> dikenal → pesan jelas dan data lama tidak berubah sama sekali. Semua operasi data lewat
> Store.*.

Beres kalau: backup → hapus semua data → impor → data 100% kembali; file acak ditolak tanpa mengubah data lama.

---

## Belum dikerjakan ( tunggu MVP jalan + di-review )

- **Tahap 2:** scan struk + OCR + lampiran foto (F8–F9)
- **Tahap 3:** struk PNG + laporan PDF/Excel (F10–F11)
- **Tahap 4:** pengingat backup + pembelajaran kategori (F12–F13)

Kalau ada ide fitur baru saat ngerjain: TULIS dulu, bahas sama Yuken, baru dikerjakan. Dilarang menambah fitur diam-diam.
