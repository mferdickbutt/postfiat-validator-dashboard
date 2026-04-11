import { useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { Cormorant_Garamond, IBM_Plex_Sans } from 'next/font/google';
import GovernanceAlertBanner from '@/components/GovernanceAlertBanner';
import HistoryChart from '@/components/HistoryChart';
import NetworkValidatorsTable from '@/components/NetworkValidatorsTable';
import PagodaStatusScreen from '@/components/PagodaStatusScreen';
import VoxelPagodaScene from '@/components/VoxelPagodaScene';
import { deriveStatus, formatTimestamp } from '@/lib/statusUtils';
import {
  evaluateGovernanceThresholds,
  buildGovernanceTrigger,
} from '@/lib/governanceTriggers';

const displayFont = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-display',
});

const bodyFont = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-body',
});

function DashboardLoading() {
  return (
    <div className={`${displayFont.variable} ${bodyFont.variable} pagoda-state`}>
      <div className="pagoda-state__panel">
        <p className="pagoda-state__eyebrow">Public Validator Dashboard</p>
        <h1 className="pagoda-state__title">Preparing the pagoda observatory</h1>
        <div className="pagoda-state__spinner" aria-hidden="true" />
        <p className="pagoda-state__copy">Loading validator data and scene assets.</p>
      </div>
    </div>
  );
}

function DashboardError({ error, onRetry }) {
  return (
    <div className={`${displayFont.variable} ${bodyFont.variable} pagoda-state`}>
      <div className="pagoda-state__panel is-error">
        <p className="pagoda-state__eyebrow">Public Validator Dashboard</p>
        <h1 className="pagoda-state__title">The observatory could not load</h1>
        <p className="pagoda-state__copy">{error}</p>
        <button onClick={onRetry} className="dashboard-button is-primary">
          Retry
        </button>
      </div>
    </div>
  );
}

function countNetworkStatus(validators) {
  if (!validators || validators.length === 0) {
    return {
      active: 0,
      offline: 0,
    };
  }

  return validators.reduce(
    (acc, validator) => {
      if (validator.nodeHealth?.status === 'offline') acc.offline += 1;
      else acc.active += 1;
      return acc;
    },
    { active: 0, offline: 0 },
  );
}

