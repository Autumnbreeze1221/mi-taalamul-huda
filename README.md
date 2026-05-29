# 🕌 MI Ta'alamul Huda — Website & PPDB System

Website profil madrasah lengkap dengan sistem PPDB online, upload dokumen identitas, dan panel admin.

---

## 📁 Struktur Proyek

```
mi-taalamul-huda/
├── backend/
│   ├── routes/
│   │   ├── auth.js           # Login admin (JWT)
│   │   ├── pendaftaran.js    # CRUD PPDB + upload dokumen
│   │   └── konten.js         # Berita, testimoni, galeri, profil
│   ├── middleware/
│   │   ├── auth.js           # JWT middleware
│   │   └── upload.js         # Multer file upload config
│   ├── uploads/              # Folder dokumen (KK, Akta, Foto) — auto dibuat
│   ├── db.js                 # PostgreSQL connection pool
│   ├── server.js             # Entry point Express
│   ├── schema.sql            # Script setup database PostgreSQL
│   ├── package.json
│   └── .env.example          # Template environment variables
└── frontend/
    ├── index.html            # Beranda + Profil + Berita + Galeri + Testimoni + Kontak
    ├── pendaftaran.html      # Form PPDB 4 langkah + upload dokumen
    └── admin.html            # Panel admin (login, kelola data, konten)
```

---

## ⚙️ Cara Setup & Menjalankan

### 1. Prasyarat

Pastikan sudah terinstall:
- **Node.js** v18 atau lebih baru → https://nodejs.org
- **PostgreSQL** v14 atau lebih baru → https://postgresql.org

---

### 2. Setup Database PostgreSQL

Buka terminal / pgAdmin, lalu jalankan:

```sql
-- Buat database baru
CREATE DATABASE mi_taalamul_huda;

-- Masuk ke database
\c mi_taalamul_huda

-- Jalankan schema (buat semua tabel)
\i /path/ke/backend/schema.sql
```

Atau buka file `backend/schema.sql` di pgAdmin dan jalankan semua query-nya.

---

### 3. Buat Password Admin

Setelah database dibuat, buat hash password admin:

```bash
cd backend
npm install
node -e "const b=require('bcryptjs');b.hash('Admin@1234',12).then(h=>console.log(h))"
```

Salin hash yang muncul, lalu jalankan di PostgreSQL:

```sql
UPDATE admin SET password = '$2a$12$TsEMS0NO1LbjS0DxIsGc.OA3zWY9FT2o/MdrxLhbpgxtJQUFPxhVq' WHERE username = 'admin';
```

---

### 4. Konfigurasi Environment

```bash
cd backend
cp .env.example .env
```

Edit file `.env`:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=mi_taalamul_huda
DB_USER=postgres
DB_PASSWORD=123

PORT=3000
JWT_SECRET=mi_taalamul_huda_rahasia_super_panjang_2026

