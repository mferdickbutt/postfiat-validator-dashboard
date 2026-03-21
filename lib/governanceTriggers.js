/**
 * governanceTriggers.js
 *
 * Evaluates validator metrics against governance thresholds and builds
 * structured trigger payloads for UNL review decisions.
 */

import { THRESHOLDS, THRESHOLD_RULES } from './governanceThresholds';

/**
 * Compute the median of a numeric array.
 * @param {number[]} arr
 * @returns {number}
 */
function median(arr) {
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

/**
 * Evaluate a validator's metrics against all governance thresholds.
 *
 * @param {Object} validator - Validator data with nodeHealth, uptime, aiScore
 * @param {number[]|null} anomalyHistory - Recent anomaly scores (oldest first),
 *   used to compute volatility. Pass null to skip volatility checks.
 * @returns {{
 *   isFlagged: boolean,
 *   severity: 'critical'|'warning'|null,
 *   violations: Array<{type: string, severity: string, message: string, value: number}>,
 *   governanceStatus: 'critical'|'warning'|'healthy',
 *   flaggedAt: string|null
 * }}
 */
export function evaluateGovernanceThresholds(validator, anomalyHistory = null) {
  const violations = [];

  // Evaluate static threshold rules
  for (const rule of THRESHOLD_RULES) {
    if (rule.check(validator)) {
      violations.push({
        type: rule.type,
        severity: rule.severity,
        message: rule.messageFn(validator),
        value: rule.valueFn(validator),
      });
    }
  }

  // Evaluate volatility from anomaly history
  if (anomalyHistory && anomalyHistory.length >= 3) {
    const baseline = median(anomalyHistory.slice(-3));
    const current = validator.aiScore?.anomalyScore ?? 0;
    const delta = Math.abs(current - baseline);

    if (delta >= THRESHOLDS.VOLATILITY_CRITICAL && current > THRESHOLDS.ANOMALY_HIGH) {
      violations.push({
        type: 'ai_volatility_critical',
        severity: 'critical',
        message: `Anomaly volatility is ${(delta * 100).toFixed(1)}% (baseline ${(baseline * 100).toFixed(1)}%), with current anomaly ${(current * 100).toFixed(1)}%`,
        value: delta,
      });
    } else if (delta >= THRESHOLDS.VOLATILITY_WARNING) {
      violations.push({
        type: 'ai_volatility_warning',
        severity: 'warning',
        message: `Anomaly volatility is ${(delta * 100).toFixed(1)}% from baseline ${(baseline * 100).toFixed(1)}%`,
        value: delta,
      });
    }
  }

  const hasCritical = violations.some((v) => v.severity === 'critical');
  const hasWarning = violations.some((v) => v.severity === 'warning');
  const isFlagged = hasCritical || hasWarning;

  return {
    isFlagged,
    severity: hasCritical ? 'critical' : hasWarning ? 'warning' : null,
    violations,
    governanceStatus: hasCritical ? 'critical' : hasWarning ? 'warning' : 'healthy',
    flaggedAt: isFlagged ? new Date().toISOString() : null,
  };
}

/**
 * Build a structured governance trigger payload for UNL review.
 *
 * @param {Object} validator
 * @param {Object} evaluation - Output of evaluateGovernanceThresholds()
 * @returns {{
 *   triggeredAt: string,
 *   validatorId: string,
 *   proposedAction: string,
 *   severity: string,
 *   violations: Array,
 *   snapshot: { nodeHealth: Object, uptime: Object, aiScore: Object }
 * }}
 */
export function buildGovernanceTrigger(validator, evaluation) {
  return {
    triggeredAt: new Date().toISOString(),
    validatorId: validator.validatorId,
    proposedAction: 'flag_for_unl_review',
    severity: evaluation.severity,
    violations: evaluation.violations,
    snapshot: {
      nodeHealth: validator.nodeHealth ?? {},
      uptime: validator.uptime ?? {},
      aiScore: validator.aiScore ?? {},
    },
  };
}
