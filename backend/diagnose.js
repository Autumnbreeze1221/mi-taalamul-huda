// diagnose.js — Cek status database & schema
const pool = require('./db');

async function diagnose() {
  try {
    // 1. Test koneksi
    const conn = await pool.query('SELECT current_database(), current_user');
    console.log('✅ DB:', conn.rows[0].current_database, '| User:', conn.rows[0].current_user);

    // 2. Cek semua tabel
    const tables = await pool.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name"
    );
    console.log('\n📋 Tables:', tables.rows.map(r => r.table_name).join(', '));

    // 3. Cek kolom pendaftar
    const cols = await pool.query(
      "SELECT column_name, data_type FROM information_schema.columns WHERE table_name='pendaftar' ORDER BY ordinal_position"
    );
    console.log('\n🗂️  pendaftar columns:');
    cols.rows.forEach(r => console.log(`   - ${r.column_name} (${r.data_type})`));

    // 4. Cek ENUM types
    const enums = await pool.query(
      "SELECT typname, enumlabel FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid ORDER BY typname, e.enumsortorder"
    );
    if (enums.rows.length > 0) {
      console.log('\n🔖 ENUM values:');
      enums.rows.forEach(r => console.log(`   - ${r.typname}: '${r.enumlabel}'`));
    } else {
      console.log('\n⚠️  Tidak ada ENUM types! Schema mungkin belum dijalankan.');
    }

    // 5. Cek kolom galeri (apakah ada kolom gambar)
    const galeriCols = await pool.query(
      "SELECT column_name FROM information_schema.columns WHERE table_name='galeri'"
    );
    console.log('\n🖼️  galeri columns:', galeriCols.rows.map(r => r.column_name).join(', '));

    // 6. Coba simulasi INSERT pendaftar
    console.log('\n🧪 Simulasi INSERT pendaftar...');
    await pool.query('BEGIN');
    try {
      const testResult = await pool.query(`
        INSERT INTO pendaftar (
          nomor_daftar, nama_lengkap, tempat_lahir, tanggal_lahir,
          jenis_kelamin, agama, alamat, nomor_hp, nomor_hp_ortu
        ) VALUES (
          'TEST-9999', 'Test Diagnosa', 'Jakarta', '2018-01-01',
          'L', 'Islam', 'Jl. Test No. 1', '08123456789', '08123456780'
        ) RETURNING id, nomor_daftar`
      );
      console.log('✅ INSERT berhasil! ID:', testResult.rows[0].id, '| Nomor:', testResult.rows[0].nomor_daftar);
    } catch(insertErr) {
      console.error('❌ INSERT GAGAL:', insertErr.message);
      console.error('   Detail:', insertErr.detail || '-');
    } finally {
      await pool.query('ROLLBACK'); // Selalu rollback tes ini
    }

    process.exit(0);
  } catch(e) {
    console.error('\n❌ ERROR KONEKSI:', e.message);
    process.exit(1);
  }
}

diagnose();
