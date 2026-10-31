---
version: alpha
name: CatatDuit Semi Pixel-Art (Light)
description: Light receipt-paper design system for the CatatDuit PWA. Ink on a clean mist canvas, current blue accent, pixel-art shape language with hard offset shadows, receipt-paper cards, tabular mono amounts.

colors:
  primary: "#072033"
  secondary: "#3B5A70"
  background: "#F7FAFC"
  surface: "#FFFFFF"
  surface-alt: "#F0F7FB"
  stroke: "#D9E5ED"
  text: "#072033"
  text-muted: "#3B5A70"
  accent: "#0369A1"
  accent-hover: "#075985"
  on-accent: "#FFFFFF"
  accent-muted: "rgba(3, 105, 161, 0.12)"
  success: "#0F766E"
  warning: "#9A3412"
  danger: "#BE123C"
  line-strong: "#163A55"
  line-soft: "#CFE2EE"
  paper: "#FFFDF7"
  paper-shade: "#F3EBDD"

typography:
  display:
    fontFamily: Space Grotesk
    fontSize: 2rem
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "-0.03em"
  h2:
    fontFamily: Space Grotesk
    fontSize: 1.5rem
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  h3:
    fontFamily: Space Grotesk
    fontSize: 1.25rem
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: "-0.01em"
  body:
    fontFamily: Inter
    fontSize: 1rem
    fontWeight: 400
    lineHeight: 1.6
  caption:
    fontFamily: Inter
    fontWeight: 500
    fontSize: 0.875rem
    lineHeight: 1.5
  amount:
    fontFamily: JetBrains Mono
    fontSize: 1rem
    fontWeight: 500
    lineHeight: 1.4

spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 40px
  xxl: 64px

rounded:
  all: 0px

shadows:
  drop: "6px 6px 0 0 #CFE2EE (no blur)"
  drop-hover: "8px 8px 0 0 #0369A1 + translate(-2px, -2px)"

---

# CatatDuit: Design Specification (Semi Pixel-Art, Light)

Design system untuk aplikasi PWA CatatDuit: pencatat keuangan offline,
mobile-first, tanpa login dan tanpa server. Bahasa bentuknya pixel art:
semua sudut kotak (radius 0), frame 2px bertangga, bayangan offset keras tanpa
blur, dan pembatas garis putus-putus. Motif khas aplikasi adalah kertas struk:
kartu ringkasan digambar seperti nota dengan tepi bergerigi.

## Identity

Kanvas terang bersih dengan tinta gelap untuk teks dan satu aksen biru untuk
interaksi. Tidak ada kanvas gelap, tidak ada neon, tidak ada glassmorphism.
Identitas visualnya "nota yang tertata": kertas putih bersih, garis tegas,
angka yang rapi dalam huruf monospace, dan aksen biru hanya untuk hal yang
bisa ditekan.

## Hard Rules

1. **Light-only.** Tidak ada mode gelap dan tidak ada permukaan gelap sama sekali.
2. **Semua sudut kotak.** Radius 0 di semua komponen; frame 2px; bayangan selalu
   offset keras tanpa blur. Tidak ada glow, tidak ada blur kaca.
3. **Aksen aman untuk teks.** `#0369A1` lolos 4.5:1 di atas putih, boleh untuk
   tautan, label, dan ikon. Teks di atas bidang aksen selalu putih (5.6:1).
4. **Angka uang monospace.** Semua jumlah memakai JetBrains Mono dengan angka
   tabular, diformat `App.formatRupiah` (contoh `Rp 1.250.000`). Pemasukan
   diberi tanda `+` berwarna success, pengeluaran `-` berwarna danger.
5. **Font self-hosted saja**: Space Grotesk (600/700), Inter (400-700),
   JetBrains Mono (400/500/700), Material Symbols Rounded sebagai berkas woff2
   lokal. Nol permintaan font ke CDN.
6. **Nol emoji sebagai ikon UI**; tanpa em-dash di teks UI.

