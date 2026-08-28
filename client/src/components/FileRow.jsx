import { useState } from 'react';
import { setFileVisibility, deleteMyFile } from '../api/files';
import LockToggle from './LockToggle';

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

// Each file renders as a numbered safety-deposit-box plate. The box number
// isn't decorative — it's the file's position in the list, giving the
// dashboard the feel of a real vault wall of numbered boxes rather than a
// generic table row.
export default function FileRow({ file, index, onChange, onDelete }) {
  const [busy, setBusy] = useState(false);
  const isPublic = file.visibility === 'PUBLIC';
  const shareUrl = file.share_token ? `${window.location.origin}/share/${file.share_token}` : null;

  const toggleVisibility = async () => {
    setBusy(true);
    try {
      const updated = await setFileVisibility(file.id, isPublic ? 'PRIVATE' : 'PUBLIC');
      onChange(updated);
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Remove "${file.filename}" from the vault? This can't be undone.`)) return;
    setBusy(true);
    try {
      await deleteMyFile(file.id);
      onDelete(file.id);
    } finally {
      setBusy(false);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl);
  };

  return (
    <div className="plate flex items-center gap-4 px-4 py-3 mb-2">
      <span className="plate-number w-14 shrink-0">No. {String(index + 1).padStart(3, '0')}</span>

      <LockToggle isPublic={isPublic} onClick={toggleVisibility} disabled={busy} />

      <a href={file.url} target="_blank" rel="noreferrer" className="flex-1 min-w-0">
        <p className="truncate text-[15px] font-medium" style={{ color: 'var(--paper)' }}>
          {file.filename}
        </p>
        <p className="font-mono text-xs" style={{ color: 'var(--muted)' }}>
          {formatSize(file.size)} · {isPublic ? 'unlocked' : 'locked'}
        </p>
      </a>

      {isPublic && (
        <button
          onClick={copyLink}
          className="font-mono text-xs px-3 py-1.5 rounded border transition-colors"
          style={{ borderColor: 'var(--verdigris)', color: 'var(--verdigris)' }}
        >
          copy link
        </button>
      )}

      <button
        onClick={handleDelete}
        disabled={busy}
        className="font-mono text-xs px-3 py-1.5 rounded border transition-colors"
        style={{ borderColor: 'var(--hairline)', color: 'var(--alert)' }}
      >
        remove
      </button>
    </div>
  );
}
