import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';

export default function App() {
  const { pathname } = useLocation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-6">
          <Link to="/sources" className="flex items-center gap-2 font-semibold text-slate-100">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-indigo-500" />
            QueryLens
          </Link>
          {user && (
            <nav className="flex items-center gap-4 text-sm">
              <Link
                to="/sources"
                className={
                  pathname.startsWith('/sources')
                    ? 'text-indigo-400'
                    : 'text-slate-400 hover:text-slate-200'
                }
              >
                Data sources
              </Link>
            </nav>
          )}
          <div className="ml-auto flex items-center gap-3 text-xs">
            {user ? (
              <>
                <span className="text-slate-500">{user.email}</span>
                <button
                  onClick={handleLogout}
                  className="px-2.5 py-1 rounded-md border border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-500"
                >
                  Log out
                </button>
              </>
            ) : (
              <span className="text-slate-500">ask your database, in plain English</span>
            )}
          </div>
        </div>
      </header>
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
