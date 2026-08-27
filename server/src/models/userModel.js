const pool = require('../config/db');

// Each function does exactly one query. This is more verbose than Prisma's
// auto-generated client, but every query is fully visible and auditable —
// nothing is hidden behind ORM magic, which is worth pointing out if asked
// about this design choice in a review.

async function createUser({ name, email, passwordHash }) {
  const result = await pool.query(
    `INSERT INTO users (name, email, password_hash)
     VALUES ($1, $2, $3)
     RETURNING id, name, email, created_at`,
    [name, email, passwordHash]
    // $1/$2/$3 are parameterized placeholders — pg substitutes them safely
    // server-side. This is what prevents SQL injection: never build a query
    // by concatenating user input into a string.
  );
  return result.rows[0];
}

async function findUserByEmail(email) {
  const result = await pool.query(
    `SELECT id, name, email, password_hash, created_at
     FROM users
     WHERE email = $1`,
    [email]
  );
  return result.rows[0] || null;
}

async function findUserById(id) {
  const result = await pool.query(
    `SELECT id, name, email, created_at
     FROM users
     WHERE id = $1`,
    // deliberately NOT selecting password_hash here — this function backs
    // the auth middleware and req.user, which nothing should ever expose
    [id]
  );
  return result.rows[0] || null;
}

module.exports = { createUser, findUserByEmail, findUserById };
