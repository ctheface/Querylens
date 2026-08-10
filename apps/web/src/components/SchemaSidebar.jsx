import { useState } from 'react';

export default function SchemaSidebar({ tables }) {
  const [open, setOpen] = useState(() => new Set());

  function toggle(name) {
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  return (
    <aside className="w-60 shrink-0 border border-slate-800 rounded-lg bg-slate-900/50 p-3 self-start max-h-[75vh] overflow-y-auto">
      <h3 className="text-xs uppercase tracking-wide text-slate-500 mb-2">Schema</h3>
      {tables.length === 0 && <p className="text-xs text-slate-500">No tables found.</p>}
      <ul className="space-y-1">
        {tables.map((t) => (
          <li key={t.name}>
            <button
              onClick={() => toggle(t.name)}
              className="w-full text-left text-sm text-slate-300 hover:text-indigo-400 flex items-center gap-1"
            >
              <span className="text-slate-600 text-xs">{open.has(t.name) ? '▾' : '▸'}</span>
              {t.name}
            </button>
            {open.has(t.name) && (
              <ul className="ml-4 mt-1 mb-2 space-y-0.5">
                {t.columns.map((c) => (
                  <li key={c.name} className="text-xs text-slate-500">
                    <span className="text-slate-400">{c.name}</span> {c.type}
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </aside>
  );
}
