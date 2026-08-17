// update-db.js — Database schema migration script
const pool = require('./db');

async function update() {
  try {
    console.log('🕌 Running database updates...');

    // 1. Update table: berita
    console.log('Updating table: berita...');
    await pool.query(`
      ALTER TABLE berita ADD COLUMN IF NOT EXISTS instagram_url VARCHAR(500);
      ALTER TABLE berita ADD COLUMN IF NOT EXISTS gambar_cover VARCHAR(255);
    `);
    console.log('✅ Table berita updated.');

    // 2. Update table: galeri
    console.log('Updating table: galeri...');
    await pool.query(`
      ALTER TABLE galeri ADD COLUMN IF NOT EXISTS gambar VARCHAR(255);
    `);
    console.log('✅ Table galeri updated.');

    // 3. Update table: profil_sekolah with instagram_url
    console.log('Updating table: profil_sekolah...');
    await pool.query(`
      INSERT INTO profil_sekolah (kunci, nilai)
      VALUES ('instagram_url', 'https://www.instagram.com/mitaalamulhuda')
      ON CONFLICT (kunci) DO NOTHING;
    `);
    console.log('✅ Table profil_sekolah updated.');

    console.log('🎉 Database update completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error updating database:', err);
    process.exit(1);
  }
}

update();
