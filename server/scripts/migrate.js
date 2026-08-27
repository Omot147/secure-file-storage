require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

// A minimal, hand-rolled version of what `prisma migrate dev` did
// automatically — reads the SQL file and runs it. For a 4-day project,
// this single-file approach is proportionate; a longer-lived project
// would want a proper migration tool (node-pg-migrate, Knex) that tracks
// which migrations have already run.
async function migrate() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  const sqlPath = path.join(__dirname, '..', 'migrations', '001_init.sql');
  const sql = fs.readFileSync(sqlPath, 'utf-8');

  try {
    await pool.query(sql);
    console.log('[migrate] success — users and files tables are ready');
  } catch (err) {
    console.error('[migrate] failed:', err.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

migrate();
