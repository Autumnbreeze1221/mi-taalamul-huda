-- ============================================================
--  MI Ta'alamul Huda — PostgreSQL Schema
--  Jalankan file ini satu kali untuk membuat semua tabel
-- ============================================================

-- Buat database (jalankan sebagai superuser jika perlu)
-- CREATE DATABASE mi_taalamul_huda;
-- \c mi_taalamul_huda

-- ─── ENUM TYPES ──────────────────────────────────────────────
CREATE TYPE jenis_kelamin_enum AS ENUM ('L', 'P');
CREATE TYPE status_ppdb_enum   AS ENUM ('Menunggu Verifikasi', 'Diterima', 'Ditolak');
CREATE TYPE agama_enum         AS ENUM ('Islam', 'Kristen Protestan', 'Kristen Katolik', 'Hindu', 'Buddha', 'Konghucu');

-- ─── TABEL: admin ────────────────────────────────────────────
CREATE TABLE admin (
  id         SERIAL PRIMARY KEY,
  username   VARCHAR(50) UNIQUE NOT NULL,
  password   VARCHAR(255) NOT NULL,       -- bcrypt hash
  nama       VARCHAR(100) NOT NULL,
  role       VARCHAR(20) DEFAULT 'admin',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert admin default (password: Admin@1234)
-- Hash di-generate lewat bcrypt, ganti di production
INSERT INTO admin (username, password, nama, role)
VALUES (
  'admin',
  '$2a$12$TsEMS0NO1LbjS0DxIsGc.OA3zWY9FT2o/MdrxLhbpgxtJQUFPxhVq',
  'Administrator',
  'superadmin'
);

-- ─── TABEL: pendaftar ────────────────────────────────────────
CREATE TABLE pendaftar (
  id                SERIAL PRIMARY KEY,
  nomor_daftar      VARCHAR(20) UNIQUE NOT NULL,   -- e.g. TH-2025-0001

  -- Data Siswa
  nama_lengkap      VARCHAR(150) NOT NULL,
  nik               VARCHAR(16),
  tempat_lahir      VARCHAR(100) NOT NULL,
  tanggal_lahir     DATE NOT NULL,
  jenis_kelamin     jenis_kelamin_enum NOT NULL,
  agama             agama_enum NOT NULL,
  alamat            TEXT NOT NULL,
  nomor_hp          VARCHAR(20) NOT NULL,
  email             VARCHAR(150),

  -- Data Orang Tua / Wali
  nama_ayah         VARCHAR(150),
  nama_ibu          VARCHAR(150),
  nama_wali         VARCHAR(150),          -- diisi jika bukan orang tua kandung
  nomor_hp_ortu     VARCHAR(20) NOT NULL,
  pekerjaan_ayah    VARCHAR(100),
  pekerjaan_ibu     VARCHAR(100),

  -- Asal Sekolah (TK / RA / PAUD)
  asal_sekolah      VARCHAR(150),
  tahun_lulus_tk    SMALLINT,

  -- Pilihan
  kelas_tujuan      VARCHAR(10) DEFAULT 'Kelas 1', -- Kelas 1 / Kelas 2 (pindahan) / dll

  -- Dokumen Upload
  file_kk           VARCHAR(255),   -- path file Kartu Keluarga
  file_akta          VARCHAR(255),   -- path file Akta Kelahiran
  file_foto          VARCHAR(255),   -- path file Pas Foto

  -- Status & Waktu
  status            status_ppdb_enum DEFAULT 'Menunggu Verifikasi',
  catatan_admin     TEXT,            -- catatan dari admin saat terima/tolak
  tanggal_daftar    TIMESTAMPTZ DEFAULT NOW(),
  tanggal_diupdate  TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-update tanggal_diupdate
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN NEW.tanggal_diupdate = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_pendaftar_update
BEFORE UPDATE ON pendaftar
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- ─── TABEL: berita ───────────────────────────────────────────
CREATE TABLE berita (
  id         SERIAL PRIMARY KEY,
  judul      VARCHAR(250) NOT NULL,
  kategori   VARCHAR(50) DEFAULT 'Umum',
  konten     TEXT NOT NULL,
  emoji      VARCHAR(10) DEFAULT '📰',
  aktif      BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── TABEL: testimoni ────────────────────────────────────────
CREATE TABLE testimoni (
  id         SERIAL PRIMARY KEY,
  nama       VARCHAR(100) NOT NULL,
  peran      VARCHAR(100),
  teks       TEXT NOT NULL,
  bintang    SMALLINT DEFAULT 5 CHECK (bintang BETWEEN 1 AND 5),
  aktif      BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── TABEL: galeri ───────────────────────────────────────────
CREATE TABLE galeri (
  id         SERIAL PRIMARY KEY,
  judul      VARCHAR(200) NOT NULL,
  emoji      VARCHAR(10) DEFAULT '',
  kategori   VARCHAR(80),
  aktif      BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── TABEL: profil_sekolah ───────────────────────────────────
CREATE TABLE profil_sekolah (
  id         SERIAL PRIMARY KEY,
  kunci      VARCHAR(100) UNIQUE NOT NULL,  -- e.g. 'visi', 'misi', 'wa_number'
  nilai      TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Data awal profil sekolah
INSERT INTO profil_sekolah (kunci, nilai) VALUES
  ('nama',        'MI Ta''alamul Huda'),
  ('tagline',     'Tumbuh dalam Ilmu & Taqwa'),
  ('visi',        'Terwujudnya peserta didik yang beriman, bertaqwa, berakhlak mulia, berprestasi, dan berwawasan global berdasarkan nilai-nilai Islam.'),
  ('misi',        'Menyelenggarakan pembelajaran yang integratif antara ilmu umum dan agama, membiasakan shalat berjamaah dan baca Al-Qur''an.'),
  ('wa_number',   '6281234567890'),
  ('alamat',      'Jl. Pesantren No. 5, Desa Harapan Jaya, Kecamatan Sejahtera, Kab. Makmur 45123'),
  ('telepon',     '(0231) 456-7890'),
  ('email',       'info@mitaalamulhuda.sch.id'),
  ('kepala',      'Ustadz H. Mukhlis, S.Pd.I'),
  ('nsm',         '111233010001'),
  ('npsn',        '60721234'),
  ('akreditasi',  'A');

-- ─── INDEXES ─────────────────────────────────────────────────
CREATE INDEX idx_pendaftar_status        ON pendaftar(status);
CREATE INDEX idx_pendaftar_tanggal       ON pendaftar(tanggal_daftar DESC);
CREATE INDEX idx_pendaftar_nomor         ON pendaftar(nomor_daftar);
CREATE INDEX idx_berita_aktif            ON berita(aktif, created_at DESC);
CREATE INDEX idx_testimoni_aktif         ON testimoni(aktif);

-- ─── SELESAI ─────────────────────────────────────────────────
-- Setelah menjalankan ini, update password admin:
-- UPDATE admin SET password = '<bcrypt_hash>' WHERE username = 'admin';
