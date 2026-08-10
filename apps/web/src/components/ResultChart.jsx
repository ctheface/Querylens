import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';

function isNumeric(value) {
  if (value === null || value === undefined || value === '') return false;
  return Number.isFinite(Number(value));
}

/**
 * Picks a label column (first non-numeric) and a value column (first numeric).
 * Postgres returns NUMERIC/BIGINT as strings over JSON, so values are coerced.
 */
export function chartableShape(columns, rows) {
  if (columns.length < 2 || rows.length < 2 || rows.length > 50) return null;
  const sample = rows.slice(0, 10);
  const labelCol = columns.find((c) => sample.every((r) => !isNumeric(r[c])));
  const valueCol = columns.find(
    (c) => c !== labelCol && sample.every((r) => r[c] === null || isNumeric(r[c]))
  );
  if (!labelCol || !valueCol) return null;
  return { labelCol, valueCol };
}

export default function ResultChart({ columns, rows }) {
  const shape = chartableShape(columns, rows);
  if (!shape) return null;

  const data = rows.slice(0, 25).map((r) => ({
    label: String(r[shape.labelCol]),
    value: Number(r[shape.valueCol]),
  }));

  return (
    <div className="border border-slate-800 rounded-lg bg-slate-900/50 p-4 mt-4">
      <div className="text-xs text-slate-500 mb-2">
        {shape.valueCol} by {shape.labelCol}
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} margin={{ top: 4, right: 8, bottom: 4, left: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis
            dataKey="label"
            tick={{ fill: '#94a3b8', fontSize: 11 }}
            interval={0}
            angle={data.length > 8 ? -30 : 0}
            textAnchor={data.length > 8 ? 'end' : 'middle'}
            height={data.length > 8 ? 70 : 30}
          />
          <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} width={80} />
          <Tooltip
            contentStyle={{ background: '#0f172a', border: '1px solid #334155', fontSize: 12 }}
            labelStyle={{ color: '#e2e8f0' }}
          />
          <Bar dataKey="value" fill="#6366f1" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
