// routes/pendaftaran.js — PPDB pendaftaran siswa baru
const express   = require('express');
const pool      = require('../db');
const auth      = require('../middleware/auth');
const { uploadDokumen, getRelativePath } = require('../middleware/upload');
const router    = express.Router();

// ─── Helper: generate nomor daftar ───────────────────────────
async function generateNomor() {
  const year = new Date().getFullYear();
  const result = await pool.query(
    'SELECT COUNT(*) FROM pendaftar WHERE EXTRACT(YEAR FROM tanggal_daftar) = $1',
    [year]
  );
  const count = parseInt(result.rows[0].count) + 1;
  return `TH-${year}-${String(count).padStart(4, '0')}`;
}

// ─── POST /api/pendaftaran — Submit form pendaftaran ─────────
router.post('/', (req, res) => {
  uploadDokumen(req, res, async (err) => {
    // Handle multer errors (file terlalu besar, format salah)
    if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }

    const {
      nama_lengkap, nik, tempat_lahir, tanggal_lahir,
      jenis_kelamin, agama, alamat, nomor_hp, email,
      nama_ayah, nama_ibu, nama_wali,
      nomor_hp_ortu, pekerjaan_ayah, pekerjaan_ibu,
      asal_sekolah, tahun_lulus_tk, kelas_tujuan
    } = req.body;

    // Validasi field wajib
    const wajib = { nama_lengkap, tempat_lahir, tanggal_lahir, jenis_kelamin, agama, alamat, nomor_hp, nomor_hp_ortu };
    const kosong = Object.keys(wajib).filter(k => !wajib[k] || !wajib[k].toString().trim());
    if (kosong.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Field berikut wajib diisi: ${kosong.join(', ')}`
      });
    }

    // Validasi jenis_kelamin & agama sesuai ENUM
    const jkValid = ['L', 'P'];
    const agamaValid = ['Islam', 'Kristen Protestan', 'Kristen Katolik', 'Hindu', 'Buddha', 'Konghucu'];
    if (!jkValid.includes(jenis_kelamin)) {
      return res.status(400).json({ success: false, message: 'Jenis kelamin tidak valid.' });
    }
    if (!agamaValid.includes(agama)) {
      return res.status(400).json({ success: false, message: 'Agama tidak valid.' });
    }

    // Ambil path file upload (opsional)
    const file_kk   = req.files?.file_kk?.[0]   ? getRelativePath(req.files.file_kk[0])   : null;
    const file_akta = req.files?.file_akta?.[0]  ? getRelativePath(req.files.file_akta[0]) : null;
    const file_foto = req.files?.file_foto?.[0]  ? getRelativePath(req.files.file_foto[0]) : null;

    try {
      const nomor_daftar = await generateNomor();

      const sql = `
        INSERT INTO pendaftar (
          nomor_daftar, nama_lengkap, nik, tempat_lahir, tanggal_lahir,
          jenis_kelamin, agama, alamat, nomor_hp, email,
          nama_ayah, nama_ibu, nama_wali, nomor_hp_ortu, pekerjaan_ayah, pekerjaan_ibu,
          asal_sekolah, tahun_lulus_tk, kelas_tujuan,
          file_kk, file_akta, file_foto
        ) VALUES (
          $1,$2,$3,$4,$5,
          $6,$7,$8,$9,$10,
          $11,$12,$13,$14,$15,$16,
          $17,$18,$19,
          $20,$21,$22
        ) RETURNING id, nomor_daftar, nama_lengkap, tanggal_daftar`;

      const values = [
        nomor_daftar, nama_lengkap, nik || null, tempat_lahir, tanggal_lahir,
        jenis_kelamin, agama, alamat, nomor_hp, email || null,
        nama_ayah || null, nama_ibu || null, nama_wali || null,
        nomor_hp_ortu, pekerjaan_ayah || null, pekerjaan_ibu || null,
        asal_sekolah || null, tahun_lulus_tk ? parseInt(tahun_lulus_tk) : null,
        kelas_tujuan || 'Kelas 1',
        file_kk, file_akta, file_foto
      ];

      const result = await pool.query(sql, values);
      const data   = result.rows[0];

      res.status(201).json({
        success: true,
        message: 'Pendaftaran berhasil dikirim!',
        data: {
          id:             data.id,
          nomor_daftar:   data.nomor_daftar,
          nama_lengkap:   data.nama_lengkap,
          tanggal_daftar: data.tanggal_daftar,
        }
      });

    } catch (dbErr) {
      console.error('DB error pendaftaran:', dbErr);
      res.status(500).json({ success: false, message: 'Gagal menyimpan data. Coba lagi.' });
    }
  });
});

// ─── GET /api/pendaftaran — Daftar semua pendaftar (admin) ───
router.get('/', auth, async (req, res) => {
  const { status, search, page = 1, limit = 20 } = req.query;
  const offset = (parseInt(page) - 1) * parseInt(limit);

  let where = [];
  let params = [];
  let idx = 1;

  if (status) {
    where.push(`status = $${idx++}`);
    params.push(status);
  }
  if (search) {
    where.push(`(nama_lengkap ILIKE $${idx} OR nomor_daftar ILIKE $${idx})`);
    params.push(`%${search}%`);
    idx++;
  }

  const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';

  try {
    const countResult = await pool.query(
      `SELECT COUNT(*) FROM pendaftar ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    const result = await pool.query(
      `SELECT id, nomor_daftar, nama_lengkap, jenis_kelamin, agama,
              nomor_hp, nomor_hp_ortu, asal_sekolah, kelas_tujuan,
              status, tanggal_daftar,
              file_kk IS NOT NULL AS ada_kk,
              file_akta IS NOT NULL AS ada_akta,
              file_foto IS NOT NULL AS ada_foto
       FROM pendaftar ${whereClause}
       ORDER BY tanggal_daftar DESC
       LIMIT $${idx} OFFSET $${idx+1}`,
      [...params, parseInt(limit), offset]
    );

    res.json({
      success: true,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      data: result.rows
    });

  } catch (err) {
    console.error('GET pendaftar error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ─── GET /api/pendaftaran/stats — Statistik dashboard ────────
router.get('/stats', auth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE TRUE)                             AS total,
        COUNT(*) FILTER (WHERE status = 'Menunggu Verifikasi')  AS menunggu,
        COUNT(*) FILTER (WHERE status = 'Diterima')             AS diterima,
        COUNT(*) FILTER (WHERE status = 'Ditolak')              AS ditolak,
        COUNT(*) FILTER (WHERE jenis_kelamin = 'L')             AS laki,
        COUNT(*) FILTER (WHERE jenis_kelamin = 'P')             AS perempuan
      FROM pendaftar
      WHERE EXTRACT(YEAR FROM tanggal_daftar) = EXTRACT(YEAR FROM NOW())`
    );
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ─── GET /api/pendaftaran/:id — Detail pendaftar ─────────────
router.get('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM pendaftar WHERE id = $1',
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Data tidak ditemukan.' });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ─── PATCH /api/pendaftaran/:id/status — Update status ───────
router.patch('/:id/status', auth, async (req, res) => {
  const { status, catatan_admin } = req.body;
  const validStatus = ['Menunggu Verifikasi', 'Diterima', 'Ditolak'];

  if (!validStatus.includes(status)) {
    return res.status(400).json({ success: false, message: 'Status tidak valid.' });
  }

  try {
    const result = await pool.query(
      `UPDATE pendaftar SET status = $1, catatan_admin = $2
       WHERE id = $3
       RETURNING id, nomor_daftar, nama_lengkap, status`,
      [status, catatan_admin || null, req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Data tidak ditemukan.' });
    }
    res.json({ success: true, message: `Status diubah ke: ${status}`, data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// ─── DELETE /api/pendaftaran/:id — Hapus pendaftar ───────────
router.delete('/:id', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM pendaftar WHERE id = $1 RETURNING id, nama_lengkap',
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Data tidak ditemukan.' });
    }
    res.json({ success: true, message: `Data ${result.rows[0].nama_lengkap} dihapus.` });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

module.exports = router;
