// middleware/upload.js — Multer config untuk upload dokumen
const multer = require('multer');
const path   = require('path');
const fs     = require('fs');

const UPLOAD_DIR = path.join(__dirname, '..', process.env.UPLOAD_DIR || 'uploads');

// Pastikan folder uploads ada
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// Subfolder per jenis dokumen
const ensureDir = (dir) => { if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true }); };

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let subdir = 'misc';
    if (file.fieldname === 'file_kk')   subdir = 'kk';
    if (file.fieldname === 'file_akta') subdir = 'akta';
    if (file.fieldname === 'file_foto') subdir = 'foto';
    const dest = path.join(UPLOAD_DIR, subdir);
    ensureDir(dest);
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    // Format: kk_2025-001_timestamp.pdf
    const timestamp = Date.now();
    const ext = path.extname(file.originalname).toLowerCase();
    const safeName = file.fieldname + '_' + timestamp + ext;
    cb(null, safeName);
  }
});

const fileFilter = (req, file, cb) => {
  // Izinkan: PDF, JPG, PNG, JPEG
  const allowed = ['.pdf', '.jpg', '.jpeg', '.png'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Format file tidak didukung. Gunakan PDF, JPG, atau PNG.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024, // 5MB default
  }
});

// Upload tiga dokumen sekaligus
const uploadDokumen = upload.fields([
  { name: 'file_kk',   maxCount: 1 },
  { name: 'file_akta', maxCount: 1 },
  { name: 'file_foto', maxCount: 1 },
]);

// Helper: ambil path relatif untuk disimpan ke DB
const getRelativePath = (file) => {
  if (!file) return null;
  return path.relative(path.join(__dirname, '..'), file.path).replace(/\\/g, '/');
};

module.exports = { uploadDokumen, getRelativePath, UPLOAD_DIR };
