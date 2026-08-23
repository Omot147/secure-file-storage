const express = require('express');
const { signup, login, me } = require('../controllers/authController');
const { requireAuth } = require('../middleware/requireAuth');

const router = express.Router();

// Routes stay deliberately thin — one line each, all the actual logic
// lives in the controller. If a reviewer wants to understand behavior,
// they read the controller; if they want to understand your API surface,
// they read this file. Two different questions, two different files.
router.post('/signup', signup);
router.post('/login', login);
router.get('/me', requireAuth, me); // requireAuth runs first; me() only
                                      // executes if it calls next()

module.exports = router;
