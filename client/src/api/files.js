import axios from 'axios';
import api from './client';

// This function is the client-side half of the two-step signed upload
// pattern from Day 2. Three network calls happen here, in order:
//   1. Ask OUR server for a signature (proves we're allowed to upload)
//   2. Upload the actual file bytes DIRECTLY to Cloudinary (our server
//      never sees or touches the file content)
//   3. Tell OUR server what happened, so it can save a database record
//
// onProgress is called repeatedly during step 2 with a number 0-100.
export async function uploadFile(file, onProgress) {
  // --- Step 1: get permission ---
  const { data: sig } = await api.get('/files/upload-signature');

  // Client-side size check BEFORE attempting a potentially huge upload —
  // this is purely for a fast, friendly error; the server re-checks this
  // independently in Step 3, so a user can't bypass the limit by editing
  // this code in devtools.
  if (file.size > sig.maxFileSize) {
    throw new Error(`File exceeds the ${Math.round(sig.maxFileSize / 1024 / 1024)}MB limit`);
  }

  // --- Step 2: upload directly to Cloudinary ---
  const formData = new FormData();
  formData.append('file', file);
  formData.append('api_key', sig.apiKey);
  formData.append('timestamp', sig.timestamp);
  formData.append('signature', sig.signature);
  formData.append('folder', sig.folder);

  const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${sig.cloudName}/auto/upload`;

  const { data: cloudinaryResult } = await axios.post(cloudinaryUrl, formData, {
    onUploadProgress: (progressEvent) => {
      // progressEvent.total can be undefined for some request types, so
      // guard against dividing by it — falling back to 0 rather than NaN
      const percent = progressEvent.total
        ? Math.round((progressEvent.loaded / progressEvent.total) * 100)
        : 0;
      onProgress(percent);
    },
  });

  // --- Step 3: tell our server, which independently re-validates ---
  const { data } = await api.post('/files', {
    filename: cloudinaryResult.original_filename + '.' + cloudinaryResult.format,
    cloudinaryId: cloudinaryResult.public_id,
    url: cloudinaryResult.secure_url,
    size: cloudinaryResult.bytes,
    mimeType: file.type, // the browser's own detected MIME type for the original File object
  });

  return data.file;
}

export const fetchMyFiles = () => api.get('/files').then((r) => r.data.files);

export const setFileVisibility = (id, visibility) =>
  api.patch(`/files/${id}`, { visibility }).then((r) => r.data.file);

export const deleteMyFile = (id) => api.delete(`/files/${id}`).then((r) => r.data);
