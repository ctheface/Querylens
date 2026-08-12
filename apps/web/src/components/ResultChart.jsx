import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { SectionLabel } from './ui.jsx';

function isNumeric(value) {
  if (value === null || value === undefined || value === '') return false;
  return Number.isFinite(Number(value));
}

// 60000000 → "60M" so wide values don't overflow the axis gutter.
const compact = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 });
const full = new Intl.NumberFormat('en');

/**
 * Picks a label column (first non-numeric) and a value column (first numeric).
 */
export function chartableShape(columns, rows) {
  if (columns.length < 2 || rows.length < 2 || rows.length > 50) return null;
  const sample = rows.slice(0, 10);
  const labelCol = columns.find((c) => sample.every((r) => !isNumeric(r[c])));
  const numericCols = columns.filter(
    (c) => c !== labelCol && sample.every((r) => r[c] === null || isNumeric(r[c]))
  );
  // Prefer a measure over identifiers: "SELECT id, name, revenue" should
  // chart revenue, not id.
  const idLike = (c) => /^id$|_id$|^#/i.test(c);
  const valueCol = numericCols.find((c) => !idLike(c)) ?? numericCols[0];
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
    <div className="border border-ink-800 rounded p-6 mb-8 bg-ink-950/30">
      <div className="mb-6">
        <SectionLabel>
          {shape.valueCol} / {shape.labelCol}
        </SectionLabel>
      </div>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--ink-800)" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: 'var(--ink-400)', fontSize: 11, fontFamily: 'JetBrains Mono' }}
            axisLine={{ stroke: 'var(--ink-800)' }}
            tickLine={false}
            interval={0}
            angle={data.length > 8 ? -30 : 0}
            textAnchor={data.length > 8 ? 'end' : 'middle'}
            height={data.length > 8 ? 60 : 30}
          />
          <YAxis
            tick={{ fill: 'var(--ink-400)', fontSize: 11, fontFamily: 'JetBrains Mono' }}
            axisLine={false}
            tickLine={false}
            width={60}
            tickFormatter={(v) => compact.format(v)}
          />
          <Tooltip
            cursor={{ fill: 'var(--ink-800)' }}
            contentStyle={{
              background: 'var(--ink-950)',
              border: '1px solid var(--ink-800)',
              borderRadius: 4,
              fontSize: 12,
              fontFamily: 'JetBrains Mono'
            }}
            labelStyle={{ color: 'var(--ink-100)', marginBottom: 4 }}
            itemStyle={{ color: 'var(--ink-200)' }}
            formatter={(v) => full.format(v)}
          />
          <Bar dataKey="value" fill="var(--ink-200)" maxBarSize={40} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
