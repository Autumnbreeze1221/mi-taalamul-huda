// server.js — Entry point aplikasi MI Ta'alamul Huda
require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const path    = require('path');

const authRoutes        = require('./routes/auth');
const pendaftaranRoutes = require('./routes/pendaftaran');
const kontenRoutes      = require('./routes/konten');

const app  = express();
const PORT = process.env.PORT || 3000;

// ─── MIDDLEWARE ───────────────────────────────────────────────
const allowedOrigins = ['http://localhost:5500', 'http://127.0.0.1:5500', 'http://localhost:3000'];
if (process.env.FRONTEND_URL) {
  // Masukkan domain produksi Vercel / domain kustom
  allowedOrigins.push(process.env.FRONTEND_URL);
  // Kadang browser mengirim origin tanpa slash terakhir, pastikan bersih
  allowedOrigins.push(process.env.FRONTEND_URL.replace(/\/$/, ""));
}

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Blocked by CORS: ' + origin));
  },
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve file upload (dokumen)
const uploadDir = process.env.UPLOAD_DIR || 'uploads';
app.use('/uploads/berita', express.static(path.join(__dirname, uploadDir, 'berita')));
app.use('/uploads/galeri', express.static(path.join(__dirname, uploadDir, 'galeri')));
app.use('/uploads/misc', express.static(path.join(__dirname, uploadDir, 'misc')));
app.use('/uploads', require('./middleware/auth'), express.static(path.join(__dirname, uploadDir)));

// Serve frontend HTML dari folder frontend/
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// ─── API ROUTES ───────────────────────────────────────────────
app.use('/api/auth',        authRoutes);
app.use('/api/pendaftaran', pendaftaranRoutes);
app.use('/api/konten',      kontenRoutes);

// ─── HEALTH CHECK ─────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString(), app: "MI Ta'alamul Huda API" });
});

// ─── 404 API ──────────────────────────────────────────────────
app.use('/api/*', (req, res) => {
  res.status(404).json({ success: false, message: 'Endpoint tidak ditemukan.' });
});

// ─── SPA Fallback: semua route non-API → index.html ──────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
});

// ─── ERROR HANDLER ────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ success: false, message: 'Internal server error.' });
});

// ─── START ────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🕌 MI Ta'alamul Huda Server`);
  console.log(`✅ Berjalan di http://localhost:${PORT}`);
  console.log(`📋 API: http://localhost:${PORT}/api`);
  console.log(`🌐 Frontend: http://localhost:${PORT}\n`);
});
