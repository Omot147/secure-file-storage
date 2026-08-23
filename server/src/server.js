// dotenv MUST be configured before requiring ./app or anything that reads
// process.env at import time (like config/prisma.js reading DATABASE_URL
// indirectly through Prisma's generated client) — otherwise those modules
// would see undefined env vars.
require('dotenv').config();

const app = require('./app');

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`[server] listening on http://localhost:${PORT}`);
});