## Palette

| Token | Nilai | Peran |
| --- | --- | --- |
| background | `#F7FAFC` | Kanvas halaman (kabut terang) |
| surface | `#FFFFFF` | Kartu, dialog, baris daftar |
| surface-alt | `#F0F7FB` | Chip, kontainer sekunder, area grafik |
| stroke | `#D9E5ED` | Border 2px dan pembatas |
| text / primary | `#072033` | Judul, isi, angka (15.5:1) |
| text-muted / secondary | `#3B5A70` | Teks sekunder, metadata (6.6:1) |
| accent | `#0369A1` | Interaksi: tombol, tautan, fokus (5.6:1) |
| accent-hover | `#075985` | State hover (6.8:1) |
| on-accent | `#FFFFFF` | Label di atas tombol aksen |
| accent-muted | `rgba(3, 105, 161, 0.12)` | Latar chip aktif dan highlight lembut |
| success | `#0F766E` | Pemasukan dan status positif (4.9:1) |
| warning | `#9A3412` | Peringatan, error validasi non-fatal (7.3:1) |
| danger | `#BE123C` | Pengeluaran dan aksi merusak (5.9:1) |

| line-strong | `#163A55` | Frame tegas 2px dan garis aktif (13.6:1) |
| line-soft | `#CFE2EE` | Pembatas putus-putus, garis grid, bayangan jatuh |
| paper | `#FFFDF7` | Latar kartu struk (khas) |
| paper-shade | `#F3EBDD` | Tepi bergerigi kertas struk |

Bahasa bentuk pixel: frame 2px bertangga (digambar dengan 4 hard box-shadow),
bayangan offset keras tanpa blur, radius 0 di semua komponen.

## Typography

Space Grotesk 700 untuk judul (display, h2, h3, letter-spacing -0.03em),
Inter untuk isi dan kontrol, JetBrains Mono untuk angka uang, jam real-time,
dan angka laporan (selalu `font-variant-numeric: tabular-nums`). Semua font
self-hosted woff2 di `public/fonts/`, dimuat dengan `font-display: swap`.

## Components

- **Bilah bawah (navigasi)**: menempel di dasar layar, latar `#FFFFFF`, garis
  atas 2px `#D9E5ED`, lima slot: Beranda, Riwayat, tombol tengah, Laporan,
  Pengaturan. Item aktif berwarna aksen dengan garis bawah 2px `line-strong #163A55`.
  Target sentuh minimal 48px, menghormati `safe-area-inset-bottom`.
- **Tombol tengah (+)**: 56px persegi, latar aksen, label `#FFFFFF`, frame 2px
  `#163A55`, bayangan jatuh 6px. Selalu berada di tengah bilah bawah.
- **Tombol aksi**: primary = tinta `#072033` dengan label `#FFFFFF`; aksen =
  `#0369A1` dengan label `#FFFFFF`; ghost = transparan dengan border 2px dan
  teks aksen. Semua radius 0, bayangan `6px 6px 0 0 #CFE2EE`; hover menjadi
  `8px 8px 0 0 #0369A1` plus geser -2px. Spacing antar tombol memakai skala
  `sm`/`md`.
- **Kartu struk (khas)**: kartu bergaya nota, latar `paper #FFFDF7`, tepi atas
  dan bawah bergerigi setinggi 8px dengan warna `paper-shade #F3EBDD`, frame
  2px `line-strong #163A55`, bayangan jatuh. Dipakai untuk ringkasan harian, pratinjau
  struk gambar, dan dialog konfirmasi penting. Judul Space Grotesk, angka
  JetBrains Mono.
- **Baris transaksi**: latar `#FFFFFF`, pembatas putus-putus `line-soft #CFE2EE`,
  tinggi sentuh 48px. Kategori tampil sebagai chip kecil; jumlah rata kanan
  monospace tabular: `+` success untuk pemasukan, `-` danger untuk
  pengeluaran.