export default function Dashboard() {
  const router = useRouter();
  const mockFailing = router.query.mockFailing === 'true';

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [networkValidators, setNetworkValidators] = useState(null);
  const [networkLoading, setNetworkLoading] = useState(true);
  const [networkError, setNetworkError] = useState(null);

  const [historyData, setHistoryData] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState(null);

  const [activePanel, setActivePanel] = useState(null);

  async function loadData(signal) {
    try {
      const response = await fetch('/dashboard/api/validator', { signal });
      if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
      const json = await response.json();
      setData(json);
      setError(null);
      setLoading(false);
    } catch (err) {
      if (err.name !== 'AbortError') {
        setError(err.message);
        setLoading(false);
      }
    }
  }

  async function loadNetworkValidators(signal) {
    try {
      const url = mockFailing
        ? '/dashboard/api/validators?includeMockFailing=true'
        : '/dashboard/api/validators';
      const response = await fetch(url, { signal });
      if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
      const json = await response.json();
      setNetworkValidators(json);
      setNetworkError(null);
      setNetworkLoading(false);
    } catch (err) {
      if (err.name !== 'AbortError') {
        setNetworkError(err.message);
        setNetworkLoading(false);
      }
    }
  }

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    loadData(controller.signal);
    loadNetworkValidators(controller.signal);

    const intervalId = setInterval(() => {
      if (!isMounted) return;
      const nextController = new AbortController();
      loadData(nextController.signal);
      loadNetworkValidators(nextController.signal);
    }, 30_000);

    return () => {
      isMounted = false;
      controller.abort();
      clearInterval(intervalId);
    };
  }, [mockFailing]);

  useEffect(() => {
    if (!data?.validatorId) return;
    let isMounted = true;
    setHistoryLoading(true);

    fetch(`/dashboard/api/history?validatorId=${encodeURIComponent(data.validatorId)}&days=30`)
      .then((response) => {
        if (!response.ok) throw new Error(`${response.status}`);
        return response.json();
      })
      .then((json) => {
        if (isMounted) {
          setHistoryData(json);
          setHistoryError(null);
          setHistoryLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setHistoryError(err.message);
          setHistoryLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [data?.validatorId]);

  function handleRetry() {
    setLoading(true);
    setError(null);
    setNetworkLoading(true);
    setNetworkError(null);
    setHistoryLoading(true);
    setHistoryError(null);
    const controller = new AbortController();
    loadData(controller.signal);
    loadNetworkValidators(controller.signal);
  }

  const { evaluations, flaggedValidators, triggers } = useMemo(() => {
    if (!networkValidators) return { evaluations: {}, flaggedValidators: [], triggers: [] };

    const nextEvaluations = {};
    const nextFlagged = [];
    const nextTriggers = [];

    for (const validator of networkValidators) {
      const history = validator.aiScore?.anomalyHistory ?? null;
      const evaluation = evaluateGovernanceThresholds(validator, history);
      nextEvaluations[validator.validatorId] = evaluation;

      if (evaluation.isFlagged) {
        nextFlagged.push({ validatorId: validator.validatorId, evaluation });
        nextTriggers.push(buildGovernanceTrigger(validator, evaluation));
      }
    }

    return {
      evaluations: nextEvaluations,
      flaggedValidators: nextFlagged,
      triggers: nextTriggers,
    };
  }, [networkValidators]);

  if (loading) return <DashboardLoading />;
  if (error) return <DashboardError error={error} onRetry={handleRetry} />;

  const computedStatus = deriveStatus(
    data.nodeHealth.peerCount,
    data.aiScore.anomalyScore,
  );
  const networkSummary = countNetworkStatus(networkValidators);
  const criticalCount = flaggedValidators.filter(
    (validator) => validator.evaluation.governanceStatus === 'critical',
  ).length;

  function togglePanel(name) {
    setActivePanel((current) => (current === name ? null : name));
  }

  return (
    <>
      <Head>
        <title>LC66 Validator Observatory</title>
        <meta
          name="description"
          content="Voxel pagoda validator observatory with live node health, network status, and historical trends."
        />
      </Head>

      <div className={`${displayFont.variable} ${bodyFont.variable} pagoda-dashboard`}>
        <VoxelPagodaScene
          statusBoard={
            <PagodaStatusScreen
              validatorId={data.validatorId}
              status={computedStatus}
              nodeHealth={data.nodeHealth}
              uptime={data.uptime}
              aiScore={data.aiScore}
              lastUpdated={data.lastUpdated}
            />
          }
        />

        <div className="pagoda-overlay">
          <header className="dashboard-brand">
            <p className="dashboard-brand__eyebrow">Public Validator Observatory</p>
            <h1 className="dashboard-brand__title">LC66 Pagoda Relay</h1>
            <p className="dashboard-brand__copy">
              The scene is ornamental. The telemetry remains driven by the same live validator,
              network, and history endpoints.
            </p>
          </header>

          <section className="dashboard-meta">
            <div className={`dashboard-chip is-${computedStatus}`}>
              <span className="dashboard-chip__dot" />
              {computedStatus}
            </div>
            <div className="dashboard-chip">Peers {data.nodeHealth.peerCount}</div>
            <div className="dashboard-chip">Ledger {data.nodeHealth.ledgerHeight}</div>
            <div className="dashboard-chip">Updated {formatTimestamp(data.lastUpdated)}</div>
            {mockFailing && <div className="dashboard-chip is-warning">Mock failing enabled</div>}
          </section>

          {computedStatus !== data.nodeHealth.status && (
            <div className="dashboard-warning">
              Mapper returned status "{data.nodeHealth.status}" while the current metrics compute as
              "{computedStatus}".
            </div>
          )}

          {flaggedValidators.length > 0 && (
            <div className="dashboard-alert">
              <GovernanceAlertBanner
                flaggedValidators={flaggedValidators}
                triggers={triggers}
              />
            </div>
          )}

          <nav className="dashboard-dock" aria-label="Detail panels">
            <button
              className={`dashboard-button ${activePanel === 'network' ? 'is-primary' : ''}`}
              onClick={() => togglePanel('network')}
              aria-pressed={activePanel === 'network'}
            >
              <span className="dashboard-button__eyebrow">Network Hall</span>
              <strong>{networkValidators?.length ?? 0} validators</strong>
              <span>
                {networkSummary.active} active, {networkSummary.offline} offline
              </span>
            </button>

            <button
              className={`dashboard-button ${activePanel === 'history' ? 'is-primary' : ''}`}
              onClick={() => togglePanel('history')}
              aria-pressed={activePanel === 'history'}
            >
              <span className="dashboard-button__eyebrow">History Scroll</span>
              <strong>30 day record</strong>
              <span>{historyLoading ? 'Loading' : 'Uptime and score trends'}</span>
            </button>

            <div className="dashboard-summary">
              <span>Flagged {flaggedValidators.length}</span>
              <span>Critical {criticalCount}</span>
              <span>30s refresh cadence</span>
            </div>
          </nav>

          <aside className={`detail-panel detail-panel--network ${activePanel === 'network' ? 'is-open' : ''}`}>
            <div className="detail-panel__header">
              <div>
                <p className="detail-panel__eyebrow">Network Hall</p>
                <h2 className="detail-panel__title">UNL Validators</h2>
              </div>
              <button className="detail-panel__close" onClick={() => setActivePanel(null)}>
                Close
              </button>
            </div>

            <div className="detail-panel__body">
              {networkLoading && (
                <div className="detail-panel__empty">Loading live validator availability.</div>
              )}
              {!networkLoading && networkError && (
                <div className="detail-panel__empty is-error">
                  Failed to load network validators: {networkError}
                </div>
              )}
              {!networkLoading && !networkError && (
                <NetworkValidatorsTable
                  validators={networkValidators}
                  evaluations={evaluations}
                />
              )}
            </div>
          </aside>

          <aside className={`detail-panel detail-panel--history ${activePanel === 'history' ? 'is-open' : ''}`}>
            <div className="detail-panel__header">
              <div>
                <p className="detail-panel__eyebrow">History Scroll</p>
                <h2 className="detail-panel__title">Local Validator Timeline</h2>
              </div>
              <button className="detail-panel__close" onClick={() => setActivePanel(null)}>
                Close
              </button>
            </div>

            <div className="detail-panel__body">
              {historyLoading && (
                <div className="detail-panel__empty">Loading historical telemetry.</div>
              )}
              {!historyLoading && historyError && (
                <div className="detail-panel__empty is-error">
                  Failed to load history: {historyError}
                </div>
              )}
              {!historyLoading && !historyError && historyData && (
                <HistoryChart
                  history={historyData.history}
                  validatorId={historyData.validatorId}
                />
              )}
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
