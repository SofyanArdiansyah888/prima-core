# Prompt Gemini — UI aplikasi pemesanan pelanggan PKM Tonasa

Salin seluruh blok di bawah ini ke Gemini. Minta keluaran berupa mockup layar ponsel (lebar 390px) dan, jika diminta kode, JSX Ionic React + class Tailwind. Jangan menghasilkan Flutter, Swift, atau CSS framework lain.

---

Kamu adalah desainer UI mobile untuk aplikasi pemesanan pelanggan PT Prima Karya Manunggal (grup Semen Tonasa). Buat antarmuka ponsel yang terasa industri dan operasional, bukan aplikasi SaaS generik.

## Brand

- Nama aplikasi: Pesan Tonasa
- Warna utama: emerald `#047857` pada tombol, tab aktif, dan harga
- Netral: stone `#fafaf9` latar, `#1c1917` teks, garis `#e7e5e4`, kartu putih
- Judul layar: font serif (Source Serif 4). Teks isi: Source Sans 3. Kode produk dan nomor pesanan: monospace
- Eyebrow kecil di atas judul, huruf kapital, tracking lebar, warna emerald, misalnya "PKM TONASA"
- Jangan pakai gradien ungu, ilustrasi 3D, atau kartu statistik hiasan
- Ikon garis sederhana. Sudut kartu 12px. Bayangan sangat tipis

## Pengguna dan aturan

Pelanggan toko atau proyek memesan sendiri. Bukan staf. Tidak ada kredit B2B, nomor PO, atau pilihan tipe pelanggan.

Dua katalog, dipisah segmen: Semen (satuan Sak) dan Ready Mix (satuan m³). Satu keranjang dan satu pesanan hanya boleh satu kategori. Jika pengguna menambah kategori lain, tampilkan peringatan dan jangan mencampur.

Harga, ongkir, dan PPN 11% dihitung server. Di layar, tampilkan saja hasilnya. Pembayaran: Tunai / Transfer, Virtual Account Mandiri, Virtual Account BRI. Status bayar awal: Menunggu.

## Layar (390 × 844)

1. Masuk — judul "Masuk", field Nomor HP dan Kata sandi, tombol emerald penuh, tautan Daftar.
2. Daftar — Nama, Nomor HP, Email opsional, Kata sandi, Ulangi kata sandi.
3. Katalog (tab) — segmen Semen | Ready Mix. Kartu produk: kode mono, nama, tag kecil, minimal order, harga per satuan. Ikon keranjang di kanan atas dengan angka.
4. Detail produk — judul nama produk, kode, harga besar, slump bila ada, "Cocok untuk …", daftar spesifikasi dua kolom, stepper jumlah yang tidak turun di bawah minimal order, tombol lengket "Masukkan keranjang".
5. Keranjang — daftar item, stepper, hapus, subtotal material, catatan bahwa ongkir dihitung di langkah berikut, tombol "Lanjut antar".
6. Lokasi antar — nama proyek, alamat, chip wilayah Pangkep, Makassar KIMA, Maros, Panakkukang, tombol "Pakai GPS", pilihan pembayaran, catatan, kartu ringkasan: nama plant, kode plant, jarak km, subtotal, ongkir, PPN, total. Tombol "Buat pesanan".
7. Sukses — eyebrow "Pesanan masuk", judul "Menunggu konfirmasi", nomor pesanan mono besar seperti SO-SULSEL-20260900001, tombol "Lihat status".
8. Daftar pesanan (tab) — kartu: kode, badge status, nama proyek, tanggal, total.
9. Detail status — judul nama proyek, kode pesanan, linimasa vertikal: Dikonfirmasi, SPK terbit, Produksi, Sebagian terkirim, Selesai. Langkah yang sudah lewat berwarna emerald. Jika dibatalkan, ganti linimasa dengan pita "Pesanan dibatalkan". Blok alamat, pembayaran, item, total. Tombol "Batalkan pesanan" hanya saat status masih Dikonfirmasi.
10. Profil (tab) — Nama, Nomor HP, Email, Simpan, Keluar.

Tab bawah: Katalog, Pesanan, Profil. Tab aktif emerald.

## Keluaran

Buat mockup untuk kesepuluh layar, berurutan, satu kolom, lebar 390px, latar stone. Setelah mockup, tulis JSX untuk layar katalog dan detail produk memakai komponen Ionic (`IonPage`, `IonHeader`, `IonContent`, `IonTabs`) dan class Tailwind untuk isi kartu, teks, dan tombol. Jangan memakai preflight Tailwind yang menimpa CSS Ionic. Jangan menampilkan id numerik database; identitas yang terlihat adalah `code` dan nomor pesanan.
---
