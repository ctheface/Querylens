import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Alert, Spinner } from '../components/ui.jsx';

/**
 * Landing page after Google OAuth. The API already set the httpOnly refresh
 * cookie; we exchange it for an access token and enter the app.
 */
export default function AuthCallback() {
  const { user, initializing, adoptSession } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState(null);

  useEffect(() => {
    if (initializing) return;
    if (user) {
      navigate('/sources', { replace: true });
      return;
    }

    let cancelled = false;
    (async () => {
      const restored = await adoptSession();
      if (cancelled) return;
      if (restored) {
        navigate('/sources', { replace: true });
      } else {
        setError('Google sign-in did not complete. Please try again.');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [initializing, user, adoptSession, navigate]);

  if (error) {
    return (
      <div className="max-w-sm mx-auto mt-20 text-center animate-rise">
        <Alert tone="error">{error}</Alert>
        <a
          href="/login"
          className="inline-block mt-4 text-sm text-iris-400 hover:text-iris-300 font-medium"
        >
          Back to login
        </a>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3 mt-28 text-ink-400">
      <Spinner className="w-6 h-6 text-iris-400" />
      <p className="text-sm">Finishing Google sign-in…</p>
    </div>
  );
}
