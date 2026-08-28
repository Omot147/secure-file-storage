const express = require('express');
const { requireAuth } = require('../middleware/requireAuth');
const {
  getUploadSignature,
  createFileRecord,
  listMyFiles,
  setVisibility,
  removeFile,
} = require('../controllers/fileController');

const router = express.Router();

// Every route below requires a logged-in user.
router.use(requireAuth);

router.get('/upload-signature', getUploadSignature);
router.post('/', createFileRecord);
router.get('/', listMyFiles);              // dashboard listing
router.patch('/:id', setVisibility);       // public/private toggle
router.delete('/:id', removeFile);

module.exports = router;
