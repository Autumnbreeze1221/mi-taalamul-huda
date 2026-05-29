// routes/konten.js — Kelola berita, testimoni, galeri, profil
const express = require('express');
const pool    = require('../db');
const auth    = require('../middleware/auth');
const router  = express.Router();

// ════════ BERITA ═══════════════════════════════════════════════

// GET /api/konten/berita — publik
router.get('/berita', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM berita WHERE aktif = TRUE ORDER BY created_at DESC LIMIT 20'
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// GET /api/konten/berita/all — admin (semua termasuk non-aktif)
router.get('/berita/all', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM berita ORDER BY created_at DESC');
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// POST /api/konten/berita — tambah berita (admin)
router.post('/berita', auth, async (req, res) => {
  const { judul, kategori, konten, emoji } = req.body;
  if (!judul || !konten) {
    return res.status(400).json({ success: false, message: 'Judul dan konten wajib diisi.' });
  }
  try {
    const result = await pool.query(
      'INSERT INTO berita (judul, kategori, konten, emoji) VALUES ($1,$2,$3,$4) RETURNING *',
      [judul, kategori || 'Umum', konten, emoji || '📰']
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// PATCH /api/konten/berita/:id/toggle — aktif/nonaktif
router.patch('/berita/:id/toggle', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'UPDATE berita SET aktif = NOT aktif WHERE id = $1 RETURNING id, judul, aktif',
      [req.params.id]
    );
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// DELETE /api/konten/berita/:id
router.delete('/berita/:id', auth, async (req, res) => {
  try {
    await pool.query('DELETE FROM berita WHERE id = $1', [req.params.id]);
    res.json({ success: true, message: 'Berita dihapus.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ════════ TESTIMONI ════════════════════════════════════════════

router.get('/testimoni', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM testimoni WHERE aktif = TRUE ORDER BY created_at DESC'
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

router.get('/testimoni/all', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM testimoni ORDER BY created_at DESC');
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

router.post('/testimoni', auth, async (req, res) => {
  const { nama, peran, teks, bintang } = req.body;
  if (!nama || !teks) {
    return res.status(400).json({ success: false, message: 'Nama dan isi testimoni wajib diisi.' });
  }
  try {
    const result = await pool.query(
      'INSERT INTO testimoni (nama, peran, teks, bintang) VALUES ($1,$2,$3,$4) RETURNING *',
      [nama, peran || '', teks, bintang || 5]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

router.delete('/testimoni/:id', auth, async (req, res) => {
  try {
    await pool.query('DELETE FROM testimoni WHERE id = $1', [req.params.id]);
    res.json({ success: true, message: 'Testimoni dihapus.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ════════ GALERI ════════════════════════════════════════════════

router.get('/galeri', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM galeri WHERE aktif = TRUE ORDER BY created_at DESC'
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

router.get('/galeri/all', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM galeri ORDER BY created_at DESC');
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

router.post('/galeri', auth, async (req, res) => {
  const { judul, emoji, kategori } = req.body;
  if (!judul) return res.status(400).json({ success: false, message: 'Judul wajib diisi.' });
  try {
    const result = await pool.query(
      'INSERT INTO galeri (judul, emoji, kategori) VALUES ($1,$2,$3) RETURNING *',
      [judul, emoji || '🖼️', kategori || 'Umum']
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

router.delete('/galeri/:id', auth, async (req, res) => {
  try {
    await pool.query('DELETE FROM galeri WHERE id = $1', [req.params.id]);
    res.json({ success: true, message: 'Item galeri dihapus.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ════════ PROFIL SEKOLAH ═══════════════════════════════════════

// GET /api/konten/profil — publik
router.get('/profil', async (req, res) => {
  try {
    const result = await pool.query('SELECT kunci, nilai FROM profil_sekolah');
    const profil = {};
    result.rows.forEach(r => { profil[r.kunci] = r.nilai; });
    res.json({ success: true, data: profil });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// PUT /api/konten/profil — update profil (admin)
router.put('/profil', auth, async (req, res) => {
  const updates = req.body; // { visi: '...', misi: '...', wa_number: '...', ... }
  try {
    const queries = Object.entries(updates).map(([kunci, nilai]) =>
      pool.query(
        `INSERT INTO profil_sekolah (kunci, nilai) VALUES ($1, $2)
         ON CONFLICT (kunci) DO UPDATE SET nilai = EXCLUDED.nilai, updated_at = NOW()`,
        [kunci, nilai]
      )
    );
    await Promise.all(queries);
    res.json({ success: true, message: 'Profil sekolah diperbarui.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

module.exports = router;
