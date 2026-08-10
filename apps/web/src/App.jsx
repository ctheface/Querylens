import { Link, Outlet, useLocation } from 'react-router-dom';

export default function App() {
  const { pathname } = useLocation();
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-6">
          <Link to="/sources" className="flex items-center gap-2 font-semibold text-slate-100">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-indigo-500" />
            QueryLens
          </Link>
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
          <span className="ml-auto text-xs text-slate-500">
            ask your database, in plain English
          </span>
        </div>
      </header>
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
