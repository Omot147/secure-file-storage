import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../api/client';

export default function SharePage() {
  const { token } = useParams();
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get(`${API_BASE_URL}/share/${token}`)
      .then((res) => setFile(res.data.file))
      .catch((err) => setError(err.response?.data?.errors?.[0] || 'This link is invalid'))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="font-mono text-sm" style={{ color: 'var(--muted)' }}>Checking the vault…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="plate px-8 py-10 text-center max-w-sm">
          <p className="font-display text-xl mb-2" style={{ color: 'var(--alert)' }}>Locked</p>
          <p className="text-sm" style={{ color: 'var(--muted)' }}>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="plate px-8 py-10 text-center max-w-sm w-full">
        <p className="font-mono text-[10px] uppercase tracking-widest mb-3" style={{ color: 'var(--verdigris)' }}>
          shared from the vault
        </p>
        <h1 className="font-display text-xl mb-1 break-words" style={{ color: 'var(--paper)' }}>
          {file.filename}
        </h1>
        <p className="font-mono text-xs mb-6" style={{ color: 'var(--muted)' }}>
          {(file.size / 1024).toFixed(1)} KB
        </p>
        <a href={file.url} target="_blank" rel="noreferrer">
          <button
            className="font-display px-6 py-2.5 rounded"
            style={{ background: 'var(--verdigris)', color: 'var(--steel)' }}
          >
            View file
          </button>
        </a>
      </div>
    </div>
  );
}
