// routes/auth.js — Login admin
const express = require('express');
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const pool    = require('../db');
const router  = express.Router();

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Username dan password wajib diisi.' });
  }

  try {
    const result = await pool.query(
      'SELECT * FROM admin WHERE username = $1',
      [username.trim()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Username atau password salah.' });
    }

    const admin = result.rows[0];
    const valid = await bcrypt.compare(password, admin.password);

    if (!valid) {
      return res.status(401).json({ success: false, message: 'Username atau password salah.' });
    }

    const token = jwt.sign(
      { id: admin.id, username: admin.username, nama: admin.nama, role: admin.role },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '8h' }
    );

    res.json({
      success: true,
      token,
      admin: { id: admin.id, username: admin.username, nama: admin.nama, role: admin.role }
    });

  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Server error.' });
  }
});

// POST /api/auth/hash — Utility: buat hash password (gunakan sekali untuk setup)
router.post('/hash', async (req, res) => {
  const { password } = req.body;
  if (!password) return res.status(400).json({ success: false });
  const hash = await bcrypt.hash(password, 12);
  res.json({ hash });
});

module.exports = router;
