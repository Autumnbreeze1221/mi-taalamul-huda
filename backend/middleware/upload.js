// middleware/upload.js — Multer config untuk upload dokumen & Supabase integration
const multer = require('multer');
const path   = require('path');
const fs     = require('fs');

const isProduction = process.env.NODE_ENV === 'production';
const UPLOAD_DIR = path.join(__dirname, '..', process.env.UPLOAD_DIR || 'uploads');

// Pastikan folder uploads ada (hanya jika di lokal)
if (!isProduction && !fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Gunakan memoryStorage di Vercel agar file ditampung sebagai buffer di RAM, diskStorage di lokal
const storage = isProduction
  ? multer.memoryStorage()
  : multer.diskStorage({
      destination: (req, file, cb) => {
        let subdir = 'misc';
        if (file.fieldname === 'file_kk')   subdir = 'kk';
        if (file.fieldname === 'file_akta') subdir = 'akta';
        if (file.fieldname === 'file_foto') subdir = 'foto';
        if (file.fieldname === 'gambar_cover') subdir = 'berita';
        if (file.fieldname === 'gambar_galeri') subdir = 'galeri';
        const dest = path.join(UPLOAD_DIR, subdir);
        // Pastikan folder subdirektori ada
        if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
        cb(null, dest);
      },
      filename: (req, file, cb) => {
        const timestamp = Date.now();
        const ext = path.extname(file.originalname).toLowerCase();
        const safeName = file.fieldname + '_' + timestamp + ext;
        cb(null, safeName);
      }
    });

const fileFilter = (req, file, cb) => {
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
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024, // 5MB
  }
});

// Helper: upload buffer ke Supabase Storage menggunakan native fetch
async function uploadToSupabase(file, subdir) {
  const timestamp = Date.now();
  const ext = path.extname(file.originalname).toLowerCase();
  const safeName = file.fieldname + '_' + timestamp + ext;
  const filePath = `${subdir}/${safeName}`;

  const supabaseUrl = process.env.SUPABASE_URL || 'https://vcagzhoricaiqskkjwfd.supabase.co';
  // Gunakan Key anon atau service role
  const supabaseKey = process.env.SUPABASE_KEY;

  if (!supabaseKey) {
    throw new Error('SUPABASE_KEY tidak ditemukan di environment variables.');
  }

  const url = `${supabaseUrl}/storage/v1/object/uploads/${filePath}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type': file.mimetype
    },
    body: file.buffer
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Failed to upload to Supabase Storage: ${errText}`);
  }

  // Kembalikan URL publik Supabase
  return `${supabaseUrl}/storage/v1/object/public/uploads/${filePath}`;
}

// Middleware Wrappers
const uploadDokumen = (req, res, callback) => {
  const fields = upload.fields([
    { name: 'file_kk',   maxCount: 1 },
    { name: 'file_akta', maxCount: 1 },
    { name: 'file_foto', maxCount: 1 },
  ]);

  fields(req, res, async (err) => {
    if (err) return callback(err);
    if (isProduction && req.files) {
      try {
        if (req.files.file_kk && req.files.file_kk[0]) {
          req.files.file_kk[0].supabaseUrl = await uploadToSupabase(req.files.file_kk[0], 'kk');
        }
        if (req.files.file_akta && req.files.file_akta[0]) {
          req.files.file_akta[0].supabaseUrl = await uploadToSupabase(req.files.file_akta[0], 'akta');
        }
        if (req.files.file_foto && req.files.file_foto[0]) {
          req.files.file_foto[0].supabaseUrl = await uploadToSupabase(req.files.file_foto[0], 'foto');
        }
      } catch (uploadErr) {
        console.error('Supabase upload error:', uploadErr);
        return callback(uploadErr);
      }
    }
    callback(null);
  });
};

const uploadBeritaCover = (req, res, callback) => {
  const single = upload.single('gambar_cover');
  single(req, res, async (err) => {
    if (err) return callback(err);
    if (isProduction && req.file) {
      try {
        req.file.supabaseUrl = await uploadToSupabase(req.file, 'berita');
      } catch (uploadErr) {
        console.error('Supabase cover upload error:', uploadErr);
        return callback(uploadErr);
      }
    }
    callback(null);
  });
};

const uploadGaleriGambar = (req, res, callback) => {
  const single = upload.single('gambar_galeri');
  single(req, res, async (err) => {
    if (err) return callback(err);
    if (isProduction && req.file) {
      try {
        req.file.supabaseUrl = await uploadToSupabase(req.file, 'galeri');
      } catch (uploadErr) {
        console.error('Supabase gallery upload error:', uploadErr);
        return callback(uploadErr);
      }
    }
    callback(null);
  });
};

// Helper: ambil path relatif untuk disimpan ke DB (jika local) atau URL publik (jika production)
const getRelativePath = (file) => {
  if (!file) return null;
  if (file.supabaseUrl) return file.supabaseUrl;
  return path.relative(path.join(__dirname, '..'), file.path).replace(/\\/g, '/');
};

module.exports = { uploadDokumen, uploadBeritaCover, uploadGaleriGambar, getRelativePath, UPLOAD_DIR };
