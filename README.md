# SaucyBites — Next.js source code

Aplikasi pencatatan bersama untuk Chicken Bites Teriyaki, Chicken Bites BBQ, dan Milky Chocolate. Source ini memakai **Next.js App Router + React + TypeScript**, API Route Handlers, dan SQLite pada server Node.js.

## Mulai di VS Code

1. Instal Node.js **22.13 atau lebih baru** (disarankan Node.js 24 LTS).
2. Ekstrak ZIP, lalu buka folder `SaucyBites-NextJS` di VS Code.
3. Buka terminal di folder tersebut:

```sh
npm ci
npm run db:init
npm run dev
```

4. Buka **http://localhost:3000**. Di mode development, aplikasi otomatis mendeteksi peran sebagai **👑 Owner (Pemilik)**.
5. Isi bahan → resep/harga jual → arus uang → penjualan. Angka harga dan takaran awal sengaja kosong.

`node:sqlite` bawaan Node dapat menampilkan peringatan experimental; ini bukan error instalasi. Tidak perlu memasang database secara terpisah.

## Autentikasi: Owner (Pemilik) & Anggota Tim

Aplikasi mendukung peran terpisah:
- **👑 Owner (Pemilik)**: Memiliki akses penuh termasuk pengaturan persentase bagi laba tim, penyetoran modal usaha, penarikan dana/laba, serta manajemen resep menu.
- **👥 Anggota Tim**: Berfokus pada operasional kasir penjualan, pencatatan pembelian bahan, dan biaya harian.

Salin `.env.example` menjadi `.env.local` (bisa melalui File Explorer/VS Code). Isi:

```env
DATABASE_PATH=./data/saucybites.sqlite
OWNER_ACCESS_PASSWORD=owner123
TEAM_ACCESS_PASSWORD=tim123
SESSION_SECRET=saucybites-dev-secret-key-at-least-32-chars-long
```

Di mode **development**, password default sudah tersedia (`owner123` untuk Owner dan `tim123` untuk Anggota) dengan tombol login cepat 1-klik di halaman `/login`.

Di **production**, ubah `OWNER_ACCESS_PASSWORD`, `TEAM_ACCESS_PASSWORD`, dan buat `SESSION_SECRET` acak baru minimal 32 karakter melalui:

```sh
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

## Deploy ke Vercel (dengan Turso Cloud SQLite)

Vercel menggunakan serverless functions tanpa penyimpanan file persisten lokal. Proyek ini sudah terintegrasi dengan **Turso** (Cloud SQLite gratis), sehingga seluruh data transaksi dan akun tersimpan permanen di cloud.

1. **Buat database di Turso** (Gratis di [turso.tech](https://turso.tech)):
   - Login ke dashboard Turso, klik **Create Database** (beri nama misalnya `saucybites`).
   - Atau lewat CLI: `turso db create saucybites`.
   - Dapatkan **Database URL** (`libsql://saucybites-...turso.io`) dan **Auth Token**.
2. **Inisialisasi tabel di Turso**:
   - Isi `TURSO_DATABASE_URL` dan `TURSO_AUTH_TOKEN` di `.env.local`, lalu jalankan:
     ```sh
     npm run db:init
     ```
   - *Catatan: Aplikasi juga otomatis membuat tabel yang diperlukan saat pertama kali dijalankan.*
