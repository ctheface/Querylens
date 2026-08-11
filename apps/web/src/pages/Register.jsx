import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import GoogleSignInButton from '../components/GoogleSignInButton.jsx';
import AuthShell from '../components/AuthShell.jsx';
import { Alert, Button, Field, Spinner, inputClass } from '../components/ui.jsx';

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
    <AuthShell
      title="Create your account"
      subtitle="Connect databases and ask questions in plain English."
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="text-ink-200 hover:text-white font-medium">
            Log in
          </Link>
        </>
      }
    >
      {error && (
        <div className="mb-5">
          <Alert tone="error">{error}</Alert>
        </div>
      )}

      <GoogleSignInButton />

      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Name">
          <input
            required
            className={inputClass}
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
            placeholder="Ada Lovelace"
          />
        </Field>
        <Field label="Email">
          <input
            required
            type="email"
            className={inputClass}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            placeholder="you@company.com"
          />
        </Field>
        <Field label="Password" hint="min 8 characters">
          <input
            required
            type="password"
            minLength={8}
            className={inputClass}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            placeholder="••••••••"
          />
        </Field>
        <Button type="submit" size="lg" disabled={busy} className="w-full mt-1">
          {busy && <Spinner />}
          {busy ? 'Creating account…' : 'Sign up'}
        </Button>
      </form>
    </AuthShell>
  );
}
