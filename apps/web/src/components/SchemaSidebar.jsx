import { useMemo, useState } from 'react';
import { SectionLabel } from './ui.jsx';

export default function SchemaSidebar({ tables }) {
  const [open, setOpen] = useState(() => new Set());
  const [filter, setFilter] = useState('');

  const visible = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return tables;
    return tables.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.columns.some((c) => c.name.toLowerCase().includes(q))
    );
  }, [tables, filter]);

  function toggle(name) {
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  return (
    <aside className="w-64 shrink-0 self-start h-[calc(100vh-120px)] flex flex-col border-r border-ink-900 pr-6">
      <div className="mb-4">
        <SectionLabel>Schema</SectionLabel>
        <div className="mt-3 relative">
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-500"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
            <path d="m16.5 16.5 4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter tables…"
            className="w-full pl-8 pr-3 py-1.5 rounded bg-ink-950 border border-ink-800 text-[12px] text-ink-200 placeholder:text-ink-600 focus:border-ink-600 focus:outline-none transition-colors"
          />
        </div>
      </div>

      <div className="overflow-y-auto -mx-2 px-2 flex-1">
        {visible.length === 0 && (
          <p className="text-[12px] text-ink-500 mt-2">No matching tables.</p>
        )}
        <ul className="space-y-0.5">
          {visible.map((t) => {
            const expanded = open.has(t.name) || Boolean(filter.trim());
            return (
              <li key={t.name}>
                <button
                  onClick={() => toggle(t.name)}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-left text-[13px] text-ink-200 hover:bg-ink-900 transition-colors group"
                >
                  <svg
                    width="10"
                    height="10"
                    viewBox="0 0 24 24"
                    fill="none"
                    className={
                      'text-ink-600 transition-transform duration-150 ' +
                      (expanded ? 'rotate-90' : '')
                    }
                    aria-hidden="true"
                  >
                    <path d="m9 5 7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span className="font-mono text-[12px] truncate">{t.name}</span>
                </button>
                {expanded && (
                  <ul className="ml-5 mt-0.5 mb-2 border-l border-ink-900 pl-3 space-y-1">
                    {t.columns.map((c) => (
                      <li
                        key={c.name}
                        className="flex items-baseline gap-2 text-[11px]"
                      >
                        <span className="font-mono text-ink-400 truncate">{c.name}</span>
                        <span className="ml-auto font-mono text-[9px] text-ink-600 shrink-0 uppercase tracking-wider">
                          {c.type}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </aside>
  );
}
