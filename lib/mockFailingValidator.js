/**
 * mockFailingValidator.js
 *
 * A synthetic validator record that trips multiple governance thresholds.
 * Used for testing the alerting UI via ?mockFailing=true.
 */

export const MOCK_FAILING_VALIDATOR = {
  validatorId: 'nHUNTW6Q5c5TxQnJLKvQZ7Q8c5YQ9c5YQ9c5YQ9c5YQ9c5',
  isLocal: false,
  nodeHealth: {
    status: 'degraded',
    peerCount: 3,
    ledgerHeight: 89234567,
  },
  uptime: {
    last24h: 0.87,
    last7d: 0.92,
    last30d: 0.96,
  },
  aiScore: {
    performanceScore: 0.65,
    reliabilityScore: 0.78,
    anomalyScore: 0.82,
    anomalyHistory: [0.61, 0.66, 0.82],
  },
  jailState: {
    status: 'jailed',
    severity: 'critical',
    jailedAt: new Date(Date.now() - 8 * 60 * 1000).toISOString(),
    violations: [
      { type: 'uptime_24h_critical', severity: 'critical', message: '24h uptime is 87.0%, below 95.0%', value: 0.87 },
      { type: 'anomaly_high', severity: 'critical', message: 'Anomaly score is 82.0%, above 70.0%', value: 0.82 },
    ],
  },
  lastUpdated: new Date().toISOString(),
};
