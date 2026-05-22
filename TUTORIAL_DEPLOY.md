# Panduan Deploy & Hosting - Sekretariat OSIM (Express + WhatsApp Bot + Firebase)

Dokumen ini menjelaskan mengapa aplikasi Anda **tidak bisa masuk/login saat dideploy di Vercel**, serta memberikan panduan lengkap untuk melakukan deploy ke platform alternatif yang mendukung aplikasi ini secara gratis/murah (seperti **Render.com** atau **Railway.app**).

---

## 🔍 Mengapa Muncul Error "Unexpected token '<'" & Gagal Login di Vercel?

Aplikasi Sekretariat OSIM yang Anda buat menggunakan arsitektur **Full-Stack (Backend Express.js + Frontend React + WhatsApp Bot + Firebase)**. 

Ketika dideploy di **Vercel**:
1. **Serverless Platform**: Vercel dirancang untuk situs web statis (React, Vue, HTML) dan Serverless API. Vercel **tidak menjalankan server Node.js secara persisten** (tidak menjalankan perintah `node server.js` secara terus-menerus).
2. **REST API Hilang**: Karena server Express tidak berjalan, setiap pemanggilan API (seperti `/api/auth/login` atau `/api/settings`) akan menghasilkan halaman **404 Not Found** dari Vercel. Namun, karena ini adalah Single Page Application (SPA), Vercel secara otomatis mengembalikan isi file `index.html` (berformat HTML, diawali dengan `<!DOCTYPE html>`). saat JavaScript mencoba mem-parse output HTML tersebut sebagai JSON, terjadilah error:
   `Unexpected token '<', "<!doctype "... is not valid JSON`
3. **Keterbatasan WhatsApp Bot**: Fitur bot WhatsApp Anda dibangun menggunakan library **Baileys** yang membutuhkan koneksi **WebSocket konstan ke server WhatsApp** agar bisa stand-by menerima perintah & memindai QR Code. Platform Serverless seperti Vercel akan mematikan koneksi setelah beberapa detik (timeout), sehingga WhatsApp Bot tidak akan pernah bisa bekerja secara stabil.

---

## 🚀 Solusi Terbaik: Hosting Persisten (Render atau Railway)

Untuk aplikasi yang menggunakan server Express/Node.js aktif dan bot WhatsApp, Anda memerlukan platform **PaaS (Platform-as-a-Service) yang mendukung server persisten (selalu aktif)**. Dua pilihan terbaik dan gratis/terjangkau adalah:

* **Render.com** (Ada plan gratis, sangat populer, proses deploy otomatis dari GitHub)
* **Railway.app** (Sangat cepat, andal, mudah dikonfigurasi)

Berikut adalah panduan lengkap cara melakukan deploy di kedua platform tersebut.

---

## 🛠️ PANDUAN DEPLOY DI RENDER.COM (Gratis & Sangat Direkomendasikan)

Render menyediakan layanan bernama **Web Service** yang sangat pas untuk aplikasi Node.js + Express + React.

### Langkah 1: Hubungkan Project ke GitHub
1. Pastikan seluruh source code aplikasi ini sudah Anda simpan di akun **GitHub** Anda dalam repository privat/publik.
2. Pastikan file `firebase-applet-config.json` dan `.env` **TIDAK** ikut ter-upload ke github jika mengandung rahasia pribadi, namun Anda dapat mengonfigurasi nilainya melalui pengaturan Environment Variables di Render (disarankan).