- **Chip kategori**: latar `#F0F7FB`, border 2px, teks aksen, radius 0;
  hover memakai `accent-muted`. Dipakai juga untuk filter di Riwayat.
- **Form dan input**: tinggi 48px, latar putih, border 2px `#D9E5ED`, radius
  0. Fokus: border `#163A55` plus outline 2px aksen dengan offset 2px. Error
  validasi: border danger dan caption `#9A3412`. Label selalu terlihat,
  tidak pernah placeholder-saja.
- **Grafik 7 hari**: canvas, batang bertangga tanpa radius berwarna aksen di
  atas lintang `#F0F7FB`, garis bantu grid 2px `line-soft #CFE2EE`, label angka mono.
- **Jam real-time**: JetBrains Mono, warna `#3B5A70`, format
  `Hari, 31 Okt 2026 - 09:41:07`, perbarui tiap detik.
- **Dialog dan toast**: latar putih, frame 2px `line-strong #163A55`, bayangan jatuh;
  dialog berbahaya (hapus) memakai tombol danger `#BE123C`. Toast muncul di
  atas bilah bawah, auto-tutup 3 detik.
- **Empty state**: border putus-putus 2px `#D9E5ED`, caption `#3B5A70`,
  satu tombol aksi utama. Dipakai saat daftar transaksi atau hasil pencarian
  kosong.
- **Ikon**: Material Symbols Rounded, self-hosted, mewarisi `currentColor`,
  dekoratif memakai `aria-hidden="true"`.
- **Layout halaman**: konten maksimum 480px di tengah untuk mobile-first;
  padding layar memakai skala `md`/`lg`; breakpoint `sm 640px`, `md 768px`,
  `lg 1024px` hanya untuk melebarkan konten, tanpa mengubah pola navigasi.

## Motion

Satu easing `cubic-bezier(0.16, 1, 0.3, 1)` untuk semuanya, durasi 300ms.
Tekan tombol = geser 2px mengikuti bayangan. `prefers-reduced-motion`
mematikan semua transisi. Tanpa parallax, tanpa scroll-hijack, satu animasi
masuk per layar.

## Accessibility

Target WCAG AA di semua pasangan teks/latar (tinta di putih 15.5:1, aksen di
putih 5.6:1); fokus selalu terlihat: outline 2px aksen dengan offset 2px.
Target sentuh minimal 44x44px, lantai lebar 360px tanpa scroll horizontal.
Warna bukan satu-satunya penanda: pemasukan dan pengeluaran selalu diberi
tanda `+`/`-` dan label jenis di detail.

## Voice & Tone

Bahasa Indonesia, santai tapi jelas: perintah singkat tanpa kata hiperbolik.
Contoh: "Catat pengeluaran", "Backup data kamu", "Data tetap di perangkat".
Tanpa emoji, tanpa em-dash, tanpa jargon teknis di layar pengguna.

## Logo & Ikon Aplikasi

Logo dan ikon PWA disediakan terpisah sebagai aset PNG (192px, 512px, dan
varian maskable) oleh pemilik proyek, bergaya pixel art persegi yang tetap
terbaca pada 48px. Spesifikasi ini tidak mengatur isi logo, hanya konteksnya:
palet di atas, bentuk persegi, tanpa gradien.

## Do's and Don'ts

### Do
- Jaga kanvas tetap bersih: kartu putih di atas `#F7FAFC`, frame tegas, cukup
  ruang kosong dengan skala spacing `lg`/`xl`.
- Pakai aksen hanya untuk interaksi: tombol, tautan, fokus, state aktif.
- Pakai `surface-alt` untuk mengelompokkan dan memberi tint status.
- Tampilkan angka uang selalu monospace tabular dengan tanda `+`/`-`.

### Don't
- Tanpa kanvas gelap, glow neon, bayangan blur, atau efek kaca.
- Tanpa emoji sebagai ikon; tanpa em-dash di teks UI.
- Tanpa font CDN; tanpa rounded selain 0.
