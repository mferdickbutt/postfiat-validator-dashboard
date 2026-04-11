import { formatNumber, formatPercent, formatTimestamp } from '@/lib/statusUtils';

function shortKey(value) {
  if (!value) return 'Unknown validator';
  if (value.length <= 18) return value;
  return `${value.slice(0, 8)}…${value.slice(-8)}`;
}

function uptimeLabel(value) {
  if (value === null || value === undefined) return 'Collecting';
  return formatPercent(value);
}

function toneForStatus(status) {
  switch (status) {
    case 'healthy':
      return {
        label: 'Stable',
        className: 'is-healthy',
      };
    case 'degraded':
      return {
        label: 'Degraded',
        className: 'is-degraded',
      };
    case 'offline':
      return {
        label: 'Offline',
        className: 'is-offline',
      };
    default:
      return {
        label: 'Unknown',
        className: 'is-offline',
      };
  }
}

function barWidth(value) {
  if (value === null || value === undefined) return '18%';
  return `${Math.max(6, Math.round(value * 100))}%`;
}

export default function PagodaStatusScreen({
  validatorId,
  status,
  nodeHealth,
  uptime,
  aiScore,
  lastUpdated,
}) {
  const tone = toneForStatus(status);
  const anomalyValue = aiScore?.anomalyScore ?? 0;
  const anomalyClass = anomalyValue > 0.7 ? 'is-hot' : '';

  return (
    <section className={`pagoda-screen ${tone.className}`} aria-label="Pagoda status board">
      <header className="pagoda-screen__header">
        <div>
          <p className="pagoda-screen__eyebrow">Pagoda Status Board</p>
          <h2 className="pagoda-screen__title">LC66 Validator</h2>
        </div>
        <div className={`pagoda-screen__signal ${tone.className}`}>
          <span className="pagoda-screen__signal-dot" />
          {tone.label}
        </div>
      </header>

      <div className="pagoda-screen__identity">
        <span className="pagoda-screen__identity-label">Validator</span>
        <span className="pagoda-screen__identity-value">{shortKey(validatorId)}</span>
      </div>

      <div className="pagoda-screen__metrics">
        <article className="pagoda-screen__metric">
          <span className="pagoda-screen__metric-label">Peer Count</span>
          <strong className="pagoda-screen__metric-value">{nodeHealth?.peerCount ?? 0}</strong>
        </article>
        <article className="pagoda-screen__metric">
          <span className="pagoda-screen__metric-label">Ledger Height</span>
          <strong className="pagoda-screen__metric-value">
            {formatNumber(nodeHealth?.ledgerHeight ?? 0)}
          </strong>
        </article>
      </div>

      <div className="pagoda-screen__strips">
        <div className="pagoda-screen__strip">
          <div className="pagoda-screen__strip-copy">
            <span>24h Uptime</span>
            <strong>{uptimeLabel(uptime?.last24h)}</strong>
          </div>
          <div className="pagoda-screen__bar">
            <span style={{ width: barWidth(uptime?.last24h) }} />
          </div>
        </div>
        <div className="pagoda-screen__strip">
          <div className="pagoda-screen__strip-copy">
            <span>7d Uptime</span>
            <strong>{uptimeLabel(uptime?.last7d)}</strong>
          </div>
          <div className="pagoda-screen__bar">
            <span style={{ width: barWidth(uptime?.last7d) }} />
          </div>
        </div>
        <div className="pagoda-screen__strip">
          <div className="pagoda-screen__strip-copy">
            <span>Anomaly</span>
            <strong className={anomalyClass}>{formatPercent(anomalyValue)}</strong>
          </div>
          <div className="pagoda-screen__bar is-anomaly">
            <span style={{ width: barWidth(anomalyValue) }} />
          </div>
        </div>
      </div>

      <footer className="pagoda-screen__footer">
        <span>Performance {formatPercent(aiScore?.performanceScore ?? 0)}</span>
        <span>Reliability {formatPercent(aiScore?.reliabilityScore ?? 0)}</span>
        <span>{lastUpdated ? formatTimestamp(lastUpdated) : 'Awaiting timestamp'}</span>
      </footer>
    </section>
  );
}
