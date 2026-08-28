import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchMyFiles } from '../api/files';
import UploadWidget from '../components/UploadWidget';
import FileRow from '../components/FileRow';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyFiles().then(setFiles).finally(() => setLoading(false));
  }, []);

  const handleUploaded = (newFile) => setFiles((prev) => [newFile, ...prev]);
  const handleChange = (updated) => setFiles((prev) => prev.map((f) => (f.id === updated.id ? updated : f)));
  const handleDelete = (id) => setFiles((prev) => prev.filter((f) => f.id !== id));

  return (
    <div className="min-h-screen px-4 py-10 md:px-8">
      <div className="max-w-2xl mx-auto">
        <header className="flex items-end justify-between mb-10">
          <div>
            <h1 className="font-display text-3xl" style={{ color: 'var(--paper)' }}>
              The Vault
            </h1>
            <p className="font-mono text-xs mt-1" style={{ color: 'var(--muted)' }}>
              {user.email}
            </p>
          </div>
          <button
            onClick={logout}
            className="font-mono text-xs px-3 py-1.5 rounded border"
            style={{ borderColor: 'var(--hairline)', color: 'var(--muted)' }}
          >
            sign out
          </button>
        </header>

        <UploadWidget onUploaded={handleUploaded} />

        {loading && <p className="font-mono text-sm" style={{ color: 'var(--muted)' }}>Opening the vault…</p>}
        {!loading && files.length === 0 && (
          <p className="font-mono text-sm" style={{ color: 'var(--muted)' }}>
            No deposits yet — the vault is empty.
          </p>
        )}

        {files.map((file, i) => (
          <FileRow key={file.id} file={file} index={i} onChange={handleChange} onDelete={handleDelete} />
        ))}
      </div>
    </div>
  );
}
