const cloudinary = require('cloudinary').v2;

// Configured once at import time from env vars. Every controller that
// needs Cloudinary imports this same configured instance — same singleton
// reasoning as config/prisma.js.
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true, // always generate https:// URLs, never http://
});

module.exports = cloudinary;
