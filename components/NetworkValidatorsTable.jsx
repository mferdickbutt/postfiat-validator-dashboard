/**
 * NetworkValidatorsTable.jsx
 */

import { formatPercent, uptimeColor } from "../lib/statusUtils";
import GovernanceStatusBadge from "./GovernanceStatusBadge";

function truncateKey(pubkey) {
  if (!pubkey || pubkey.length <= 16) return pubkey;
  return pubkey.slice(0, 6) + "…" + pubkey.slice(-6);
}

function StatusCell({ status }) {
  const normalised = status === "healthy" ? "active" : status;
  const config = {
    active:   { dot: "bg-green-500",  text: "text-green-700",  label: "Active"   },
    degraded: { dot: "bg-yellow-500", text: "text-yellow-700", label: "Degraded" },
    offline:  { dot: "bg-red-500",    text: "text-red-700",    label: "Offline"  },
  };
  const { dot, text, label } = config[normalised] ?? config.offline;
  return (
    <span className={"inline-flex items-center gap-1.5 text-sm font-medium " + text}>
      <span className={"inline-block h-2 w-2 rounded-full " + dot} />
      {label}
    </span>
  );
}

function UptimeCell({ value }) {
  if (value === null) {
    return <span className="text-sm italic text-gray-400">Collecting...</span>;
  }
  return (
    <span className={"text-sm font-semibold " + uptimeColor(value)}>
      {formatPercent(value)}
    </span>
  );
}

function JailStateCell({ jailState }) {
  const config = {
    jailed:       { dot: "bg-purple-500", text: "text-purple-700", label: "Jailed",     bg: "bg-purple-900" },
    "re-scoring": { dot: "bg-orange-400", text: "text-orange-700", label: "Re-scoring", bg: "bg-orange-800" },
    active:       { dot: "bg-green-400",  text: "text-gray-400",   label: "Active",     bg: "bg-gray-700"   },
  };
  const status = jailState?.status ?? "active";
  const { dot, text, label, bg } = config[status] ?? config.active;
  const violations = jailState?.violations ?? [];
  const hasViolations = violations.length > 0;

  return (
    <div className="group relative inline-flex items-center cursor-default">
      <span className={"inline-flex items-center gap-1.5 text-sm font-medium " + text}>
        <span className={"inline-block h-2 w-2 rounded-full " + dot} />
        {label}
      </span>
      {hasViolations && (
        <div className={"absolute z-50 top-full left-0 mt-2 w-72 rounded-lg p-3 text-xs text-white shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 " + bg}>
          <div className="font-semibold mb-1.5 border-b border-white/20 pb-1">Jail Reasons:</div>
          {violations.map((v, i) => (
            <div key={i} className="mb-1 pl-2 border-l-2 border-white/30">{"\u2022 " + v.message}</div>
          ))}
          {jailState?.jailedAt && (
            <div className="mt-2 pt-1 border-t border-white/20 text-white/70 text-[10px]">
              Jailed at: {new Date(jailState.jailedAt).toLocaleString()}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function rowClasses(v, evaluation, jailState) {
  const jailStatus = jailState?.status;
  if (jailStatus === "jailed")       return "border-l-4 border-l-purple-500 bg-purple-50/30";
  if (jailStatus === "re-scoring")   return "border-l-4 border-l-orange-400 bg-orange-50/20";
  const govStatus = evaluation?.governanceStatus;
  if (govStatus === "critical")      return "border-l-4 border-l-red-500 bg-red-50/30";
  if (govStatus === "warning")       return "border-l-4 border-l-amber-500 bg-amber-50/30";
  if (v.isLocal)                     return "bg-blue-50/40";
  return "";
}

export default function NetworkValidatorsTable({ validators, evaluations = {} }) {
  if (!validators || validators.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6 text-center text-sm text-gray-400">
        No validators found.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto overflow-y-visible rounded-xl border border-gray-200 bg-white shadow-sm">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-500">
            <th className="px-4 py-3">Validator</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">UNL State</th>
            <th className="px-4 py-3">Governance</th>
            <th className="px-4 py-3 text-right">24h</th>
            <th className="px-4 py-3 text-right">7d</th>
            <th className="px-4 py-3 text-right">30d</th>
          </tr>
        </thead>
        <tbody>
          {validators.map((v) => {
            const evaluation = evaluations[v.validatorId] ?? null;
            const jailState  = v.jailState ?? null;
            return (
              <tr
                key={v.validatorId}
                className={"border-b border-gray-50 last:border-0 transition-colors hover:bg-gray-50 " + rowClasses(v, evaluation, jailState)}
              >
                <td className="px-4 py-3 font-mono">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-800">{truncateKey(v.validatorId)}</span>
                    {v.isLocal && (
                      <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">LOCAL</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <StatusCell status={v.nodeHealth?.status ?? "offline"} />
                </td>
                <td className="px-4 py-3">
                  <JailStateCell jailState={jailState} />
                </td>
                <td className="px-4 py-3">
                  <GovernanceStatusBadge evaluation={evaluation} />
                </td>
                <td className="px-4 py-3 text-right">
                  <UptimeCell value={v.uptime?.last24h ?? null} />
                </td>
                <td className="px-4 py-3 text-right">
                  <UptimeCell value={v.uptime?.last7d ?? null} />
                </td>
                <td className="px-4 py-3 text-right">
                  <UptimeCell value={v.uptime?.last30d ?? null} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
