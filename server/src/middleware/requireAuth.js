const prisma = require('../config/prisma');
const { verifyToken } = require('../utils/token');

// This is the gatekeeper every protected route runs through. It does three
// things in order: (1) find the token, (2) verify it's genuine and unexpired,
// (3) confirm the user it claims to be still actually exists in the DB.
async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization; // expected format: "Bearer <token>"

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ errors: ['No token provided'] });
  }

  const token = authHeader.split(' ')[1];

  let decoded;
  try {
    decoded = verifyToken(token);
  } catch (err) {
    // jwt.verify throws for both "malformed token" and "expired token" —
    // both cases mean the same thing to the client: log in again.
    return res.status(401).json({ errors: ['Invalid or expired token'] });
  }

  // Why re-fetch the user instead of trusting the JWT payload alone: if this
  // user's account were deleted after the token was issued, the token would
  // still verify successfully (it's cryptographically valid) but the account
  // is gone. This DB check is what actually catches that case.
  const user = await prisma.user.findUnique({
    where: { id: decoded.id },
    select: { id: true, name: true, email: true }, // never select passwordHash here
  });

  if (!user) {
    return res.status(401).json({ errors: ['User no longer exists'] });
  }

  req.user = user; // now every downstream handler can read req.user
  next();
}

module.exports = { requireAuth };
