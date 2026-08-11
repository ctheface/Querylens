import { useEffect, useState } from 'react';

export default function GoogleSignInButton() {
  const [enabled, setEnabled] = useState(null);

  useEffect(() => {
    fetch('/api/auth/providers')
      .then((r) => r.json())
      .then((d) => setEnabled(Boolean(d.google)))
      .catch(() => setEnabled(false));
  }, []);

  if (enabled === false) return null;
  if (enabled === null) {
    return <div className="mb-6 h-[42px] rounded-md skeleton" />;
  }

  return (
    <>
      <a
        href="/api/auth/google"
        className="flex items-center justify-center gap-2.5 w-full h-[42px] rounded-md border border-ink-800 bg-ink-950 hover:bg-ink-900 text-[14px] text-ink-200 font-medium transition-colors"
      >
        <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true">
          <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 8 3.1l5.7-5.7C34.5 6.1 29.5 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.5-.4-3.5z" />
          <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16.1 19 13 24 13c3.1 0 5.8 1.2 8 3.1l5.7-5.7C34.5 6.1 29.5 4 24 4 16.3 4 9.6 8.3 6.3 14.7z" />
          <path fill="#4CAF50" d="M24 44c5.2 0 10-2 13.6-5.2l-6.3-5.3C29.3 35.3 26.8 36 24 36c-5.3 0-9.7-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
          <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4.1 5.5l.1.1 6.3 5.3C39.2 36.3 44 31 44 24c0-1.3-.1-2.5-.4-3.5z" />
        </svg>
        Continue with Google
      </a>
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-ink-900" />
        </div>
        <div className="relative flex justify-center">
          <span className="px-3 bg-ink-950 text-[11px] text-ink-600">
            OR
          </span>
        </div>
      </div>
    </>
  );
}
