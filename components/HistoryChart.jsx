/**
 * HistoryChart.jsx
 *
 * Displays 30-day historical uptime and AI score trends using Recharts.
 *
 * Props:
 *   history     {Array}  - Daily bucket objects from /history API
 *   validatorId {string} - Displayed in the card header
 */

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

function UptimeTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  const pct = d?.uptimePct;
  return (
    <div className="rounded-xl border border-[color:var(--paper-line)] bg-[rgba(255,249,240,0.96)] px-3 py-2 text-xs shadow-sm">
      <p className="mb-1 font-semibold text-[color:var(--ink)]">{d?.fullDate}</p>
      <p className="text-sky-700">
        Uptime: {pct !== null && pct !== undefined ? `${pct.toFixed(2)}%` : 'N/A'}
      </p>
      {d?.totalChecks > 0 && (
        <p className="text-[color:rgba(26,35,48,0.56)]">{d.upChecks} / {d.totalChecks} checks</p>
      )}
    </div>
  );
}

function ScoresTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const date = payload[0]?.payload?.fullDate;
  return (
    <div className="rounded-xl border border-[color:var(--paper-line)] bg-[rgba(255,249,240,0.96)] px-3 py-2 text-xs shadow-sm">
      <p className="mb-1 font-semibold text-[color:var(--ink)]">{date}</p>
      {payload.map((entry) => (
        <p key={entry.dataKey} style={{ color: entry.color }}>
          {entry.name}:{' '}
          {entry.value !== null && entry.value !== undefined
            ? `${(entry.value * 100).toFixed(1)}%`
            : 'N/A'}
        </p>
      ))}
    </div>
  );
}

export default function HistoryChart({ history, validatorId }) {
  if (!history || history.length === 0) {
    return (
      <div className="rounded-[22px] border border-[color:var(--paper-line)] bg-white/40 p-6 text-center text-sm text-[color:rgba(26,35,48,0.56)]">
        No historical data available yet. Check back after the poller accumulates data.
      </div>
    );
  }

  const chartData = history.map((d) => ({
    date: d.date.slice(5),                                        // "MM-DD"
    fullDate: d.date,
    uptimePct: d.uptime !== null ? Math.round(d.uptime * 10000) / 100 : null, // 0–100
    performanceScore: d.scores?.performanceScore ?? null,
    reliabilityScore: d.scores?.reliabilityScore ?? null,
    anomalyScore:     d.scores?.anomalyScore     ?? null,
    totalChecks: d.totalChecks,
    upChecks:    d.upChecks,
  }));

  // Show every 5th x-axis tick to avoid crowding on 30-point chart
  const xTickFormatter = (_, index) => (index % 5 === 0 ? chartData[index]?.date ?? '' : '');

  // Dynamic y-axis floor for uptime: floor to nearest 5% below min, min 80
  const validUptimes = chartData.map((d) => d.uptimePct).filter((v) => v !== null);
  const uptimeFloor = validUptimes.length
    ? Math.max(80, Math.floor(Math.min(...validUptimes) / 5) * 5)
    : 85;

  return (
    <div className="rounded-[24px] border border-[color:var(--paper-line)] bg-white/40 p-6 shadow-none backdrop-blur-sm">
      <h2 className="mb-1 text-lg font-semibold text-[color:var(--ink)]">30-Day History</h2>
      <p className="mb-6 break-all font-mono text-xs text-[color:rgba(26,35,48,0.5)]">{validatorId}</p>

      {/* ── Daily Uptime ─────────────────────────────────────────── */}
      <div className="mb-8">
        <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-[color:rgba(26,35,48,0.7)]">
          Daily Uptime
        </p>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={chartData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="uptimeGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: '#6b7280' }}
              tickFormatter={xTickFormatter}
              tickLine={false}
              interval={0}
            />
            <YAxis
              domain={[uptimeFloor, 100]}
              tickFormatter={(v) => `${v}%`}
              tick={{ fontSize: 11, fill: '#6b7280' }}
              tickLine={false}
              width={42}
            />
            <Tooltip content={<UptimeTooltip />} />
            <Area
              type="monotone"
              dataKey="uptimePct"
              stroke="#3b82f6"
              strokeWidth={2}
              fill="url(#uptimeGradient)"
              dot={false}
              connectNulls={false}
              name="Uptime"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* ── AI Score Metrics ─────────────────────────────────────── */}
      <div>
        <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-[color:rgba(26,35,48,0.7)]">
          AI Score Metrics
        </p>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={chartData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: '#6b7280' }}
              tickFormatter={xTickFormatter}
              tickLine={false}
              interval={0}
            />
            <YAxis
              domain={[0, 1]}
              tickFormatter={(v) => `${Math.round(v * 100)}%`}
              tick={{ fontSize: 11, fill: '#6b7280' }}
              tickLine={false}
              width={42}
            />
            <Tooltip content={<ScoresTooltip />} />
            <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
            <Line
              type="monotone"
              dataKey="performanceScore"
              stroke="#10b981"
              strokeWidth={2}
              dot={false}
              connectNulls={false}
              name="Performance"
            />
            <Line
              type="monotone"
              dataKey="reliabilityScore"
              stroke="#8b5cf6"
              strokeWidth={1.5}
              dot={false}
              connectNulls={false}
              strokeDasharray="4 2"
              name="Reliability"
            />
            <Line
              type="monotone"
              dataKey="anomalyScore"
              stroke="#ef4444"
              strokeWidth={2}
              dot={false}
              connectNulls={false}
              name="Anomaly"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
