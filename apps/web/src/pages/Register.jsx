import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import GoogleSignInButton from '../components/GoogleSignInButton.jsx';

const fieldClass =
  'w-full px-3 py-2 rounded-md bg-slate-900 border border-slate-700 focus:border-indigo-500 ' +
  'focus:outline-none text-sm text-slate-200 placeholder:text-slate-600';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await register(name, email, password);
      navigate('/sources');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-sm mx-auto mt-16">
      <h1 className="text-xl font-semibold text-slate-100 mb-1">Create your account</h1>
      <p className="text-sm text-slate-500 mb-6">
        Connect databases and ask questions in plain English.
      </p>

      {error && (
        <div className="mb-4 p-3 rounded-md border border-red-800 bg-red-950/50 text-red-300 text-sm">
          {error}
        </div>
      )}

      <GoogleSignInButton />

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs text-slate-400 mb-1">Name</label>
          <input
            required
            className={fieldClass}
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
          />
        </div>
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
          <label className="block text-xs text-slate-400 mb-1">Password (min 8 characters)</label>
          <input
            required
            type="password"
            minLength={8}
            className={fieldClass}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
          />
        </div>
        <button
          type="submit"
          disabled={busy}
          className="w-full px-4 py-2 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium disabled:opacity-50"
        >
          {busy ? 'Creating account…' : 'Sign up'}
        </button>
      </form>

      <p className="text-sm text-slate-500 mt-4">
        Already have an account?{' '}
        <Link to="/login" className="text-indigo-400 hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
