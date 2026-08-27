const { Pool } = require('pg');

// A Pool, not a single Client — it manages a small set of reusable
// connections and hands one out per query automatically. Same singleton
// reasoning as before: create this once, import it everywhere, so
// nodemon restarts don't spawn a fresh pool each time.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }, // Supabase's pooler requires SSL;
  // rejectUnauthorized: false is standard for managed Postgres providers
  // whose certs aren't in Node's default trust store — the connection
  // itself is still encrypted, this just skips strict cert-chain validation
});

pool.on('error', (err) => {
  // A background/idle client threw an error (e.g. connection dropped) —
  // log it instead of letting it crash the whole process.
  console.error('[db] unexpected error on idle client', err);
});

module.exports = pool;
