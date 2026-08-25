const crypto = require('crypto');

// crypto.randomBytes, not Math.random() — Math.random() is not
// cryptographically secure and its output is predictable enough to be
// brute-forced given enough samples. A share token is effectively a
// bearer credential (whoever has it can view the file), so it needs to
// come from a secure random source.
function generateShareToken() {
  return crypto.randomBytes(24).toString('hex'); // 48 hex characters
}

module.exports = { generateShareToken };
