// Centralizing these constants means Day 2 (initial upload) and Day 3
// (any re-validation) both read from one place — no risk of the limit
// drifting between two copy-pasted numbers.

const MAX_FILE_SIZE_BYTES = 100 * 1024 * 1024; // 100 MB, per the spec

// An allowlist, not a blocklist. Blocking known-bad extensions means you're
// always one step behind whatever gets invented next; allowing only known-
// safe types means anything unrecognized is rejected by default. Extend
// this list deliberately as real needs come up, not preemptively.
const ALLOWED_MIME_TYPES = new Set([
  // images
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  // documents
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'text/csv',
  // archives
  'application/zip',
  'application/x-zip-compressed',
  // video/audio
  'video/mp4',
  'video/quicktime',
  'audio/mpeg',
  'audio/wav',
]);

function isAllowedMimeType(mimeType) {
  return ALLOWED_MIME_TYPES.has(mimeType);
}

function isWithinSizeLimit(sizeBytes) {
  return typeof sizeBytes === 'number' && sizeBytes > 0 && sizeBytes <= MAX_FILE_SIZE_BYTES;
}

module.exports = { MAX_FILE_SIZE_BYTES, ALLOWED_MIME_TYPES, isAllowedMimeType, isWithinSizeLimit };
