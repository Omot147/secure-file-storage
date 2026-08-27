const cloudinary = require('../config/cloudinary');
const { createFile } = require('../models/fileModel');
const { isAllowedMimeType, isWithinSizeLimit, MAX_FILE_SIZE_BYTES } = require('../utils/fileValidation');

// Signature generation is completely unchanged — it never touched Prisma
// at all, since it doesn't read/write the database.
async function getUploadSignature(req, res) {
  const timestamp = Math.round(Date.now() / 1000);
  const folder = `secure-file-storage/${req.user.id}`;
  const paramsToSign = { timestamp, folder };

  const signature = cloudinary.utils.api_sign_request(paramsToSign, process.env.CLOUDINARY_API_SECRET);

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

module.exports = { getUploadSignature, createFileRecord };
