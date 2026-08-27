const bcrypt = require('bcryptjs');
const { createUser, findUserByEmail } = require('../models/userModel');
const { validateSignup, validateLogin } = require('../utils/validators');
const { signToken } = require('../utils/token');

// Same logic as the Prisma version — only the data-access calls changed
// (createUser/findUserByEmail from our own userModel, instead of
// prisma.user.create/findUnique).

async function signup(req, res) {
  const errors = validateSignup(req.body);
  if (errors.length) return res.status(400).json({ errors });

  const { name, email, password } = req.body;
  const normalizedEmail = email.toLowerCase().trim();

  const existing = await findUserByEmail(normalizedEmail);
  if (existing) {
    return res.status(409).json({ errors: ['An account with that email already exists'] });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await createUser({ name: name.trim(), email: normalizedEmail, passwordHash });

  const token = signToken(user);
  res.status(201).json({ token, user: { id: user.id, name: user.name, email: user.email } });
}

async function login(req, res) {
  const errors = validateLogin(req.body);
  if (errors.length) return res.status(400).json({ errors });

  const { email, password } = req.body;
  const user = await findUserByEmail(email.toLowerCase().trim());

  // Same deliberately-vague error for both cases — see Day 1 notes on why
  if (!user) return res.status(401).json({ errors: ['Invalid email or password'] });

  const passwordMatches = await bcrypt.compare(password, user.password_hash);
  // note: user.password_hash (snake_case) — pg returns raw column names,
  // unlike Prisma which auto-converts to camelCase via the @map directives
  if (!passwordMatches) return res.status(401).json({ errors: ['Invalid email or password'] });

  const token = signToken(user);
  res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
}

async function me(req, res) {
  res.json({ user: req.user });
}

module.exports = { signup, login, me };
