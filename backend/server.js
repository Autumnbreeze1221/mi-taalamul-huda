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
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    
    const isLocal = origin.includes('localhost') || origin.includes('127.0.0.1') || origin.includes('5500');
    const isVercel = origin.includes('vercel.app') || origin.includes('mi-taalamul-huda') || origin.includes('mistaalamulhuda.com');
    const isCustomDomain = process.env.FRONTEND_URL && origin.includes(process.env.FRONTEND_URL.replace(/https?:\/\//, ''));
    
    if (isLocal || isVercel || isCustomDomain) {
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

// ─── DIAGNOSTIC API ───────────────────────────────────────────
app.get('/api/test-db', async (req, res) => {
  const pool = require('./db');
  try {
    const result = await pool.query('SELECT NOW() as now, current_database() as db, current_user as user');
    res.json({ success: true, connection: "success", data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ 
      success: false, 
      connection: "failed", 
      error: err.message, 
      code: err.code,
      env: {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        database: process.env.DB_NAME,
        user: process.env.DB_USER,
        node_env: process.env.NODE_ENV
      }
    });
  }
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

// Export app untuk Vercel Serverless
module.exports = app;

// Jalankan server jika dijalankan secara lokal (bukan serverless)
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`\n🕌 MI Ta'alamul Huda Server`);
    console.log(`   » Port:    ${PORT}`);
    console.log(`   » Env:     development`);
    console.log(`   » DB Host: ${process.env.DB_HOST || 'localhost'}`);
  });
}