UPLOAD_DIR=uploads
MAX_FILE_SIZE=5242880
```

---

### 5. Install & Jalankan Server

```bash
cd backend
npm install
npm start
```

Untuk development (auto-restart):
```bash
npm run dev
```

Server berjalan di: **http://localhost:3000**

---

### 6. Buka Website

Buka browser dan akses:

| Halaman | URL |
|---|---|
| Beranda | http://localhost:3000 |
| Pendaftaran | http://localhost:3000/pendaftaran.html |
| Admin Panel | http://localhost:3000/admin.html |

**Login admin:**
- Username: `admin`
- Password: `Admin@1234` (atau sesuai yang Anda set)

---

## 🗄️ Struktur Database

### Tabel Utama

| Tabel | Keterangan |
|---|---|
| `admin` | Akun admin panel |
| `pendaftar` | Data pendaftaran siswa baru (PPDB) |
| `berita` | Berita & pengumuman madrasah |
| `testimoni` | Testimoni orang tua/wali |
| `galeri` | Item galeri kegiatan |
| `profil_sekolah` | Informasi profil madrasah (key-value) |

### Kolom Penting `pendaftar`

| Kolom | Tipe | Keterangan |
|---|---|---|
| `nomor_daftar` | VARCHAR | Auto-generate: TH-2025-0001 |
| `nama_lengkap` | VARCHAR | Nama siswa |
| `nik` | VARCHAR | NIK (opsional) |
| `tanggal_lahir` | DATE | Tanggal lahir |
| `jenis_kelamin` | ENUM | L / P |
| `agama` | ENUM | Islam, dll |
| `file_kk` | VARCHAR | Path file Kartu Keluarga |
| `file_akta` | VARCHAR | Path file Akta Kelahiran |
| `file_foto` | VARCHAR | Path pas foto |
| `status` | ENUM | Menunggu Verifikasi / Diterima / Ditolak |

---

## 📡 API Endpoints

### Auth
| Method | Endpoint | Keterangan |
|---|---|---|
| POST | `/api/auth/login` | Login admin |

### Pendaftaran (PPDB)
| Method | Endpoint | Auth | Keterangan |
|---|---|---|---|
| POST | `/api/pendaftaran` | ❌ | Submit form (multipart/form-data) |
| GET | `/api/pendaftaran` | ✅ | List semua pendaftar |
| GET | `/api/pendaftaran/stats` | ✅ | Statistik dashboard |
| GET | `/api/pendaftaran/:id` | ✅ | Detail pendaftar |
| PATCH | `/api/pendaftaran/:id/status` | ✅ | Ubah status |
| DELETE | `/api/pendaftaran/:id` | ✅ | Hapus pendaftar |

### Konten
| Method | Endpoint | Auth | Keterangan |
|---|---|---|---|
| GET | `/api/konten/berita` | ❌ | Berita aktif (publik) |
| GET | `/api/konten/berita/all` | ✅ | Semua berita (admin) |
| POST | `/api/konten/berita` | ✅ | Tambah berita |
| PATCH | `/api/konten/berita/:id/toggle` | ✅ | Aktif/nonaktif |
| DELETE | `/api/konten/berita/:id` | ✅ | Hapus berita |
| GET/POST/DELETE | `/api/konten/testimoni` | — | CRUD Testimoni |
| GET/POST/DELETE | `/api/konten/galeri` | — | CRUD Galeri |
| GET | `/api/konten/profil` | ❌ | Data profil sekolah |
| PUT | `/api/konten/profil` | ✅ | Update profil sekolah |

---

## 📤 Upload Dokumen

File dokumen disimpan di folder `backend/uploads/`:

```
uploads/
├── kk/      → Kartu Keluarga
├── akta/    → Akta Kelahiran
└── foto/    → Pas Foto
```

- Format didukung: **PDF, JPG, JPEG, PNG**
- Maksimal ukuran: **5 MB** per file
- Akses file via: `GET /uploads/kk/filename.pdf` (perlu login admin)

---

## 🚀 Deployment Production

### Rekomendasi Stack:
- **Server**: VPS (Ubuntu) + Nginx sebagai reverse proxy
- **Process Manager**: PM2 (`npm install -g pm2 && pm2 start server.js`)
- **Database**: PostgreSQL di server yang sama atau managed DB (Supabase, Neon, dll)
- **HTTPS**: Certbot / Let's Encrypt

### Contoh PM2:
```bash
cd backend
pm2 start server.js --name "mi-taalamul-huda"
pm2 save
pm2 startup
```

### Nginx config (contoh):
```nginx
server {
    listen 80;
    server_name domain-anda.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
    }

    # Batasi akses file upload hanya lewat Node.js (sudah ada auth)
    location /uploads/ {
        proxy_pass http://localhost:3000;
    }
}
```

---

## 🔒 Keamanan

- Password admin di-hash dengan **bcrypt** (cost factor 12)
- Autentikasi menggunakan **JWT** (expire 8 jam)
- File upload divalidasi: format dan ukuran
- File upload hanya bisa diakses dengan token JWT yang valid
- Input divalidasi di sisi server sebelum masuk database
- Query menggunakan **parameterized query** (aman dari SQL Injection)

---

## 📞 Dukungan

Untuk pertanyaan seputar instalasi dan penggunaan, hubungi pengembang atau buka isu di repository.

**بِسْمِ اللهِ الرَّحْمٰنِ الرَّحِيْمِ**
