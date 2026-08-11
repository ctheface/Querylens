import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

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
      <div className="max-w-sm mx-auto mt-16 text-center">
        <p className="text-red-300 text-sm mb-4">{error}</p>
        <a href="/login" className="text-indigo-400 hover:underline text-sm">
          Back to login
        </a>
      </div>
    );
  }

  return <p className="text-center text-slate-500 mt-24">Finishing Google sign-in…</p>;
}
