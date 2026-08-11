import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../lib/api.js';
import { Alert, Button, Card, Field, Spinner, inputClass } from '../components/ui.jsx';

const initial = {
  name: '',
  host: '',
  port: 5432,
  database: '',
  username: '',
  password: '',
  sslMode: 'require',
};

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
    <div className="max-w-[500px] mx-auto animate-rise">
      <div className="mb-6 pb-4 border-b border-ink-900">
        <Link
          to="/sources"
          className="inline-flex items-center gap-1 text-[12px] text-ink-500 hover:text-ink-300 transition-colors mb-2"
        >
          ← Back to sources
        </Link>
        <h1 className="text-xl font-medium tracking-tight text-ink-100">
          Add Connection
        </h1>
      </div>

      {error && (
        <div className="mb-6">
          <Alert tone="error">{error}</Alert>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <Field label="Name">
          <input
            required
            className={inputClass}
            placeholder="Production DB"
            value={form.name}
            onChange={set('name')}
          />
        </Field>

        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2">
            <Field label="Host">
              <input
                required
                className={inputClass}
                placeholder="db.example.com"
                value={form.host}
                onChange={set('host')}
              />
            </Field>
          </div>
          <Field label="Port">
            <input
              required
              type="number"
              className={inputClass}
              value={form.port}
              onChange={set('port')}
            />
          </Field>
        </div>

        <Field label="Database">
          <input
            required
            className={inputClass}
            placeholder="postgres"
            value={form.database}
            onChange={set('database')}
          />
        </Field>

        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Username">
            <input
              required
              className={inputClass}
              placeholder="readonly_user"
              value={form.username}
              onChange={set('username')}
            />
          </Field>
          <Field label="Password">
            <input
              required
              type="password"
              className={inputClass}
              placeholder="••••••••"
              value={form.password}
              onChange={set('password')}
            />
          </Field>
        </div>

        <Field label="SSL">
          <select className={inputClass} value={form.sslMode} onChange={set('sslMode')}>
            <option value="require">Require</option>
            <option value="disable">Disable</option>
          </select>
        </Field>

        <div className="pt-4 flex items-center gap-3">
          <Button type="submit" size="md" disabled={busy}>
            {busy ? 'Testing…' : 'Save Connection'}
          </Button>
          <Link to="/sources">
            <Button type="button" variant="ghost" size="md">
              Cancel
            </Button>
          </Link>
        </div>
      </form>
    </div>
  );
}