### Langkah 2: Buat Akun & Web Service Baru di Render
1. Masuk ke [Render.com](https://render.com) dan buat akun menggunakan GitHub Anda.
2. Di dashboard Render, klik tombol **New +** lalu pilih **Web Service**.
3. Hubungkan akun GitHub Anda dan pilih repository project Sekretariat OSIM Anda.

### Langkah 3: Konfigurasi Build & Run Command
Pada halaman konfigurasi Web Service, isi data berikut:

* **Name**: `sekretariat-osim` (atau sesuaikan dengan keinginan Anda)
* **Region**: Pilih wilayah terdekat (misal: `Singapore` / `Oregon`)
* **Branch**: `main` (atau branch utama Anda)
* **Language/Runtime**: `Node`
* **Build Command**: 
  ```bash
  npm install && npm run build
  ```
* **Start Command**: 
  ```bash
  npm run start
  ```
  *(Perintah ini akan menjalankan hasil build Express server yang berada di `dist/server.cjs`)*

### Langkah 4: Tambahkan Environment Variables
Scroll ke bawah dan klik bagian **Advanced**, lalu tambahkan variabel lingkungan (**Environment Variables**) berikut:

| Key | Value | Keterangan |
| :--- | :--- | :--- |
| `NODE_ENV` | `production` | Memastikan aplikasi berjalan dalam mode produksi |
| `JWT_SECRET` | `MasukanKataSandiRahasiaAndaDisini` | Kunci keamanan acak untuk enkripsi login/session token |
| `PORT` | `3000` | Port default yang didengar oleh server Express kita |

> **Catatan Penting untuk Firebase**: Karena database kita terhubung ke Firebase via file `firebase-applet-config.json`, pastikan isi file tersebut sudah ada di server. Render secara otomatis akan mendeteksi Firebase jika file tersebut ter-commit di GitHub. Namun, jika Anda tidak ingin mengunggah file credential tersebut ke GitHub demi keamanan, Anda dapat menaruh isi berkas tersebut melalui tab **Secret Files** di Render dengan nama file `firebase-applet-config.json` dan paste seluruh isinya!

### Langkah 5: Klik Deploy!
1. Klik tombol **Deploy Web Service**.
2. Render akan mengunduh kode Anda, menginstal modul, mem-build React, dan memulai server backend.
3. Setelah status berubah menjadi **Live**, Anda akan diberikan URL website gratis dari Render (contoh: `https://sekretariat-osim.onrender.com`).
4. Kunjungi tautan tersebut untuk mencoba fitur login dan menghubungkan WhatsApp Bot Anda!

---

## ⚡ PANDUAN DEPLOY DI RAILWAY.APP (Alternatif Cepat)

Railway adalah platform hosting cloud modern yang sangat ramah terhadap developer Node.js.

### Langkah 1: Buat Akun & Project Baru
1. Masuk ke [Railway.app](https://railway.app) dan login menggunakan GitHub.
2. Klik **New Project** -> **Deploy from GitHub repo**.
3. Pilih repository project Sekretariat OSIM Anda.

### Langkah 2: Konfigurasi Otomatis oleh Railway
Railway akan mendeteksi `package.json` secara otomatis.
Untuk menyesuaikan variabel, masuk ke tab **Variables** di panel project Anda dan isi:
* `NODE_ENV` = `production`
* `JWT_SECRET` = `masukan_token_bebas_disini`
* `PORT` = `3000`

Jika Anda ingin mengamankan kredensial Firebase, Anda bisa membuat file rahasia bernama `firebase-applet-config.json` di Railway atau mengikutsertakan filenya.

### Langkah 3: Ekspos Domain Publik
Secara default, Railway tidak mengaktifkan domain publik secara langsung.
1. Masuk ke tab **Settings** pada service Anda di Railway.
2. Di bagian **Networking**, klik **Generate Domain**.
3. Anda akan mendapatkan URL publik resmi untuk mengakses sistem Anda!

---

## 💡 Tips Penggunaan di Server Berkelanjutan

* **Fitur WhatsApp Multi-Device**: Saat server Render/Railway dimulai, klik menu **WhatsApp Bot** di website baru Anda, klik **Start Bot**, dan scan QR Code yang muncul di layar dengan fitur "Linked Devices" di aplikasi WhatsApp HP Anda. Dokumen sesi WhatsApp akan disimpan oleh library Baileys sehingga bot tetap aktif meskipun server di-restart.
* **Firebase Sync**: Sekarang database Anda sudah berpindah ke Firebase Firestore, sehingga segala input data inventaris, piket, dan proker akan tersimpan real-time dan sinkron jika diakses melalui hp, tablet, atau komputer lain secara bersamaan kapan saja dan di mana saja!

Selamat mencoba deploy aplikasi OSIM modern Anda! Jika ada yang kurang jelas, diskusikan kembali di sini.