3. **Deploy di Vercel**:
   - Push commit terbaru Anda ke repository GitHub:
     ```sh
     git push origin main
     ```
   - Di [Vercel Dashboard](https://vercel.com), klik **Add New Project** → pilih repository `SaucyBites-NextJS`.
   - Di bagian **Environment Variables**, tambahkan:
     - `TURSO_DATABASE_URL` = URL database Turso Anda
     - `TURSO_AUTH_TOKEN` = Token autentikasi Turso
     - `OWNER_ACCESS_PASSWORD` = Password login Owner
     - `TEAM_ACCESS_PASSWORD` = Password login Anggota Tim
     - `SESSION_SECRET` = String acak minimal 32 karakter
   - Klik **Deploy**!

## Alternatif: Production di Server Node.js / VPS

Jika ingin memakai file SQLite lokal tanpa Turso, tempatkan aplikasi pada server dengan disk persisten (seperti VPS atau Railway):

```sh
npm run db:init
npm run build
npm start
```

## Memindahkan data dari aplikasi online

Website online dan proyek ini menggunakan database terpisah. Source ZIP tidak berisi data keuangan, cookie, password, atau kunci dari website online.

1. Di website online, klik **Cadangan** untuk mengunduh JSON.
2. Hentikan server lokal dan jalankan `npm run db:init` untuk database kosong.
3. Impor file itu:

```sh
npm run db:import -- "C:/Users/Nama/Downloads/SaucyBites-cadangan-2026-10-11.json"
```

Contoh Linux/macOS:

```sh
npm run db:import -- /home/nama/Downloads/SaucyBites-cadangan-2026-10-11.json
```

Impor memvalidasi data dan mempertahankan snapshot harga/HPP transaksi. Impor ditolak jika database sudah memiliki catatan, agar tidak menggandakan transaksi atau menimpa data. Jika ingin mengimpor ke ruang baru, ubah DATABASE_PATH ke file baru lalu jalankan db:init dan db:import lagi. Riwayat aktivitas lama tidak disalin; transaksi dan nama pencatatnya tetap dipertahankan.

## Pembaruan UI — 11 Oktober 2026

Layout memakai grid, ukuran kontrol, dan jarak yang konsisten. Panel berdampingan memiliki tinggi sebaris; tombol resep berada di bagian bawah kartu; label/input formulir sejajar; nominal tabel rata kanan; dialog terpusat; dan navigasi berubah menjadi menu geser pada tablet/HP.

Untuk memperbarui proyek yang sudah lu jalankan, salin hanya `app/globals.css` dan `app/team-app.tsx` dari ZIP ini ke proyek lokal, lalu jalankan kembali `npm run dev`. Kedua file ini tidak mengubah database atau konfigurasi login. Simpan modifikasi UI buatan lu sebelum mengganti file.

## Peta file untuk modifikasi

| File | Isi / tempat mengedit |
| --- | --- |
| `app/team-app.tsx` | Tampilan utama, navigasi, formulir, dashboard, polling, ekspor |
| `app/globals.css` | Warna, font, layout, breakpoint HP/tablet/desktop |
| `app/model.ts` | Menu awal, HPP, laba, saldo, BEP |
| `app/api/records/route.ts` | GET/POST/DELETE, penyimpanan, snapshot HPP, konflik revisi |
| `lib/validation.ts` | Validasi nama, harga, jumlah, resep, tanggal |
| `lib/database.ts` | Koneksi SQLite dan transaksi atomik |
| `migrations/0001_initial.sql` | Struktur tabel awal |
| `lib/auth.ts`, `lib/session.ts` | Pengecekan login, cookie, signature session |
| `app/login/page.tsx` | Form login dan Server Action |
| `app/logout/route.ts` | Keluar dari session |
| `scripts/db-init.mjs` | Inisialisasi database dan pencatatan migrasi |
| `scripts/import-backup.ts` | Impor cadangan JSON |
| `tests/core.test.mjs`, `scripts/run-tests.mjs` | Pengujian bisnis, database, dan session |

Contoh perubahan:

- **Warna utama:** ubah variabel `--red`, `--green`, `--bg` pada `app/globals.css`.
- **Nama aplikasi / metadata:** edit `app/layout.tsx` dan bagian brand pada `app/team-app.tsx`.
- **Menu awal:** edit `menu` pada `app/model.ts`; ID harus unik.
- **Tambah kolom pencatatan:** ubah formulir, schema validasi, API, dan rumus/report yang menggunakan nilai itu.
- **Ubah database:** edit adapter/query server; UI mengandalkan `/api/records` dengan bentuk JSON yang sama.

Kode sudah diformat dengan Prettier supaya nyaman dibaca dan dikembangkan. UI utama masih satu Client Component agar mudah menelusuri source; lu dapat memecah dashboard, formulir, dan daftar transaksi menjadi komponen terpisah setelah memahami alurnya.

## Fitur & batasan

- Bahan/kemasan: biaya per g, ml, pcs; resep per porsi; harga jual dan target.
- Kasir: satu jenis menu per transaksi, jumlah, diskon total, Tunai/QRIS.
- HPP/harga disimpan saat transaksi dibuat agar laporan lama stabil.
- Modal, pembelian bahan, biaya operasional, peralatan, penarikan dana.
- Kerugian stok nonkas mengurangi laba tanpa mengurangi saldo lagi.
- BEP memakai biaya operasional tercatat dan komposisi target menu.
- Bagi laba berupa simulasi; pembayaran dicatat manual.
- Data bersama dengan refresh otomatis 15 detik dan perlindungan konflik revisi.
- Pembatalan berupa soft delete; catatan keuangan dan aktivitas disimpan atomik.
- Ekspor CSV dan cadangan JSON. Aplikasi tidak menyimpan antrean transaksi offline.
- Satu ruang/database untuk satu event atau periode. Tidak ada peran admin/kasir terpisah, inventaris jumlah stok, piutang/utang pemasok, atau pajak otomatis.

## Validasi

```sh
npm test
npm run typecheck
npm run build
npm run format
```

`npm test` memakai database sementara, tidak mengubah database usaha kalian.

## Perbedaan dengan source website Sites

Tampilan dan perhitungan diambil dari aplikasi SaucyBites yang dibuat sebelumnya. Runtime Vinext/Cloudflare D1 dan sign-in ChatGPT sudah diganti dengan Next.js native, SQLite lokal server, dan session password tim supaya proyek ini bisa dijalankan mandiri. Konfigurasi hosting, kredensial, dan database Site online tidak disertakan. Modifikasi source ini tidak otomatis mengubah Site online.

Referensi teknis:

- https://nextjs.org/docs/app
- https://nodejs.org/docs/latest-v24.x/api/sqlite.html
"# SaucyBites-NextJS" 
