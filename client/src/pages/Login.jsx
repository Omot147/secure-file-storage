import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(form);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.errors?.[0] || 'Login failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm">
        <h1 className="font-display text-2xl mb-1" style={{ color: 'var(--paper)' }}>
          Enter the vault
        </h1>
        <p className="text-sm mb-6" style={{ color: 'var(--muted)' }}>Sign in to your deposits</p>

        {error && (
          <p className="text-sm mb-4 font-mono" style={{ color: 'var(--alert)' }}>{error}</p>
        )}

        <input
          type="email"
          placeholder="email"
          required
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="w-full rounded px-3 py-2 text-sm mb-3 outline-none"
          style={{ background: 'var(--panel)', border: '1px solid var(--hairline)', color: 'var(--paper)' }}
        />
        <input
          type="password"
          placeholder="password"
          required
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          className="w-full rounded px-3 py-2 text-sm mb-5 outline-none"
          style={{ background: 'var(--panel)', border: '1px solid var(--hairline)', color: 'var(--paper)' }}
        />

        <button
          type="submit"
          disabled={submitting}
          className="w-full font-display py-2.5 rounded"
          style={{ background: 'var(--brass)', color: 'var(--steel)' }}
        >
          {submitting ? 'Verifying…' : 'Sign in'}
        </button>

        <p className="text-sm mt-4" style={{ color: 'var(--muted)' }}>
          No account? <Link to="/signup" style={{ color: 'var(--brass-bright)' }}>Create one</Link>
        </p>
      </form>
    </div>
  );
}
