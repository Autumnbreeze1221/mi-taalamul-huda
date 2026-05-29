// setup-admin.js — Jalankan sekali untuk membuat/reset password admin
// Usage: node setup-admin.js
require('dotenv').config();
const bcrypt = require('bcryptjs');
const pool   = require('./db');
const readline = require('readline');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

async function main() {
  console.log('\n🕌 MI Ta\'alamul Huda — Setup Admin Password\n');

  rl.question('Username admin (default: admin): ', async (username) => {
    username = username.trim() || 'admin';

    rl.question('Password baru: ', async (password) => {
      if (password.length < 6) {
        console.error('❌ Password minimal 6 karakter.');
        rl.close(); process.exit(1);
      }

      rl.question('Konfirmasi password: ', async (confirm) => {
        if (password !== confirm) {
          console.error('❌ Password tidak cocok.');
          rl.close(); process.exit(1);
        }

        rl.question('Nama lengkap admin: ', async (nama) => {
          nama = nama.trim() || 'Administrator';

          try {
            const hash = await bcrypt.hash(password, 12);
            await pool.query(
              `INSERT INTO admin (username, password, nama, role)
               VALUES ($1, $2, $3, 'superadmin')
               ON CONFLICT (username)
               DO UPDATE SET password = EXCLUDED.password, nama = EXCLUDED.nama`,
              [username, hash, nama]
            );
            console.log(`\n✅ Admin berhasil disimpan!`);
            console.log(`   Username : ${username}`);
            console.log(`   Nama     : ${nama}`);
            console.log(`\nSilakan login di /admin.html\n`);
          } catch (err) {
            console.error('❌ Error:', err.message);
          } finally {
            rl.close();
            await pool.end();
            process.exit(0);
          }
        });
      });
    });
  });
}

main();
