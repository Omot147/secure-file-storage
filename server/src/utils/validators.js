// Small, dependency-free validators. For a bigger app you'd reach for a
// library like Zod or Joi, but at this scale hand-rolling them keeps the
// logic visible and easy for a reviewer to audit line by line.

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateSignup({ name, email, password }) {
  const errors = [];

  if (!name || name.trim().length < 2) {
    errors.push('Name must be at least 2 characters');
  }
  if (!email || !EMAIL_REGEX.test(email)) {
    errors.push('A valid email is required');
  }
  if (!password || password.length < 8) {
    // 8, not 6 — this app stores files, arguably more sensitive than a to-do
    // list, so the minimum bar for password strength should reflect that
    errors.push('Password must be at least 8 characters');
  }

  return errors; // empty array = valid
}

function validateLogin({ email, password }) {
  const errors = [];
  if (!email) errors.push('Email is required');
  if (!password) errors.push('Password is required');
  return errors;
}

module.exports = { validateSignup, validateLogin };
