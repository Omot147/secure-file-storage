const { PrismaClient } = require('@prisma/client');

// Why a singleton: with nodemon restarting your server on every file save,
// creating `new PrismaClient()` inside a route file would open a fresh pool
// of DB connections on every hot-reload, and you'd eventually hit Postgres's
// connection limit. Creating it once here and importing this file everywhere
// means one connection pool for the whole app's lifetime.
const prisma = new PrismaClient();

module.exports = prisma;
