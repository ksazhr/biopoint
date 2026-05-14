# Cara Menjalankan Proyek Biopori di Laptop

Proyek ini dibangun menggunakan **Node.js (Express + React)**, bukan PHP/Laravel. Jadi kamu tidak butuh XAMPP atau `php artisan serve`.

## Persiapan
1. **Install Node.js**: Pastikan laptopmu sudah terpasang Node.js (download di nodejs.org).
2. **Ekstrak File**: Masukkan semua file codingan ke dalam satu folder.

## Cara Menjalankan
1. Buka **Terminal** atau **CMD** di dalam folder tersebut.
2. Jalankan perintah untuk menginstall library (wajib):
   ```bash
   npm install
   ```
3. Jalankan aplikasi:
   ```bash
   npm run dev
   ```
4. Buka browser dan akses: `http://localhost:3000`

## Solusi Layar Putih (Blank)
Jika layar masih putih atau muncul error "points.map is not a function":
1. **Periksa Terminal**: Lihat jendela CMD/Terminal tempat kamu menjalankan `npm run dev`. Apakah ada tulisan `JSON Parse Error` atau `Read File Error`?
2. **Reset Data**: Jika datanya rusak, hapus file `biopori_data.json` di folder proyek, lalu restart `npm run dev`. File baru yang bersih akan dibuat otomatis.
3. **Penyebab Umum**: Pastikan kamu tidak membuka file `.json` tersebut dan mengisinya dengan format yang salah. Isinya harus berupa kurung siku `[]` jika kosong.

## Di Mana Datanya Disimpan?
Semua titik biopori yang kamu buat akan tersimpan di file otomatis bernama `biopori_data.json` di folder proyekmu. Jangan menghapus file ini jika ingin datanya tetap ada.
