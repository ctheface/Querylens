import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api.js';

export default function Sources() {
  const [sources, setSources] = useState(null);
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null);

  async function load() {
    try {
      setSources(await api.listSources());
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleIntrospect(id) {
    setBusyId(id);
    setError(null);
    try {
      await api.introspect(id);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this data source?')) return;
    setBusyId(id);
    try {
      await api.deleteSource(id);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-slate-100">Data sources</h1>
        <Link
          to="/sources/new"
          className="px-3 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium"
        >
          + Connect a database
        </Link>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-md border border-red-800 bg-red-950/50 text-red-300 text-sm">
          {error}
        </div>
      )}

      {sources === null ? (
        <p className="text-slate-500">Loading…</p>
      ) : sources.length === 0 ? (
        <div className="border border-dashed border-slate-700 rounded-lg p-10 text-center">
          <p className="text-slate-400 mb-2">No databases connected yet.</p>
          <p className="text-sm text-slate-500">
            Connect a PostgreSQL database and start asking questions in plain English.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {sources.map((s) => (
            <div key={s.id} className="border border-slate-800 rounded-lg bg-slate-900/50 p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="font-medium text-slate-100">{s.name}</h2>
                  <p className="text-xs text-slate-500 mt-1">
                    {s.host}:{s.port} / {s.database_name}
                  </p>
                  <p className="text-xs text-slate-500">
                    user <span className="text-slate-400">{s.username}</span>
                  </p>
                </div>
                <span
                  className={
                    'text-xs px-2 py-0.5 rounded-full ' +
                    (s.last_introspected_at
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-900'
                      : 'bg-amber-950 text-amber-400 border border-amber-900')
                  }
                >
                  {s.last_introspected_at ? 'schema ready' : 'not introspected'}
                </span>
              </div>
              <div className="flex gap-2 mt-4">
                <Link
                  to={`/ask/${s.id}`}
                  className="px-3 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium"
                >
                  Ask questions
                </Link>
                <button
                  onClick={() => handleIntrospect(s.id)}
                  disabled={busyId === s.id}
                  className="px-3 py-1.5 rounded-md border border-slate-700 hover:border-slate-500 text-xs text-slate-300 disabled:opacity-50"
                >
                  {busyId === s.id ? 'Working…' : 'Refresh schema'}
                </button>
                <button
                  onClick={() => handleDelete(s.id)}
                  disabled={busyId === s.id}
                  className="ml-auto px-3 py-1.5 rounded-md border border-red-900 text-red-400 hover:bg-red-950/40 text-xs disabled:opacity-50"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
