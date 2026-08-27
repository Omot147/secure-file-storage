const { findUserById } = require('../models/userModel');
const { verifyToken } = require('../utils/token');

async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ errors: ['No token provided'] });
  }

  const token = authHeader.split(' ')[1];

  let decoded;
  try {
    decoded = verifyToken(token);
  } catch (err) {
    return res.status(401).json({ errors: ['Invalid or expired token'] });
  }

  const user = await findUserById(decoded.id); // same re-fetch-from-DB reasoning as before
  if (!user) {
    return res.status(401).json({ errors: ['User no longer exists'] });
  }

  req.user = user;
  next();
}

module.exports = { requireAuth };
