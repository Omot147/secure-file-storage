const cloudinary = require('../config/cloudinary');
const {
  createFile,
  findFilesByOwner,
  findFileById,
  findFileByShareToken,
  updateVisibility,
  deleteFile,
} = require('../models/fileModel');
const { isAllowedMimeType, isWithinSizeLimit, MAX_FILE_SIZE_BYTES } = require('../utils/fileValidation');
const { generateShareToken } = require('../utils/shareToken');

// --- unchanged from Day 2 ---
async function getUploadSignature(req, res) {
  const timestamp = Math.round(Date.now() / 1000);
  const folder = `secure-file-storage/${req.user.id}`;
  const signature = cloudinary.utils.api_sign_request({ timestamp, folder }, process.env.CLOUDINARY_API_SECRET);

  res.json({
    signature,
    timestamp,
    folder,
    apiKey: process.env.CLOUDINARY_API_KEY,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    maxFileSize: MAX_FILE_SIZE_BYTES,
  });
}

async function createFileRecord(req, res) {
  const { filename, cloudinaryId, url, size, mimeType } = req.body;

  if (!filename || !cloudinaryId || !url || !size || !mimeType) {
    return res.status(400).json({ errors: ['Missing required file metadata'] });
  }
  if (!isWithinSizeLimit(size)) {
    await cloudinary.uploader.destroy(cloudinaryId).catch(() => {});
    return res.status(400).json({ errors: [`File exceeds the ${MAX_FILE_SIZE_BYTES / 1024 / 1024}MB limit`] });
  }
  if (!isAllowedMimeType(mimeType)) {
    await cloudinary.uploader.destroy(cloudinaryId).catch(() => {});
    return res.status(400).json({ errors: [`File type "${mimeType}" is not allowed`] });
  }

  const file = await createFile({ filename, cloudinaryId, url, size, mimeType, ownerId: req.user.id });
  res.status(201).json({ file });
}

// --- new for Day 3 ---

// GET /api/files — the dashboard's main listing. Always scoped to the
// logged-in user; there is no way to pass a different owner's ID in and
// see their files — req.user.id comes only from the verified JWT.
async function listMyFiles(req, res) {
  const files = await findFilesByOwner(req.user.id);
  res.json({ files });
}

// PATCH /api/files/:id — toggle a file between PUBLIC and PRIVATE.
async function setVisibility(req, res) {
  const { id } = req.params;
  const { visibility } = req.body;

  if (!['PUBLIC', 'PRIVATE'].includes(visibility)) {
    return res.status(400).json({ errors: ['visibility must be "PUBLIC" or "PRIVATE"'] });
  }

  const file = await findFileById(id);
  if (!file) {
    return res.status(404).json({ errors: ['File not found'] });
  }

  // THE core authorization check for this whole feature: only the file's
  // owner may change its visibility. Returning 404 rather than 403 here is
  // deliberate — it avoids confirming to a non-owner that a file with this
  // ID even exists at all.
  if (file.owner_id !== req.user.id) {
    return res.status(404).json({ errors: ['File not found'] });
  }

  // Generate a fresh share token when making it public, and clear the
  // token entirely when making it private — so an old link stops working
  // the moment a file is switched back to private, rather than silently
  // continuing to resolve.
  const shareToken = visibility === 'PUBLIC' ? generateShareToken() : null;

  const updated = await updateVisibility(id, { visibility, shareToken });
  res.json({ file: updated });
}

// DELETE /api/files/:id
async function removeFile(req, res) {
  const { id } = req.params;
  const file = await findFileById(id);

  if (!file || file.owner_id !== req.user.id) {
    // Same 404-not-403 reasoning as above
    return res.status(404).json({ errors: ['File not found'] });
  }

  await cloudinary.uploader.destroy(file.cloudinary_id).catch(() => {});
  await deleteFile(id);

  res.json({ message: 'File deleted' });
}

// GET /share/:token — the PUBLIC route, deliberately mounted OUTSIDE
// requireAuth (see shareRoutes.js). Anyone with a valid token can view a
// public file with no login at all — that's the whole point of a
// shareable link. The security guarantee lives entirely in this function:
// a token only ever resolves a file that is CURRENTLY marked PUBLIC.
async function resolveShareLink(req, res) {
  const { token } = req.params;
  const file = await findFileByShareToken(token);

  // Checking visibility here (not just "does a file with this token
  // exist") is what makes switching a file back to PRIVATE actually work:
  // even if a token were somehow guessed or leaked, this check refuses it
  // unless the file's current state is PUBLIC. Combined with clearing the
  // token on the PRIVATE transition above, there are two independent
  // reasons an old link stops working, not just one.
  if (!file || file.visibility !== 'PUBLIC') {
    return res.status(404).json({ errors: ['This link is invalid or no longer public'] });
  }

  res.json({
    file: {
      filename: file.filename,
      url: file.url,
      size: file.size,
      mimeType: file.mime_type,
      createdAt: file.created_at,
      // deliberately NOT returning id, cloudinary_id, or owner_id here —
      // an anonymous visitor via a share link doesn't need or get that
    },
  });
}

module.exports = {
  getUploadSignature,
  createFileRecord,
  listMyFiles,
  setVisibility,
  removeFile,
  resolveShareLink,
};
