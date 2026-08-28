// The lock is the control, not a decoration next to a separate switch.
// Closed + brass = private. Open + verdigris = public. Clicking it
// performs the actual visibility change (via the onClick prop passed in).
export default function LockToggle({ isPublic, onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={isPublic ? 'Public — click to lock' : 'Private — click to unlock'}
      className="relative w-9 h-9 rounded-full flex items-center justify-center transition-colors"
      style={{
        background: isPublic ? 'rgba(78, 138, 122, 0.15)' : 'rgba(176, 141, 87, 0.12)',
      }}
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        style={{ color: isPublic ? 'var(--verdigris)' : 'var(--brass)' }}
      >
        {isPublic ? (
          // open shackle
          <path
            d="M7 10V7a5 5 0 0 1 9.584-1.984M7 10h11a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1h1z"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ) : (
          // closed shackle
          <path
            d="M7 10V7a5 5 0 0 1 10 0v3m-11 0h12a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1z"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
      </svg>
    </button>
  );
}
