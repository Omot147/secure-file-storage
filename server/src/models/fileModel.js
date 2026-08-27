const pool = require('../config/db');

async function createFile({ filename, cloudinaryId, url, size, mimeType, ownerId }) {
  const result = await pool.query(
    `INSERT INTO files (filename, cloudinary_id, url, size, mime_type, owner_id)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [filename, cloudinaryId, url, size, mimeType, ownerId]
  );
  return result.rows[0];
}

async function findFilesByOwner(ownerId) {
  const result = await pool.query(
    `SELECT * FROM files
     WHERE owner_id = $1
     ORDER BY created_at DESC`,
    [ownerId]
  );
  return result.rows;
}

async function findFileById(id) {
  const result = await pool.query(`SELECT * FROM files WHERE id = $1`, [id]);
  return result.rows[0] || null;
}

async function findFileByShareToken(shareToken) {
  const result = await pool.query(`SELECT * FROM files WHERE share_token = $1`, [shareToken]);
  return result.rows[0] || null;
}

async function updateVisibility(id, { visibility, shareToken }) {
  const result = await pool.query(
    `UPDATE files
     SET visibility = $1, share_token = $2
     WHERE id = $3
     RETURNING *`,
    [visibility, shareToken, id]
  );
  return result.rows[0] || null;
}

async function deleteFile(id) {
  const result = await pool.query(`DELETE FROM files WHERE id = $1 RETURNING *`, [id]);
  return result.rows[0] || null;
}

module.exports = {
  createFile,
  findFilesByOwner,
  findFileById,
  findFileByShareToken,
  updateVisibility,
  deleteFile,
};
