/**
 * GovernanceStatusBadge.jsx
 *
 * Pill badge showing a validator's governance status: CRITICAL, WARNING, or HEALTHY.
 * Title attribute provides a tooltip with human-readable violation reasons.
 */

import { governanceStatusClasses, flagReasonText } from '../lib/statusUtils';

const LABELS = {
  critical: 'CRITICAL',
  warning: 'WARNING',
  healthy: 'HEALTHY',
};

/**
 * @param {{ evaluation: { governanceStatus: string, violations: Array } }} props
 */
export default function GovernanceStatusBadge({ evaluation }) {
  if (!evaluation) return null;

  const { governanceStatus, violations } = evaluation;
  const label = LABELS[governanceStatus] ?? 'HEALTHY';
  const tooltip = violations.length > 0 ? flagReasonText(violations) : 'No violations';

  return (
    <span
      className={`inline-block rounded-full border px-2 py-0.5 text-xs font-bold uppercase tracking-wide ${governanceStatusClasses(governanceStatus)}`}
      title={tooltip}
    >
      {label}
    </span>
  );
}
