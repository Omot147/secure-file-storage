const bcrypt = require('bcryptjs');
const prisma = require('../config/prisma');
const { validateSignup, validateLogin } = require('../utils/validators');
const { signToken } = require('../utils/token');

// Controllers hold the actual logic; routes/authRoutes.js just wires
// HTTP verbs + paths to these functions. This split matters for a graded
// assessment — it shows you separate "what happens" from "how it's exposed,"
// which makes both easier to test and to reason about independently.

async function signup(req, res) {
  const errors = validateSignup(req.body);
  if (errors.length) {
    // 400, not 500 — this is the client's fault (bad input), not the server's
    return res.status(400).json({ errors });
  }

  const { name, email, password } = req.body;
  const normalizedEmail = email.toLowerCase().trim();

  // Check for an existing user BEFORE attempting the insert, so we can
  // return a clean 409 instead of letting a raw Postgres unique-constraint
  // error bubble up to the client.
  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) {
    return res.status(409).json({ errors: ['An account with that email already exists'] });
  }

  // bcrypt.hash's second argument is the "cost factor" — 12 is a common
  // production default. Higher = slower to hash = slower to brute-force,
  // but also slower for every real signup, so it's a deliberate trade-off,
  // not an arbitrary number.
  const passwordHash = await bcrypt.hash(password, 12);

  const user = await prisma.user.create({
    data: { name: name.trim(), email: normalizedEmail, passwordHash },
  });

  const token = signToken(user);

  // 201 Created, not 200 — a new resource (the user) was created
  res.status(201).json({
    token,
    user: { id: user.id, name: user.name, email: user.email }, // never send passwordHash back
  });
}

async function login(req, res) {
  const errors = validateLogin(req.body);
  if (errors.length) {
    return res.status(400).json({ errors });
  }

  const { email, password } = req.body;
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });

  // Deliberately vague error message: "Invalid email or password" for BOTH
  // "no such user" and "wrong password". If you distinguish them, an
  // attacker can use your login endpoint to enumerate which emails have
  // accounts on your system — a real information leak.
  if (!user) {
    return res.status(401).json({ errors: ['Invalid email or password'] });
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatches) {
    return res.status(401).json({ errors: ['Invalid email or password'] });
  }

  const token = signToken(user);

  res.json({
    token,
    user: { id: user.id, name: user.name, email: user.email },
  });
}

async function me(req, res) {
  // req.user is attached by the auth middleware (next file) — by the time
  // we get here, we already know the token was valid.
  res.json({ user: req.user });
}

module.exports = { signup, login, me };
