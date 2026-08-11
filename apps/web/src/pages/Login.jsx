import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import GoogleSignInButton from '../components/GoogleSignInButton.jsx';
import AuthShell from '../components/AuthShell.jsx';
import { Alert, Button, Field, Spinner, inputClass } from '../components/ui.jsx';

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
    <AuthShell
      title="Welcome back"
      subtitle="Log in to query your databases."
      footer={
        <>
          New here?{' '}
          <Link to="/register" className="text-ink-200 hover:text-white font-medium">
            Create an account
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
        <Field label="Password">
          <input
            required
            type="password"
            className={inputClass}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            placeholder="••••••••"
          />
        </Field>
        <Button type="submit" size="lg" disabled={busy} className="w-full mt-1">
          {busy && <Spinner />}
          {busy ? 'Logging in…' : 'Log in'}
        </Button>
      </form>
    </AuthShell>
  );
}
