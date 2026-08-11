import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api.js';
import { Alert, Button, Card } from '../components/ui.jsx';

function DatabaseGlyph() {
  return (
    <span className="w-9 h-9 rounded flex items-center justify-center shrink-0 border border-ink-800 bg-ink-900">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true" className="text-ink-400">
        <ellipse cx="12" cy="5.5" rx="8" ry="3" stroke="currentColor" strokeWidth="1.5" />
        <path
          d="M4 5.5v6.5c0 1.66 3.58 3 8 3s8-1.34 8-3V5.5M4 12v6.5c0 1.66 3.58 3 8 3s8-1.34 8-3V12"
          stroke="currentColor"
          strokeWidth="1.5"
        />
      </svg>
    </span>
  );
}

function StatusBadge({ ready }) {
  if (ready) {
    return (
      <span className="inline-flex items-center gap-1.5 text-[11px] font-mono text-emerald-500">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        Ready
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] font-mono text-ink-500">
      <span className="w-1.5 h-1.5 rounded-full border border-ink-500" />
      Not introspected
    </span>
  );
}

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
    <div className="animate-rise max-w-4xl mx-auto">
      <div className="flex items-end justify-between mb-8 pb-4 border-b border-ink-900">
        <div>
          <h1 className="text-xl font-medium tracking-tight text-ink-100">Data sources</h1>
        </div>
        <Link to="/sources/new">
          <Button size="sm">
            Add Connection
          </Button>
        </Link>
      </div>

      {error && (
        <div className="mb-6">
          <Alert tone="error">{error}</Alert>
        </div>
      )}

      {sources === null ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {[0, 1].map((i) => (
            <div key={i} className="h-32 rounded-lg skeleton" />
          ))}
        </div>
      ) : sources.length === 0 ? (
        <div className="border border-ink-800 border-dashed rounded-lg p-16 text-center">
          <p className="text-ink-300 font-medium mb-2">No databases connected</p>
          <p className="text-sm text-ink-500 mb-6">
            Add a PostgreSQL connection to start querying in natural language.
          </p>
          <Link to="/sources/new">
            <Button variant="secondary">Add Connection</Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {sources.map((s) => (
            <Card
              key={s.id}
              className="p-5 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start gap-3">
                  <DatabaseGlyph />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <h2 className="font-medium text-[15px] text-ink-100 truncate">{s.name}</h2>
                      <StatusBadge ready={Boolean(s.last_introspected_at)} />
                    </div>
                    <p className="text-[12px] font-mono text-ink-500 mt-1 truncate">
                      {s.host}:{s.port}/{s.database_name}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-6 pt-4 border-t border-ink-900">
                <Link to={`/ask/${s.id}`}>
                  <Button size="sm">Query</Button>
                </Link>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleIntrospect(s.id)}
                  disabled={busyId === s.id}
                >
                  {busyId === s.id ? 'Refreshing…' : 'Refresh'}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="ml-auto !text-red-400 hover:!bg-red-950/30"
                  onClick={() => handleDelete(s.id)}
                  disabled={busyId === s.id}
                >
                  Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
