/**
 * governanceThresholds.js
 *
 * Network governance thresholds for validator health evaluation.
 * Each rule maps a metric check to a violation type and severity.
 */

export const THRESHOLDS = {
  UPTIME_24H_CRITICAL: 0.95,
  UPTIME_24H_WARNING: 0.98,
  UPTIME_7D_WARNING: 0.98,
  PEER_COUNT_LOW: 5,
  ANOMALY_HIGH: 0.70,
  RELIABILITY_LOW: 0.85,
  VOLATILITY_WARNING: 0.10,
  VOLATILITY_CRITICAL: 0.20,
};

/**
 * Threshold rules evaluated in order against a validator's metrics.
 * Each rule has: check(v) → boolean, type, severity, messageFn(v) → string.
 *
 * Volatility rules are handled separately in governanceTriggers.js
 * because they require anomaly history state.
 */
export const THRESHOLD_RULES = [
  {
    check: (v) => v.nodeHealth?.peerCount === 0,
    type: 'offline',
    severity: 'critical',
    messageFn: () => 'Node is offline (0 peers)',
    valueFn: (v) => v.nodeHealth?.peerCount,
  },
  {
    check: (v) => (v.uptime?.last24h ?? 1) < THRESHOLDS.UPTIME_24H_CRITICAL,
    type: 'uptime_24h_critical',
    severity: 'critical',
    messageFn: (v) =>
      `24h uptime is ${((v.uptime?.last24h ?? 0) * 100).toFixed(1)}%, below ${(THRESHOLDS.UPTIME_24H_CRITICAL * 100).toFixed(1)}%`,
    valueFn: (v) => v.uptime?.last24h,
  },
  {
    check: (v) => {
      const u = v.uptime?.last24h ?? 1;
      return u >= THRESHOLDS.UPTIME_24H_CRITICAL && u < THRESHOLDS.UPTIME_24H_WARNING;
    },
    type: 'uptime_24h_warning',
    severity: 'warning',
    messageFn: (v) =>
      `24h uptime is ${((v.uptime?.last24h ?? 0) * 100).toFixed(1)}%, below ${(THRESHOLDS.UPTIME_24H_WARNING * 100).toFixed(1)}%`,
    valueFn: (v) => v.uptime?.last24h,
  },
  {
    check: (v) => (v.uptime?.last7d ?? 1) < THRESHOLDS.UPTIME_7D_WARNING,
    type: 'uptime_7d_warning',
    severity: 'warning',
    messageFn: (v) =>
      `7d uptime is ${((v.uptime?.last7d ?? 0) * 100).toFixed(1)}%, below ${(THRESHOLDS.UPTIME_7D_WARNING * 100).toFixed(1)}%`,
    valueFn: (v) => v.uptime?.last7d,
  },
  {
    check: (v) => {
      const p = v.nodeHealth?.peerCount;
      return p != null && p > 0 && p < THRESHOLDS.PEER_COUNT_LOW;
    },
    type: 'peer_count_low',
    severity: 'warning',
    messageFn: (v) =>
      `Peer count is ${v.nodeHealth?.peerCount}, below ${THRESHOLDS.PEER_COUNT_LOW}`,
    valueFn: (v) => v.nodeHealth?.peerCount,
  },
  {
    check: (v) => (v.aiScore?.anomalyScore ?? 0) > THRESHOLDS.ANOMALY_HIGH,
    type: 'anomaly_high',
    severity: 'critical',
    messageFn: (v) =>
      `Anomaly score is ${((v.aiScore?.anomalyScore ?? 0) * 100).toFixed(1)}%, above ${(THRESHOLDS.ANOMALY_HIGH * 100).toFixed(1)}%`,
    valueFn: (v) => v.aiScore?.anomalyScore,
  },
  {
    check: (v) => (v.aiScore?.reliabilityScore ?? 1) < THRESHOLDS.RELIABILITY_LOW,
    type: 'reliability_low',
    severity: 'warning',
    messageFn: (v) =>
      `Reliability score is ${((v.aiScore?.reliabilityScore ?? 0) * 100).toFixed(1)}%, below ${(THRESHOLDS.RELIABILITY_LOW * 100).toFixed(1)}%`,
    valueFn: (v) => v.aiScore?.reliabilityScore,
  },
];
