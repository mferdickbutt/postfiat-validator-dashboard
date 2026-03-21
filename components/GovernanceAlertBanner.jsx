/**
 * GovernanceAlertBanner.jsx
 *
 * Top-of-page banner summarising governance flags across all validators.
 * Shows nothing when no validators are flagged.
 * Includes an "Export Trigger JSON" button that copies to clipboard
 * (falls back to file download if clipboard API is unavailable).
 */

import { useState } from 'react';
import { flagReasonText } from '../lib/statusUtils';

/**
 * Truncate a validator key for display.
 */
function shortKey(id) {
  if (!id || id.length <= 14) return id;
  return `${id.slice(0, 6)}…${id.slice(-6)}`;
}

/**
 * @param {{
 *   flaggedValidators: Array<{ validatorId: string, evaluation: Object }>,
 *   triggers: Array<Object>
 * }} props
 */
export default function GovernanceAlertBanner({ flaggedValidators, triggers }) {
  const [copied, setCopied] = useState(false);

  if (!flaggedValidators || flaggedValidators.length === 0) return null;

  const criticalCount = flaggedValidators.filter(
    (f) => f.evaluation.governanceStatus === 'critical',
  ).length;
  const warningCount = flaggedValidators.length - criticalCount;
  const hasCritical = criticalCount > 0;

  const bgClass = hasCritical
    ? 'border-red-300 bg-red-50'
    : 'border-amber-300 bg-amber-50';
  const headerColor = hasCritical ? 'text-red-800' : 'text-amber-800';
  const bodyColor = hasCritical ? 'text-red-700' : 'text-amber-700';

  function handleExport() {
    const payload = JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        summary: {
          totalFlagged: flaggedValidators.length,
          criticalCount,
          warningCount,
        },
        triggers,
      },
      null,
      2,
    );

    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(payload).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    } else {
      const blob = new Blob([payload], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'governance-triggers.json';
      a.click();
      URL.revokeObjectURL(url);
    }
  }

  return (
    <div className={`rounded-xl border p-4 shadow-sm ${bgClass}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h3 className={`text-sm font-bold uppercase tracking-wide ${headerColor}`}>
            Governance Alert — {flaggedValidators.length} Flagged Validator
            {flaggedValidators.length !== 1 ? 's' : ''}
          </h3>
          <p className={`mt-1 text-xs ${bodyColor}`}>
            {criticalCount > 0 && (
              <span className="font-semibold">{criticalCount} critical</span>
            )}
            {criticalCount > 0 && warningCount > 0 && ', '}
            {warningCount > 0 && (
              <span className="font-semibold">{warningCount} warning</span>
            )}
          </p>
          <ul className={`mt-2 space-y-1 text-xs ${bodyColor}`}>
            {flaggedValidators.map((f) => (
              <li key={f.validatorId} className="flex items-start gap-1.5">
                <span className="shrink-0 font-mono font-semibold">
                  {shortKey(f.validatorId)}
                </span>
                <span className="opacity-80">
                  — {flagReasonText(f.evaluation.violations)}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <button
          onClick={handleExport}
          className={`shrink-0 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
            hasCritical
              ? 'border-red-300 bg-red-100 text-red-800 hover:bg-red-200'
              : 'border-amber-300 bg-amber-100 text-amber-800 hover:bg-amber-200'
          }`}
        >
          {copied ? 'Copied!' : 'Export Trigger JSON'}
        </button>
      </div>
    </div>
  );
}
