import { formatPercent } from '@/lib/statusUtils';

/**
 * AIScoringCard displays AI-derived performance, reliability, and anomaly scores
 * with color-coded progress bars. Anomaly > 0.7 is highlighted in red.
 *
 * Props:
 *   aiScore {Object} - { performanceScore, reliabilityScore, anomalyScore } (each 0.0–1.0)
 */
export default function AIScoringCard({ aiScore }) {
  const { performanceScore, reliabilityScore, anomalyScore } = aiScore;
  const isAnomalyHigh = anomalyScore > 0.7;

  return (
    <div className="rounded-lg border border-l-4 border-l-purple-500 bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold text-gray-900">AI Scoring</h2>

      <div className="space-y-4">
        {/* Performance Score */}
        <div>
          <div className="mb-1 flex items-center justify-between">
            <p className="text-sm font-medium text-gray-600">Performance</p>
            <p className="text-lg font-bold text-green-600">
              {formatPercent(performanceScore)}
            </p>
          </div>
          <div className="h-2 w-full rounded-full bg-gray-200">
            <div
              className="h-2 rounded-full bg-green-500"
              style={{ width: `${performanceScore * 100}%` }}
            />
          </div>
        </div>

        {/* Reliability Score */}
        <div>
          <div className="mb-1 flex items-center justify-between">
            <p className="text-sm font-medium text-gray-600">Reliability</p>
            <p className="text-lg font-bold text-green-600">
              {formatPercent(reliabilityScore)}
            </p>
          </div>
          <div className="h-2 w-full rounded-full bg-gray-200">
            <div
              className="h-2 rounded-full bg-green-500"
              style={{ width: `${reliabilityScore * 100}%` }}
            />
          </div>
        </div>

        {/* Anomaly Score — highlighted red if > 0.7 */}
        <div>
          <div className="mb-1 flex items-center justify-between">
            <p className="text-sm font-medium text-gray-600">Anomaly</p>
            <div className="flex items-center gap-2">
              {isAnomalyHigh && (
                <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
                  HIGH
                </span>
              )}
              <p
                className={`text-lg font-bold ${
                  isAnomalyHigh ? 'text-red-600' : 'text-gray-700'
                }`}
              >
                {formatPercent(anomalyScore)}
              </p>
            </div>
          </div>
          <div className="h-2 w-full rounded-full bg-gray-200">
            <div
              className={`h-2 rounded-full ${isAnomalyHigh ? 'bg-red-500' : 'bg-gray-400'}`}
              style={{ width: `${anomalyScore * 100}%` }}
            />
          </div>
          {isAnomalyHigh && (
            <p className="mt-1 text-xs text-red-600">
              Anomaly score exceeds 0.7 threshold — node is flagged as degraded.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
