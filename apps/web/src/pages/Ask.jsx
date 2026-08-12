import { useEffect, useState, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../lib/api.js';
import SchemaSidebar from '../components/SchemaSidebar.jsx';
import ResultTable from '../components/ResultTable.jsx';
import ResultChart from '../components/ResultChart.jsx';
import { Alert, Button, SectionLabel, Spinner } from '../components/ui.jsx';

const EXAMPLES = [
  'What are the top 5 products by total revenue?',
  'Which region had the most orders in the last 90 days?',
  'How many customers signed up each month this year?',
];

export default function Ask({ demo = false }) {
  const { dataSourceId } = useParams();
  const [schema, setSchema] = useState(null);
  const [schemaError, setSchemaError] = useState(null);

  const [question, setQuestion] = useState('');
  const [sqlText, setSqlText] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const textareaRef = useRef(null);

  useEffect(() => {
    const load = demo ? api.demoSchema() : api.getSchema(dataSourceId);
    load.then(setSchema).catch((err) => setSchemaError(err.message));
  }, [dataSourceId, demo]);

  async function handleAsk(e) {
    e?.preventDefault();
    if (!question.trim() || busy || !schema) return;
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const data = demo
        ? await api.demoAsk({ question })
        : await api.ask({ dataSourceId: Number(dataSourceId), question });
      setResult(data);
      setSqlText(data.sql);
    } catch (err) {
      setError(err);
      if (err.sql) setSqlText(err.sql);
    } finally {
      setBusy(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAsk();
    }
  }

  async function handleRun() {
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const data = demo
        ? await api.demoRun({ sql: sqlText })
        : await api.run({ dataSourceId: Number(dataSourceId), sql: sqlText });
      setResult(data);
      setSqlText(data.sql);
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(sqlText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  }

  // Auto-resize textarea; allow scrolling once the 200px cap is reached.
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(200, Math.max(52, el.scrollHeight))}px`;
    el.style.overflowY = el.scrollHeight > 200 ? 'auto' : 'hidden';
  }, [question]);

  if (schemaError) {
    return (
      <div className="max-w-md mx-auto text-center py-20 animate-rise">
        <Alert tone="error">{schemaError}</Alert>
        <Link
          to={demo ? '/' : '/sources'}
          className="inline-block mt-4 text-[13px] text-ink-300 hover:text-ink-100"
        >
          &larr; {demo ? 'Back home' : 'Back to sources'}
        </Link>
      </div>
    );
  }

  return (
    <div className="flex gap-10 animate-rise">
      {schema ? (
        <SchemaSidebar tables={schema.tables} />
      ) : (
        <div className="hidden lg:block w-64 shrink-0 h-96 rounded bg-ink-900/30 animate-pulse" />
      )}

      <div className="flex-1 min-w-0 flex flex-col pb-32">
        <div className="mb-6">
          {demo ? (
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[11px] font-mono uppercase tracking-wider px-2 py-0.5 rounded border border-ink-700 text-ink-400">
                Live demo
              </span>
              <span className="text-[12px] text-ink-500">
                Sample e-commerce data, read-only.{' '}
                <Link to="/register" className="text-ink-300 hover:text-ink-100 underline underline-offset-2">
                  Sign up
                </Link>{' '}
                to connect your own database.
              </span>
            </div>
          ) : (
            <Link
              to="/sources"
              className="inline-flex items-center gap-1.5 text-[12px] text-ink-500 hover:text-ink-300 transition-colors mb-3"
            >
              ← Back to sources
            </Link>
          )}
          <h1 className="text-xl font-medium tracking-tight text-ink-100">
            {schema ? schema.name : 'Loading…'}
          </h1>
        </div>

        {error && (
          <div className="mb-6">
            <Alert tone="error" title={error.code ?? 'Error'}>
              — {error.message}
              {error.code && error.code.startsWith('E_') && error.sql && (
                <span className="block text-[12px] opacity-70 mt-1">
                  The generated SQL was placed in the editor below — you can fix and re-run it.
                </span>
              )}
            </Alert>
          </div>
        )}

        {result?.cache?.hit && (
          <div className="mb-6 flex items-center gap-3 rounded border border-ink-800 bg-ink-900/50 px-4 py-3 text-[12px] text-ink-300">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="shrink-0 text-ink-500" aria-hidden="true">
              <path d="M13 2 4.5 13.5H11L10 22l8.5-11.5H13L13 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
            </svg>
            <span>
              Answered from cache
              {result.cache.exact
                ? ' — exact match.'
                : ` — ${Math.round(result.cache.similarity * 100)}% match to “${result.cache.matchedQuestion}”.`}
            </span>
          </div>
        )}

        {result && (
          <div className="mb-8">
            <ResultChart columns={result.columns} rows={result.rows} />
            <ResultTable
              columns={result.columns}
              rows={result.rows}
              rowCount={result.rowCount}
              execMs={result.execMs}
            />
          </div>
        )}

        {/* SQL editor */}
        {sqlText && (
          <div className="mb-8 rounded border border-ink-800 bg-ink-950 overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-2 border-b border-ink-900 bg-ink-900/30">
              <SectionLabel>SQL</SectionLabel>
              <div className="ml-auto flex items-center gap-3">
                <button
                  onClick={handleCopy}
                  className="text-[11px] text-ink-500 hover:text-ink-300 transition-colors"
                >
                  {copied ? 'Copied' : 'Copy'}
                </button>
                <button 
                  onClick={handleRun} 
                  disabled={busy}
                  className="text-[11px] text-ink-100 font-medium hover:underline disabled:opacity-50"
                >
                  {busy ? 'Running…' : 'Run'}
                </button>
              </div>
            </div>
            <textarea
              rows={Math.min(12, Math.max(3, sqlText.split('\n').length))}
              value={sqlText}
              onChange={(e) => setSqlText(e.target.value)}
              spellCheck={false}
              className="w-full px-4 py-3 bg-transparent text-[13px] leading-[1.6] font-mono text-ink-200 focus:outline-none resize-y"
            />
          </div>
        )}

        {!result && !sqlText && !error && schema && (
          <div className="my-auto py-20 text-center">
            <div className="w-12 h-12 rounded-full bg-ink-900 mx-auto flex items-center justify-center mb-4">
               <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-ink-500">
                  <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M12 8v4l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
               </svg>
            </div>
            <p className="text-[14px] text-ink-300 font-medium">Ready to query</p>
            <p className="text-[13px] text-ink-500 mt-1">Ask a question below to generate SQL.</p>
          </div>
        )}
        
        {/* Floating Input Area (Cursor/ChatGPT style) */}
        <div className="fixed bottom-0 left-0 right-0 z-10 p-4 pb-6 bg-ink-950/80 backdrop-blur-md border-t border-ink-900 pointer-events-none flex justify-center">
          <div className="w-full max-w-3xl pointer-events-auto">
            {!result && !sqlText && !busy && schema && (
            <div className="flex gap-2 mb-3 overflow-x-auto justify-center px-4 no-scrollbar max-w-full">
              {EXAMPLES.map((ex) => (
                <button
                  key={ex}
                  type="button"
                  onClick={() => setQuestion(ex)}
                  className="shrink-0 text-[11px] text-ink-400 hover:text-ink-200 border border-ink-800 bg-ink-900/50 hover:bg-ink-800 rounded-full px-3 py-1.5 whitespace-nowrap transition-colors"
                >
                  {ex}
                </button>
              ))}
            </div>
            )}
            <form onSubmit={handleAsk} className="relative shadow-2xl shadow-black/50">
              <textarea
                ref={textareaRef}
                rows={1}
                required
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask anything..."
                className="w-full pl-5 pr-14 py-4 rounded-xl bg-ink-900 border border-ink-700 text-[14px] text-ink-100 placeholder:text-ink-500 focus:border-ink-500 focus:outline-none resize-none"
                style={{ minHeight: '52px', maxHeight: '200px' }}
              />
              <button 
                type="submit" 
                disabled={busy || !schema || !question.trim()}
                className="absolute right-3 bottom-3 w-8 h-8 rounded-lg flex items-center justify-center bg-ink-100 text-ink-950 hover:bg-white disabled:opacity-50 disabled:bg-ink-800 disabled:text-ink-500 transition-colors"
              >
                {busy ? <Spinner className="w-4 h-4" /> : (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                )}
              </button>
            </form>
            <div className="text-center mt-2">
               <span className="text-[10px] text-ink-600">Press Enter to ask, Shift+Enter for newline</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
