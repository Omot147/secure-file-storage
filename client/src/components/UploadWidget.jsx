import { useState, useRef } from 'react';
import { uploadFile } from '../api/files';

const MAX_SIZE_BYTES = 100 * 1024 * 1024;

export default function UploadWidget({ onUploaded }) {
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef(null);

  const runUpload = async (file) => {
    setError('');
    if (file.size > MAX_SIZE_BYTES) {
      setError(`"${file.name}" is ${(file.size / 1024 / 1024).toFixed(1)}MB — the vault's limit is 100MB.`);
      return;
    }
    setUploading(true);
    setProgress(0);
    try {
      const savedFile = await uploadFile(file, setProgress);
      onUploaded(savedFile);
    } catch (err) {
      setError(err.response?.data?.errors?.[0] || err.message || 'Deposit failed — try again');
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) runUpload(file);
    e.target.value = '';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file) runUpload(file);
  };

  return (
    <div className="mb-8">
      <div
        onClick={() => !uploading && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        className="rounded-lg px-6 py-8 text-center cursor-pointer transition-colors"
        style={{
          border: `2px dashed ${dragActive ? 'var(--brass-bright)' : 'var(--brass)'}`,
          background: dragActive ? 'rgba(176, 141, 87, 0.08)' : 'transparent',
          opacity: uploading ? 0.6 : 1,
        }}
      >
        <input ref={inputRef} type="file" onChange={handleFileChange} disabled={uploading} className="hidden" />

        {!uploading && (
          <>
            <p className="font-display text-lg" style={{ color: 'var(--brass-bright)' }}>
              Insert a file to deposit it
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
              click, or drag a file here · up to 100MB
            </p>
          </>
        )}

        {uploading && (
          <div>
            <p className="font-mono text-sm mb-2" style={{ color: 'var(--brass-bright)' }}>
              depositing… {progress}%
            </p>
            <div className="h-1.5 rounded-full overflow-hidden mx-auto max-w-xs" style={{ background: 'var(--hairline)' }}>
              <div
                className="h-full transition-all duration-200"
                style={{ width: `${progress}%`, background: 'var(--brass)' }}
              />
            </div>
          </div>
        )}
      </div>

      {error && (
        <p className="text-sm mt-2 font-mono" style={{ color: 'var(--alert)' }}>
          {error}
        </p>
      )}
    </div>
  );
}
