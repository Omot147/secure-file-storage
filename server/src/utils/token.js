const jwt = require('jsonwebtoken');

// Centralizing this in one file means if you ever change what goes into
// the token payload, or switch signing algorithms, there's exactly one
// place to update — not scattered jwt.sign() calls across route files.
function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email }, // keep the payload minimal —
    // never put the password hash or anything sensitive in a JWT; it's
    // base64-encoded, not encrypted, so anyone with the token can read this
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

function verifyToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET); // throws if invalid/expired —
  // callers are expected to try/catch this, which is what the auth
  // middleware does next
}

module.exports = { signToken, verifyToken };
