# CatatDuit

Pencatat keuangan pribadi berbentuk PWA: jalan penuh di browser, bisa dipasang ke layar utama, tanpa akun dan tanpa server. Semua data — termasuk foto struk — tersimpan di perangkat kamu.

**Status: dalam pengembangan.** Kode aplikasi menyusul; repo ini saat ini berisi rencana yang sudah final: PRD, pembagian tugas, dan design system (lihat [Dokumen](#dokumen)). Progres dipantau lewat [TASK.md](TASK.md).

## Kenapa CatatDuit

- **Datamu tetap milikmu.** Tidak ada login, tidak ada server, tidak ada pelacak. Catatan hidup di `localStorage` + `IndexedDB` perangkat, dan bisa dibackup ke berkas JSON kapan saja.
- **Cepat dipakai.** Catat transaksi manual dalam hitungan detik — form sesimpel mungkin dengan kategori yang bisa kamu atur sendiri.
- **Scan struk, di perangkat.** Cukup foto struk, OCR berjalan lokal (Tesseract.js) lalu kamu konfirmasi sebelum tersimpan. Tanpa mengirim foto ke mana pun.
- **Nyaman dibawa.** Mobile-first, jalan offline setelah kunjungan pertama, laporan PDF/Excel untuk penggunaan lanjutan.

## Yang dibangun

**MVP:** transaksi (CRUD), kategori, dashboard (saldo + grafik 7 hari + jam real-time), riwayat dengan filter dan pencarian, backup/impor JSON, PWA dapat dipasang.

**Setelah MVP:** scan struk + OCR + lampiran foto, struk gambar PNG, laporan PDF/Excel, pengingat backup.

Detail kebutuhan ada di [PRD.md](PRD.md).

## Jalankan & Pasang

Aplikasi ini sudah **LIVE**: **[catatduit-dm85.vercel.app](https://catatduit-dm85.vercel.app/)** — buka di browser HP kamu lalu pilih **"Tambahkan ke Layar Utama" (Install PWA)**.

Untuk menjalankan lokal:
```bash
git clone https://github.com/Curzyori/catatduit.git
cd catatduit
python -m http.server 8000
# buka http://localhost:8000
```

## Kontribusi

Kontributor dipersilakan, dengan dua aturan baca dulu:

1. [TASK.md](TASK.md) — ambil satu task, kerjakan sesuai spesifikasinya.
2. [AGENTS.md](AGENTS.md) — aturan kerja (batas berkas, kontrak kode, alur git). Wajib juga untuk kamu yang mengerjakan dengan bantuan AI agent.

Alurnya: fork → branch baru per task (`t<N>-<nama>`) → commit konvensional → PR ke `main` → review → merge. Konvensi tampilan mengikuti [DESIGN.md](DESIGN.md).

## Dokumen

| Dokumen | Isi |
|---|---|
| [PRD.md](PRD.md) | Kebutuhan produk lengkap (v0.3) |
| [DESIGN.md](DESIGN.md) | Design system Semi Pixel-Art (light) |
| [TASK.md](TASK.md) | Pembagian tugas MVP + peta kepemilikan berkas |
| [AGENTS.md](AGENTS.md) | Aturan kerja untuk kontributor & AI agent |

Lisensi: [MIT](LICENSE).
