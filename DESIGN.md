# SaucyBites Design Direction

## Identity & Character
- **Product:** SaucyBites: pencatatan tim dan katalog pemesanan langsung untuk usaha kuliner *chicken bites* bersaus & minuman manis.
- **Audience:** Pelanggan kuliner (mahasiswa, pengunjung bazar/event, pemesan pesan-antar via WhatsApp) dan tim operasional SaucyBites.
- **Personality:** Hangat, jujur, lugas seperti papan menu kedai makanan rumahan yang rapi. Tanpa klaim berlebihan dan tanpa dekorasi korporat/SaaS.
- **Identity Motif:** Papan menu beraksen kertas hangat (`#f7f7f2` & `#fff2dc`), tipografi angka tabular (`tabular-nums`) untuk seluruh harga/kuantitas, Monogram inisial menu pada kotak berlatar krem bila foto belum diunggah, serta struk ringkasan pesanan langsung.

## Dials
- `Dial: ENERGY 2 / RHYTHM 2 / MOTION 1`
  - **ENERGY 2 (Balanced):** Kontras tegas antara header hijau tua (`#21362c`), kertas hangat (`#f7f7f2`), dan satu aksen merah saus (`#d83c2d`) pada aksi utama.
  - **RHYTHM 2 (Consistent with purposeful breaks):** Tata letak 2 kolom asimetris di desktop (daftar menu di kiri, kertas struk pesanan langsung di kanan) sehingga halaman tidak menjadi deretan kartu seragam dari atas ke bawah.
  - **MOTION 1 (Calm):** Transisi hanya pada interaksi nyata (hover tombol dan buka/tutup laci keranjang di layar kecil), tanpa animasi berulang.

## Color Palette (3 Core + 1 Accent)
1. **Paper Base (Core 1):** `#f7f7f2` (latar halaman) dan `#ffffff` (permukaan kartu/panel), dengan variasi hangat `#fff2dc` untuk blok ringkasan.
2. **Forest Ink (Core 2):** `#21362c` (hijau tua khas SaucyBites untuk masthead, tombol sekunder utama, dan teks judul) serta `#222b25` (teks utama).
3. **Sage Muted (Core 3):** `#52614f` (teks sekunder dengan rasio kontras > 5.5:1 di atas putih maupun `#f7f7f2`) dan `#e7e9e2` (garis pembatas).
4. **Chili Sauce Red (Deliberate Accent):** `#d83c2d` (hover `#b72c20`), hanya digunakan untuk penanda merek dan tombol aksi utama penambahan menu.

## Radius & Elevation System
- **Panel / Kartu Menu / Struk:** `16px` (`rounded-2xl`), batas tegas `1px solid #e7e9e2`, tanpa bayangan mengambang di setiap kartu.
- **Tombol, Input, dan Pilihan Kategori:** `9px` (`rounded-[9px]`), tinggi minimal `44px` (`min-h-11`) untuk target sentuh yang nyaman di layar ponsel.
- **Label Status Stok:** `5px` (`rounded-[5px]`), hanya digunakan untuk status stok fungsional (`Tersedia`, `Stok terbatas`, `Habis`).
