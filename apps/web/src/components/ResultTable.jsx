const DISPLAY_LIMIT = 200;

export default function ResultTable({ columns, rows, rowCount, execMs }) {
  const shown = rows.slice(0, DISPLAY_LIMIT);
  return (
    <div>
      <div className="text-xs text-slate-500 mb-2">
        {rowCount} row{rowCount === 1 ? '' : 's'} in {execMs} ms
        {rows.length > DISPLAY_LIMIT && ` (showing first ${DISPLAY_LIMIT})`}
      </div>
      <div className="border border-slate-800 rounded-lg overflow-auto max-h-[28rem]">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-slate-900">
            <tr>
              {columns.map((c) => (
                <th
                  key={c}
                  className="text-left px-3 py-2 font-medium text-slate-400 border-b border-slate-800 whitespace-nowrap"
                >
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {shown.map((row, i) => (
              <tr key={i} className="odd:bg-slate-900/40">
                {columns.map((c) => (
                  <td key={c} className="px-3 py-1.5 text-slate-300 whitespace-nowrap">
                    {row[c] === null ? (
                      <span className="text-slate-600 italic">null</span>
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
