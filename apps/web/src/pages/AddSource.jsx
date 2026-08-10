import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../lib/api.js';

const initial = {
  name: '',
  host: '',
  port: 5432,
  database: '',
  username: '',
  password: '',
  sslMode: 'require',
};

const fieldClass =
  'w-full px-3 py-2 rounded-md bg-slate-900 border border-slate-700 focus:border-indigo-500 ' +
  'focus:outline-none text-sm text-slate-200 placeholder:text-slate-600';

export default function AddSource() {
  const [form, setForm] = useState(initial);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  function set(key) {
    return (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api.createSource({ ...form, port: Number(form.port) });
      navigate('/sources');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-xl font-semibold text-slate-100 mb-1">Connect a database</h1>
      <p className="text-sm text-slate-500 mb-6">
        The connection is tested before anything is saved. Credentials are encrypted at rest.
        Use a read-only database user if you have one.
      </p>

      {error && (
        <div className="mb-4 p-3 rounded-md border border-red-800 bg-red-950/50 text-red-300 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs text-slate-400 mb-1">Display name</label>
          <input required className={fieldClass} placeholder="Demo store" value={form.name} onChange={set('name')} />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <label className="block text-xs text-slate-400 mb-1">Host</label>
            <input required className={fieldClass} placeholder="aws-0-ap-south-1.pooler.supabase.com" value={form.host} onChange={set('host')} />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1">Port</label>
            <input required type="number" className={fieldClass} value={form.port} onChange={set('port')} />
          </div>
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">Database</label>
          <input required className={fieldClass} placeholder="postgres" value={form.database} onChange={set('database')} />
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">Username</label>
          <input required className={fieldClass} placeholder="querylens_ro.<project-ref>" value={form.username} onChange={set('username')} />
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">Password</label>
          <input required type="password" className={fieldClass} value={form.password} onChange={set('password')} />
        </div>
        <div>
          <label className="block text-xs text-slate-400 mb-1">SSL</label>
          <select className={fieldClass} value={form.sslMode} onChange={set('sslMode')}>
            <option value="require">require (hosted databases)</option>
            <option value="disable">disable (local only)</option>
          </select>
        </div>
        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={busy}
            className="px-4 py-2 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium disabled:opacity-50"
          >
            {busy ? 'Testing connection…' : 'Test & save'}
          </button>
          <Link to="/sources" className="text-sm text-slate-500 hover:text-slate-300">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
