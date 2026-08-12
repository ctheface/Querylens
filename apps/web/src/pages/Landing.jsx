import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Button } from '../components/ui.jsx';

export default function Landing() {
  const { user, initializing } = useAuth();

  if (!initializing && user) {
    return <Navigate to="/sources" replace />;
  }

  return (
    <div className="flex flex-col items-center justify-center pt-20 pb-16 animate-rise">
      
      {/* Hero Section */}
      <div className="text-center max-w-2xl px-4">
        <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-ink-100 mb-6 leading-tight">
          Query your database in <br className="hidden sm:block" /> natural language.
        </h1>
        <p className="text-[15px] text-ink-400 mb-10 leading-relaxed max-w-[500px] mx-auto">
          QueryLens translates plain English into secure, read-only PostgreSQL queries with semantic caching and AST validation.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link to="/register">
            <Button size="lg" className="h-11 px-5">Get Started</Button>
          </Link>
          <Link to="/demo">
            <Button variant="secondary" size="lg" className="h-11 px-5">
              Try the live demo
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Button>
          </Link>
        </div>
        <p className="mt-4">
          <a
            href="https://github.com/ctheface/Querylens"
            target="_blank"
            rel="noreferrer"
            className="text-[12px] text-ink-500 hover:text-ink-300 transition-colors"
          >
            View source on GitHub →
          </a>
        </p>
        <div className="mt-8 inline-flex items-start gap-2.5 rounded-md border border-ink-800 bg-ink-900/40 px-4 py-3 text-left max-w-md mx-auto">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            className="shrink-0 mt-0.5 text-ink-500"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v4M12 16h.01" />
          </svg>
          <p className="text-[12px] text-ink-400 leading-relaxed">
            The backend runs on Render's free tier and sleeps after 15 minutes of
            inactivity. If the site feels unresponsive, give it 2–3 minutes to wake
            up and try again.
          </p>
        </div>
      </div>

      {/* Mock Terminal Graphic */}
      <div className="mt-20 w-full max-w-4xl px-4">
        <div className="rounded-xl border border-ink-800 bg-ink-950 shadow-[0_20px_60px_var(--shadow-color)] overflow-hidden">
          <div className="flex items-center px-4 h-12 border-b border-ink-900 bg-ink-900/40">
             <div className="flex gap-2">
               <div className="w-2.5 h-2.5 rounded-full bg-ink-700" />
               <div className="w-2.5 h-2.5 rounded-full bg-ink-700" />
               <div className="w-2.5 h-2.5 rounded-full bg-ink-700" />
             </div>
             <div className="mx-auto text-[11px] font-mono text-ink-500">querylens-demo</div>
          </div>
          <div className="p-6 md:p-8 font-mono text-[13px] leading-relaxed">
            <div className="flex gap-4">
               <span className="text-ink-600 select-none">~</span>
               <span className="text-ink-200">What are the top 5 products by revenue?</span>
            </div>
            <div className="flex gap-4 mt-6">
               <span className="text-ink-600 select-none">»</span>
               <div className="text-iris-500">
                  SELECT<br/>
                  &nbsp;&nbsp;p.name AS product_name,<br/>
                  &nbsp;&nbsp;SUM(oi.quantity * oi.unit_price) AS total_revenue<br/>
                  FROM order_items oi<br/>
                  JOIN products p ON oi.product_id = p.id<br/>
                  GROUP BY 1<br/>
                  ORDER BY 2 DESC<br/>
                  LIMIT 5;
               </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid md:grid-cols-3 gap-8 max-w-5xl px-4 mt-24">
         <div>
            <div className="w-10 h-10 rounded border border-ink-800 flex items-center justify-center mb-4 text-ink-100">
               <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                 <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                 <path d="M12 8v4l3 3" />
               </svg>
            </div>
            <h3 className="text-[15px] font-medium text-ink-100 mb-2">Natural Language</h3>
            <p className="text-[13px] text-ink-400 leading-relaxed">
               Skip the syntax. QueryLens uses large language models to accurately translate complex questions into optimized Postgres SQL.
            </p>
         </div>
         <div>
            <div className="w-10 h-10 rounded border border-ink-800 flex items-center justify-center mb-4 text-ink-100">
               <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                 <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
               </svg>
            </div>
            <h3 className="text-[15px] font-medium text-ink-100 mb-2">Secure & Read-Only</h3>
            <p className="text-[13px] text-ink-400 leading-relaxed">
               Every query runs through a strict AST validator (<code className="font-mono text-ink-300">libpg-query</code>) and executes inside a timed, <code className="font-mono text-ink-300">READ ONLY</code> transaction block.
            </p>
         </div>
         <div>
            <div className="w-10 h-10 rounded border border-ink-800 flex items-center justify-center mb-4 text-ink-100">
               <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                 <path d="M13 2 4.5 13.5H11L10 22l8.5-11.5H13L13 2Z" />
               </svg>
            </div>
            <h3 className="text-[15px] font-medium text-ink-100 mb-2">Semantic Caching</h3>
            <p className="text-[13px] text-ink-400 leading-relaxed">
               Similar questions reuse past SQL answers instantly. Redis vector search intercepts paraphrased questions, bypassing the LLM entirely.
            </p>
         </div>
      </div>

      {/* How to connect */}
      <div className="w-full max-w-3xl px-4 mt-28">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-semibold tracking-tight text-ink-100 mb-3">
            Connect any PostgreSQL database
          </h2>
          <p className="text-[14px] text-ink-400 leading-relaxed max-w-xl mx-auto">
            Your data does not need to live on Supabase. Neon, RDS, Railway, a VPS, or local Postgres all work — as long as the QueryLens API can reach the host.
          </p>
        </div>

        <ol className="space-y-5 text-[14px]">
          {[
            {
              title: 'Create an account',
              body: 'Sign up with email or Google, then open Data sources.',
            },
            {
              title: 'Add a connection',
              body: 'Enter host, port, database name, username, password, and SSL mode. QueryLens tests the connection before saving.',
            },
            {
              title: 'Refresh the schema',
              body: 'Introspection loads your tables and columns so the model knows what it can query.',
            },
            {
              title: 'Ask in plain English',
              body: 'Questions become validated, read-only SQL. Prefer a SELECT-only database user when you can.',
            },
          ].map((step, i) => (
            <li
              key={step.title}
              className="flex gap-4 rounded-lg border border-ink-800 bg-ink-900/40 p-4"
            >
              <span className="shrink-0 w-7 h-7 rounded-md border border-ink-700 bg-ink-950 text-[12px] font-mono text-ink-300 flex items-center justify-center">
                {i + 1}
              </span>
              <div>
                <p className="font-medium text-ink-100 mb-0.5">{step.title}</p>
                <p className="text-[13px] text-ink-400 leading-relaxed">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>

        <p className="text-center text-[12px] text-ink-500 mt-8 leading-relaxed">
          Tip: for hosted databases use SSL <span className="font-mono text-ink-400">require</span>.
          For Postgres on the same machine as the API, SSL can be <span className="font-mono text-ink-400">disable</span>.
        </p>
      </div>
    </div>
  );
}
