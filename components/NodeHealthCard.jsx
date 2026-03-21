import { statusClasses, cardBorderClass, formatNumber } from '@/lib/statusUtils';

/**
 * NodeHealthCard displays the validator's connection status, peer count,
 * and current ledger height.
 *
 * Props:
 *   validatorId  {string}  - Validator identifier
 *   nodeHealth   {Object}  - { status, peerCount, ledgerHeight }
 */
export default function NodeHealthCard({ validatorId, nodeHealth }) {
  const { status, peerCount, ledgerHeight } = nodeHealth;

  return (
    <div
      className={`rounded-lg border border-l-4 ${cardBorderClass(status)} bg-white p-6 shadow-sm`}
    >
      <h2 className="mb-4 text-lg font-semibold text-gray-900">Node Health</h2>

      {/* Status badge */}
      <div className="mb-4">
        <span
          className={`inline-block rounded-full border px-3 py-1 text-sm font-medium ${statusClasses(status)}`}
        >
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
      </div>

      {/* Validator ID */}
      <div className="mb-3">
        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
          Validator ID
        </p>
        <p className="mt-1 font-mono text-sm text-gray-800">{validatorId}</p>
      </div>

      {/* Peer count */}
      <div className="mb-3">
        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
          Peer Count
        </p>
        <p className="mt-1 text-2xl font-bold text-gray-900">
          {peerCount}
          <span className="ml-1 text-sm font-normal text-gray-500">peers</span>
        </p>
      </div>

      {/* Ledger height */}
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
          Ledger Height
        </p>
        <p className="mt-1 text-2xl font-bold text-gray-900">
          {formatNumber(ledgerHeight)}
        </p>
      </div>
    </div>
  );
}
