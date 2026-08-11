import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import GoogleSignInButton from '../components/GoogleSignInButton.jsx';

const fieldClass =
  'w-full px-3 py-2 rounded-md bg-slate-900 border border-slate-700 focus:border-indigo-500 ' +
  'focus:outline-none text-sm text-slate-200 placeholder:text-slate-600';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(searchParams.get('error'));
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await login(email, password);
      navigate('/sources');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-sm mx-auto mt-16">
      <h1 className="text-xl font-semibold text-slate-100 mb-1">Welcome back</h1>
      <p className="text-sm text-slate-500 mb-6">Log in to query your databases.</p>

      {error && (
        <div className="mb-4 p-3 rounded-md border border-red-800 bg-red-950/50 text-red-300 text-sm">
          {error}
        </div>
      )}

      <GoogleSignInButton />

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs text-slate-400 mb-1">Email</label>
          <input
            required
            type="email"
            className={fieldClass}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">Password</label>
          <input
            required
            type="password"
            className={fieldClass}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
        </div>
        <button
          type="submit"
          disabled={busy}
          className="w-full px-4 py-2 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium disabled:opacity-50"
        >
          {busy ? 'Logging in…' : 'Log in'}
        </button>
      </form>

      <p className="text-sm text-slate-500 mt-4">
        New here?{' '}
        <Link to="/register" className="text-indigo-400 hover:underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}
