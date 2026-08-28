const express = require('express');
const { resolveShareLink } = require('../controllers/fileController');

const router = express.Router();

// No requireAuth here — that's the entire point. Anyone with the link can
// view a public file with zero authentication. Keeping this in its own
// file (rather than adding an "exception" route inside fileRoutes.js,
// which is entirely behind router.use(requireAuth)) makes it visually
// obvious, just from the project structure, which routes are public and
// which aren't — a reviewer scanning routes/ doesn't have to read every
// line to know that.
router.get('/:token', resolveShareLink);

module.exports = router;
