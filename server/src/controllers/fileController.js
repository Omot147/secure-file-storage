const cloudinary = require('../config/cloudinary');
const prisma = require('../config/prisma');
const { isAllowedMimeType, isWithinSizeLimit, MAX_FILE_SIZE_BYTES } = require('../utils/fileValidation');

// --- STEP 1: the client asks us for permission to upload ---
//
// The client can't upload straight to Cloudinary with just their API key —
// that key is public-ish and doesn't prove anything on its own. Instead, we
// sign a specific set of upload parameters with our CLOUDINARY_API_SECRET
// (which never leaves the server), and the client sends that signature
// along with the upload. Cloudinary independently recomputes the signature
// on their end and rejects the upload if it doesn't match — so the client
// can only upload with exactly the parameters we agreed to, nothing else.
async function getUploadSignature(req, res) {
  const timestamp = Math.round(Date.now() / 1000);

  // Every authenticated user's files live under their own folder. This
  // isn't a security boundary by itself (Cloudinary folders aren't access
  // control), but it keeps your Cloudinary media library organized and
  // makes bulk operations (e.g. "delete everything for this user") simple.
  const folder = `secure-file-storage/${req.user.id}`;

  const paramsToSign = { timestamp, folder };

  // api_sign_request hashes exactly these params with your API secret.
  // Whatever you sign here is the ONLY thing Cloudinary will accept —
  // if the client tries to sneak in a different folder or extra params
  // on the actual upload request, Cloudinary's own signature check fails it.
  const signature = cloudinary.utils.api_sign_request(paramsToSign, process.env.CLOUDINARY_API_SECRET);

  res.json({
    signature,
    timestamp,
    folder,
    apiKey: process.env.CLOUDINARY_API_KEY,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    maxFileSize: MAX_FILE_SIZE_BYTES, // client uses this to reject oversized files before even trying
  });
}

// --- STEP 2: the client uploaded directly to Cloudinary, and now tells us
// what happened so we can save a record of it ---
//
// We do NOT blindly trust whatever the client reports here. We re-verify
// size and type ourselves, and if either check fails, we immediately
// destroy the asset on Cloudinary rather than just refusing to save a
// row — otherwise a malicious client could upload something oversized or
// disallowed, have us reject the metadata, and the actual file bytes would
// still sit in your Cloudinary storage forever, invisible to your app but
// still costing you storage.
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

  const file = await prisma.file.create({
    data: {
      filename,
      cloudinaryId,
      url,
      size,
      mimeType,
      ownerId: req.user.id, // taken from the authenticated session, never from the request body —
      // otherwise a client could claim ownership of a file on someone else's behalf
    },
  });

  res.status(201).json({ file });
}

module.exports = { getUploadSignature, createFileRecord };
