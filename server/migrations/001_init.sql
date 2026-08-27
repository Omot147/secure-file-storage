-- Run this once against your database to create the schema.
-- Equivalent to what Prisma's `migrate dev` would have generated —
-- writing it by hand means no dependency on Prisma's engine binary at all.

CREATE EXTENSION IF NOT EXISTS "pgcrypto"; -- provides gen_random_uuid()

CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  name          TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TYPE visibility_type AS ENUM ('PUBLIC', 'PRIVATE');

CREATE TABLE IF NOT EXISTS files (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename       TEXT NOT NULL,
  cloudinary_id  TEXT NOT NULL,
  url            TEXT NOT NULL,
  size           INTEGER NOT NULL,
  mime_type      TEXT NOT NULL,
  visibility     visibility_type NOT NULL DEFAULT 'PRIVATE',
  share_token    TEXT UNIQUE, -- nullable; only set when made public
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  owner_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
);

-- Same reasoning as the Prisma schema: this is the app's hottest query
-- ("give me this user's files, newest first"), so it gets an index.
CREATE INDEX IF NOT EXISTS idx_files_owner_created ON files (owner_id, created_at DESC);
