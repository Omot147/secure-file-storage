# Secure File Storage Service

A full-stack application where authenticated users can upload, organize, and
share files — with private files strictly limited to their owner, and public
files accessible via a shareable link. Built as a take-home engineering
assessment.

## Stack

- **Backend:** Node.js, Express, PostgreSQL (via `pg`, hand-written SQL —
  see [Note on the database layer](#note-on-the-database-layer))
- **Frontend:** React (Vite)
- **File storage:** Cloudinary, using a signed direct-upload flow
- **Auth:** JWT + bcrypt

## Project structure

```
secure-file-storage/
├── server/
│   ├── migrations/001_init.sql      # database schema
│   ├── scripts/migrate.js            # runs the migration
│   └── src/
│       ├── config/                   # db pool, Cloudinary config
│       ├── models/                   # hand-written query functions
│       ├── controllers/              # auth + file business logic
│       ├── middleware/requireAuth.js
│       ├── routes/                   # authRoutes, fileRoutes, shareRoutes
│       ├── utils/                    # validation, JWT, share tokens
│       ├── app.js
│       └── server.js
└── client/
    └── src/
        ├── api/                       # axios client, upload flow
        ├── context/AuthContext.jsx
        ├── components/                # UploadWidget, FileRow, ProtectedRoute
        └── pages/                     # Login, Signup, Dashboard, SharePage
```

## Setup

**1. Database** — any PostgreSQL instance works (local, Supabase, Neon, etc.)

```bash
cd server
cp .env.example .env   # fill in DATABASE_URL, JWT_SECRET, CLOUDINARY_* values
npm install
npm run migrate         # creates users and files tables
npm run dev              # http://localhost:5000
```

**2. Frontend** (second terminal)

```bash
cd client
cp .env.example .env
npm install
npm run dev               # http://localhost:5173
```

Sign up, upload a file, and try toggling it public/private from the
dashboard.

## Core requirements — where each one is implemented

| Requirement | Where |
|---|---|
| Register / log in | `server/src/controllers/authController.js`, `server/src/routes/authRoutes.js` |
| Upload files (100MB+) | Signed direct-to-Cloudinary upload — `server/src/controllers/fileController.js` (`getUploadSignature`, `createFileRecord`), `client/src/api/files.js` (`uploadFile`) |
| Personal dashboard | `GET /api/files` (`listMyFiles`), `client/src/pages/Dashboard.jsx` |
| Public/private toggle | `PATCH /api/files/:id` (`setVisibility`) |
| Shareable link for public files | `GET /share/:token` (`resolveShareLink`), `client/src/pages/SharePage.jsx` |
| Private files owner-only | Ownership check in `setVisibility`/`removeFile`; see [Authorization model](#authorization-model) |
| Upload progress | `client/src/components/UploadWidget.jsx`, using axios `onUploadProgress` (not possible with `fetch`) |
| Validation & error handling | Client-side pre-check + server-side re-validation in `fileController.js`; centralized error handler in `app.js` |

## Architecture decisions worth highlighting

### Why the server never touches file bytes

A naive upload (`multer` buffering into memory, or writing to a temp disk
path) doesn't scale to 100MB files without real memory/disk pressure per
concurrent upload. Instead:

1. Client asks the server for a **signature** (`GET /api/files/upload-signature`) —
   the server signs a specific set of parameters (`timestamp`, `folder`) with
   its Cloudinary API secret, which never leaves the server.
2. Client uploads the file **directly to Cloudinary**, attaching that
   signature. Cloudinary independently re-derives the signature and rejects
   the upload if the client tried to sneak in different parameters.
3. Client reports the result back to the server, which **re-validates size
   and MIME type independently** — never trusting the client's claims — and
   deletes the Cloudinary asset immediately if either check fails, so a
   rejected upload never leaves an orphaned file in storage.

### Authorization model

- Every file record has an `owner_id`. All dashboard queries
  (`findFilesByOwner`) are scoped to `req.user.id` from the verified JWT —
  there's no code path where a client can request another user's files.
- Mutating a file (`PATCH`, `DELETE`) checks `file.owner_id === req.user.id`
  and returns **404, not 403**, when it doesn't match — this avoids
  confirming to a non-owner that a file with a given ID even exists.
- Making a file public generates a fresh, cryptographically random
  `share_token` (`crypto.randomBytes`, not `Math.random()`, since a share
  token is effectively a bearer credential). Making it private again
  **clears the token entirely** — an old link doesn't just get hidden from
  the dashboard, it stops resolving at all, checked independently by
  `resolveShareLink` re-verifying `visibility === 'PUBLIC'` even after a
  token match.

### Note on the database layer

This project was originally built with Prisma. Partway through, Prisma's
query engine binary became undownloadable in the development environment
due to a persistent DNS resolution failure for its CDN
(`binaries.prisma.sh`) — confirmed via `nslookup` and isolated to that one
domain specifically (the actual Postgres connection, tested independently
via raw TCP and `Test-NetConnection`, was never the problem).

Rather than lose more time to an environment issue outside the
application's control, the data layer was rewritten using `pg`
(node-postgres) directly: a hand-written SQL migration
(`migrations/001_init.sql`) and small, explicit query functions
(`src/models/`) in place of an ORM. Functionally equivalent to the original
Prisma schema — same tables, same constraints, same security guarantees —
just without a code-generation step that depends on an external binary
download.

## Testing performed

- Full auth flow: signup, login, invalid credentials (401), duplicate email (409)
- Upload flow: small file end-to-end, and a deliberately spoofed oversized
  `size` value confirmed to be rejected (400) with the Cloudinary asset
  actually deleted afterward
- Authorization: a second test account confirmed unable to view, modify, or
  delete the first account's files (404 in all cases)
- Share links: confirmed a public link loads with **zero** authentication
  (tested in an Incognito window), and confirmed the same link stops
  working immediately after the file is set back to private
