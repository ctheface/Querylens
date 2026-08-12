import { Link, NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import { useTheme } from './context/ThemeContext.jsx';
import { Logo, Wordmark } from './components/ui.jsx';

function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  // `theme` can be 'system' — resolve what is actually on screen so the
  // toggle always flips the visible theme (and shows the right icon).
  const effective =
    theme === 'system'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
      : theme;

  return (
    <button
      onClick={() => setTheme(effective === 'dark' ? 'light' : 'dark')}
      className="p-1.5 text-ink-500 hover:text-ink-200 transition-colors"
      aria-label="Toggle theme"
    >
      {effective === 'dark' ? (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="5"/>
          <path d="M12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4"/>
        </svg>
      ) : (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
        </svg>
      )}
    </button>
  );
}

export default function App() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isLanding = location.pathname === '/';
  // Pages with the fixed bottom composer — the footer would sit behind it.
  const hasComposer =
    location.pathname.startsWith('/ask/') || location.pathname === '/demo';

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  return (
    <div className="min-h-screen flex flex-col font-sans">
      <header className={`sticky top-0 z-20 ${isLanding ? 'bg-ink-950/80 backdrop-blur' : 'border-b border-ink-900 bg-ink-950'}`}>
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2 group opacity-90 hover:opacity-100 transition-opacity">
            <Logo size={18} />
            <Wordmark />
          </Link>

          {user && !isLanding && (
            <nav className="flex items-center gap-2 text-[13px]">
              <NavLink
                to="/sources"
                className={({ isActive }) =>
                  'px-2 py-1 rounded transition-colors ' +
                  (isActive
                    ? 'text-ink-100 bg-ink-900'
                    : 'text-ink-400 hover:text-ink-200')
                }
              >
                Sources
              </NavLink>
            </nav>
          )}

          <div className="ml-auto flex items-center gap-4">
            <ThemeToggle />
            
            {user ? (
              <>
                {!isLanding && <span className="text-[13px] text-ink-400 hidden sm:inline-block">{user.email}</span>}
                {isLanding && (
                  <Link to="/sources" className="text-[13px] font-medium text-ink-100 hover:text-ink-400 transition-colors">
                    Go to app &rarr;
                  </Link>
                )}
                <button
                  onClick={handleLogout}
                  className="text-[13px] text-ink-500 hover:text-ink-200 transition-colors"
                >
                  Log out
                </button>
              </>
            ) : (
              <Link to="/login" className="text-[13px] text-ink-400 hover:text-ink-100">
                Sign in
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-8 flex flex-col">
        <Outlet />
      </main>

      {!hasComposer && (
        <footer className="border-t border-ink-900 mt-auto">
          <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between text-[12px] text-ink-600">
            <span>QueryLens</span>
            <span>Queries execute in read-only mode</span>
          </div>
        </footer>
      )}
    </div>
  );
}
