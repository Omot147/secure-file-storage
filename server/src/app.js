const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const authRoutes = require('./routes/authRoutes');

const app = express();

// Splitting app.js from server.js (next file) is a small but deliberate
// choice: this file builds the Express app and exports it without ever
// calling .listen(). That means an automated test suite could import
// `app` and hit it with supertest, without a real server needing to bind
// a port. server.js is the only file that actually starts listening.

app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

app.use('/api/auth', authRoutes);
// Day 2 adds: app.use('/api/files', fileRoutes);
// Day 3 adds: app.use('/api/share', shareRoutes);

// 404 handler — catches any request that didn't match a route above
app.use((req, res) => {
  res.status(404).json({ errors: ['Route not found'] });
});

// Centralized error handler — Express recognizes this as an error handler
// specifically because it takes 4 arguments (err, req, res, next), even
// though `next` is unused. Any route that calls next(err), or any thrown
// error in an async handler wrapped properly, ends up here instead of
// crashing the process or leaking a stack trace to the client.
app.use((err, req, res, next) => {
  console.error(err);
  const status = err.status || 500;
  res.status(status).json({ errors: [err.message || 'Internal server error'] });
});

module.exports = app;
