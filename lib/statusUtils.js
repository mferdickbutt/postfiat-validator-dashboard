/**
 * statusUtils.js
 *
 * Shared utility functions for status derivation, color mapping, and formatting.
 * Used by all dashboard card components.
 */

/**
 * Derive nodeHealth.status from raw telemetry values.
 * Mirrors the backend logic in validator-history-mapper/mapper.js deriveStatus().
 *
 * @param {number} peerCount
 * @param {number} anomalyScore
 * @returns {'healthy'|'degraded'|'offline'}
 */
export function deriveStatus(peerCount, anomalyScore) {
  if (peerCount === 0) return 'offline';
  if (anomalyScore > 0.7) return 'degraded';
  return 'healthy';
}

/**
 * Return Tailwind CSS classes for a status badge pill.
 *
 * @param {'healthy'|'degraded'|'offline'} status
 * @returns {string}
 */
export function statusClasses(status) {
  switch (status) {
    case 'healthy':
      return 'bg-green-100 text-green-800 border-green-300';
    case 'degraded':
      return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    case 'offline':
      return 'bg-gray-100 text-gray-600 border-gray-300';
    default:
      return 'bg-gray-100 text-gray-600 border-gray-300';
  }
}

/**
 * Return the left-border accent color class for a card based on status.
 *
 * @param {'healthy'|'degraded'|'offline'} status
 * @returns {string}
 */
export function cardBorderClass(status) {
  switch (status) {
    case 'healthy':
      return 'border-l-green-500';
    case 'degraded':
      return 'border-l-yellow-500';
    case 'offline':
      return 'border-l-gray-400';
    default:
      return 'border-l-gray-400';
  }
}

/**
 * Format a number with comma separators.
 * 9876543 → "9,876,543"
 *
 * @param {number} num
 * @returns {string}
 */
export function formatNumber(num) {
  return num.toLocaleString('en-US');
}

/**
 * Format a 0–1 ratio as a percentage string with one decimal.
 * 0.997 → "99.7%"
 *
 * @param {number} ratio
 * @returns {string}
 */
export function formatPercent(ratio) {
  return (ratio * 100).toFixed(1) + '%';
}

/**
 * Return a Tailwind text-color class for an uptime percentage.
 * ≥99% → green, 95–99% → yellow, <95% → red
 *
 * @param {number} ratio  0–1 range
 * @returns {string}
 */
export function uptimeColor(ratio) {
  if (ratio >= 0.99) return 'text-green-600';
  if (ratio >= 0.95) return 'text-yellow-600';
  return 'text-red-600';
}

/**
 * Return a Tailwind bg-color class for an uptime progress bar.
 * ≥99% → green, 95–99% → yellow, <95% → red
 *
 * @param {number} ratio  0–1 range
 * @returns {string}
 */
export function uptimeBarColor(ratio) {
  if (ratio >= 0.99) return 'bg-green-500';
  if (ratio >= 0.95) return 'bg-yellow-500';
  return 'bg-red-500';
}

/**
 * Format an ISO 8601 timestamp as a human-readable string.
 *
 * @param {string} isoString
 * @returns {string}
 */
export function formatTimestamp(isoString) {
  const date = new Date(isoString);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZoneName: 'short',
  });
}

/**
 * Return Tailwind CSS classes for a governance status badge.
 *
 * @param {'critical'|'warning'|'healthy'} status
 * @returns {string}
 */
export function governanceStatusClasses(status) {
  switch (status) {
    case 'critical':
      return 'bg-red-100 text-red-800 border-red-300';
    case 'warning':
      return 'bg-amber-100 text-amber-800 border-amber-300';
    case 'healthy':
      return 'bg-green-100 text-green-800 border-green-300';
    default:
      return 'bg-gray-100 text-gray-600 border-gray-300';
  }
}

/**
 * Format a single governance violation into its human-readable message.
 *
 * @param {{ message: string }} violation
 * @returns {string}
 */
export function formatGovernanceViolation(violation) {
  return violation.message;
}

/**
 * Join all violation messages into a comma-separated summary string.
 *
 * @param {Array<{ message: string }>} violations
 * @returns {string}
 */
export function flagReasonText(violations) {
  return violations.map((v) => v.message).join(', ');
}
