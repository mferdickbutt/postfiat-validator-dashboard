import { formatPercent, uptimeColor, uptimeBarColor } from '@/lib/statusUtils';

/**
 * UptimeCard displays uptime percentages over three rolling windows
 * with color-coded progress bars.
 *
 * Props:
 *   uptime {Object} - { last24h, last7d, last30d } (each 0.0–1.0)
 */
export default function UptimeCard({ uptime }) {
  const metrics = [
    { label: 'Last 24 Hours', value: uptime.last24h },
    { label: 'Last 7 Days', value: uptime.last7d },
    { label: 'Last 30 Days', value: uptime.last30d },
  ];

  return (
    <div className="rounded-lg border border-l-4 border-l-blue-500 bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold text-gray-900">Uptime</h2>

      <div className="space-y-4">
        {metrics.map((metric) => {
          if (metric.value === null) {
            return (
              <div key={metric.label}>
                <div className="mb-1 flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-600">{metric.label}</p>
                  <p className="text-sm italic text-gray-400">Collecting…</p>
                </div>
                <div className="h-2 w-full rounded-full bg-gray-100" />
              </div>
            );
          }
          const pct = metric.value * 100;
          return (
            <div key={metric.label}>
              <div className="mb-1 flex items-center justify-between">
                <p className="text-sm font-medium text-gray-600">{metric.label}</p>
                <p className={`text-lg font-bold ${uptimeColor(metric.value)}`}>
                  {formatPercent(metric.value)}
                </p>
              </div>
              {/* Progress bar */}
              <div className="h-2 w-full rounded-full bg-gray-200">
                <div
                  className={`h-2 rounded-full ${uptimeBarColor(metric.value)}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
