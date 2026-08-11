const DISPLAY_LIMIT = 200;

function isNumeric(value) {
  return value !== null && value !== '' && Number.isFinite(Number(value));
}

export default function ResultTable({ columns, rows, rowCount, execMs }) {
  const shown = rows.slice(0, DISPLAY_LIMIT);
  return (
    <div className="border border-ink-800 rounded bg-ink-950/50">
      <div className="flex items-center gap-4 px-4 py-2 border-b border-ink-800 text-[11px] font-mono text-ink-500">
        <span>
          <span className="text-ink-300">{rowCount}</span> row{rowCount === 1 ? '' : 's'}
        </span>
        <span>
          <span className="text-ink-300">{execMs}</span> ms
        </span>
        {rows.length > DISPLAY_LIMIT && (
          <span className="ml-auto">showing first {DISPLAY_LIMIT}</span>
        )}
      </div>
      <div className="overflow-auto max-h-[400px]">
        <table className="w-full text-[12px]">
          <thead className="sticky top-0 z-10 bg-ink-900">
            <tr>
              {columns.map((c) => (
                <th
                  key={c}
                  className="text-left px-4 py-2 font-mono font-medium text-[11px] text-ink-400 border-b border-ink-800 whitespace-nowrap"
                >
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {shown.map((row, i) => (
              <tr
                key={i}
                className="border-b border-ink-900 last:border-0 hover:bg-ink-900/50 transition-colors"
              >
                {columns.map((c) => (
                  <td
                    key={c}
                    className={
                      'px-4 py-2 whitespace-nowrap ' +
                      (isNumeric(row[c])
                        ? 'font-mono text-ink-200 tabular-nums'
                        : 'text-ink-300')
                    }
                  >
                    {row[c] === null ? (
                      <span className="text-ink-600 italic">null</span>
                    ) : (
                      String(row[c])
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
