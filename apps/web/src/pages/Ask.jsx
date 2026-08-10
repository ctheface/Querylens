import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../lib/api.js';
import SchemaSidebar from '../components/SchemaSidebar.jsx';
import ResultTable from '../components/ResultTable.jsx';
import ResultChart from '../components/ResultChart.jsx';

const EXAMPLES = [
  'What are the top 5 products by total revenue?',
  'Which region had the most orders in the last 90 days?',
  'How many customers signed up each month this year?',
];

export default function Ask() {
  const { dataSourceId } = useParams();
  const [schema, setSchema] = useState(null);
  const [schemaError, setSchemaError] = useState(null);

  const [question, setQuestion] = useState('');
  const [sqlText, setSqlText] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api
      .getSchema(dataSourceId)
      .then(setSchema)
      .catch((err) => setSchemaError(err.message));
  }, [dataSourceId]);

  async function handleAsk(e) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const data = await api.ask({ dataSourceId: Number(dataSourceId), question });
      setResult(data);
      setSqlText(data.sql);
    } catch (err) {
      setError(err);
      if (err.sql) setSqlText(err.sql);
    } finally {
      setBusy(false);
    }
  }

  async function handleRun() {
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const data = await api.run({ dataSourceId: Number(dataSourceId), sql: sqlText });
      setResult(data);
      setSqlText(data.sql);
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  }

  if (schemaError) {
    return (
      <div className="max-w-lg mx-auto text-center py-16">
        <p className="text-red-400 mb-3">{schemaError}</p>
        <Link to="/sources" className="text-sm text-indigo-400 hover:underline">
          Back to data sources
        </Link>
      </div>
    );
  }

  return (
    <div className="flex gap-6">
      {schema && <SchemaSidebar tables={schema.tables} />}

      <div className="flex-1 min-w-0">
        <div className="mb-4">
          <h1 className="text-lg font-semibold text-slate-100">
            {schema ? schema.name : 'Loading…'}
          </h1>
          <p className="text-xs text-slate-500">Ask a question about this database.</p>
        </div>

        <form onSubmit={handleAsk} className="mb-4">
          <textarea
            rows={2}
            required
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="e.g. Which regions dropped in revenue last quarter?"
            className="w-full px-3 py-2 rounded-md bg-slate-900 border border-slate-700 focus:border-indigo-500 focus:outline-none text-sm text-slate-200 placeholder:text-slate-600 resize-none"
          />
          <div className="flex items-center gap-3 mt-2">
            <button
              type="submit"
              disabled={busy || !schema}
              className="px-4 py-2 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium disabled:opacity-50"
            >
              {busy ? 'Thinking…' : 'Ask'}
            </button>
            <div className="flex gap-2 overflow-x-auto">
              {EXAMPLES.map((ex) => (
                <button
                  key={ex}
                  type="button"
                  onClick={() => setQuestion(ex)}
                  className="text-xs text-slate-500 hover:text-slate-300 border border-slate-800 rounded-full px-2.5 py-1 whitespace-nowrap"
                >
                  {ex}
                </button>
              ))}
            </div>
          </div>
        </form>

        {error && (
          <div className="mb-4 p-3 rounded-md border border-red-800 bg-red-950/50 text-sm">
            <span className="text-red-300 font-medium">{error.code ?? 'Error'}</span>
            <span className="text-red-300"> — {error.message}</span>
            {error.code && error.code.startsWith('E_') && error.sql && (
              <p className="text-xs text-red-400/70 mt-1">
                The generated SQL was placed in the editor below - you can fix and re-run it.
              </p>
            )}
          </div>
        )}

        {sqlText && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs uppercase tracking-wide text-slate-500">
                Generated SQL (editable)
              </label>
              <button
                onClick={handleRun}
                disabled={busy}
                className="text-xs px-3 py-1 rounded-md border border-slate-700 hover:border-indigo-500 text-slate-300 disabled:opacity-50"
              >
                {busy ? 'Running…' : 'Run SQL'}
              </button>
            </div>
            <textarea
              rows={Math.min(10, Math.max(3, sqlText.split('\n').length))}
              value={sqlText}
              onChange={(e) => setSqlText(e.target.value)}
              spellCheck={false}
              className="w-full px-3 py-2 rounded-md bg-slate-900 border border-slate-800 focus:border-indigo-500 focus:outline-none text-xs font-mono text-emerald-300"
            />
          </div>
        )}

        {result && (
          <>
            <ResultTable
              columns={result.columns}
              rows={result.rows}
              rowCount={result.rowCount}
              execMs={result.execMs}
            />
            <ResultChart columns={result.columns} rows={result.rows} />
          </>
        )}
      </div>
    </div>
  );
}
