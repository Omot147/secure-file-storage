const express = require('express');
const { requireAuth } = require('../middleware/requireAuth');
const { getUploadSignature, createFileRecord } = require('../controllers/fileController');

const router = express.Router();

// Every route in this file requires a logged-in user — applying requireAuth
// once here, rather than repeating it on each route, means there's no risk
// of forgetting it on a route added later.
router.use(requireAuth);

router.get('/upload-signature', getUploadSignature); // Step 1
router.post('/', createFileRecord); // Step 2
// Day 3 adds: GET / (list mine), PATCH /:id (visibility), DELETE /:id

module.exports = router;
