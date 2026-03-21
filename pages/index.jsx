import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import NodeHealthCard from '@/components/NodeHealthCard';
import UptimeCard from '@/components/UptimeCard';
import AIScoringCard from '@/components/AIScoringCard';
import NetworkValidatorsTable from '@/components/NetworkValidatorsTable';
import HistoryChart from '@/components/HistoryChart';
import GovernanceAlertBanner from '@/components/GovernanceAlertBanner';
import { deriveStatus, formatTimestamp } from '@/lib/statusUtils';
import {
  evaluateGovernanceThresholds,
  buildGovernanceTrigger,
} from '@/lib/governanceTriggers';

export default function Dashboard() {
  const router = useRouter();
  const mockFailing = router.query.mockFailing === 'true';

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [networkValidators, setNetworkValidators] = useState(null);
  const [networkLoading, setNetworkLoading] = useState(true);
  const [networkError, setNetworkError] = useState(null);

  const [historyData, setHistoryData]       = useState(null);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError]     = useState(null);

  /** Fetch live local-validator data via mapper microservice. */
  async function loadData(signal) {
    try {
      const res = await fetch('/dashboard/api/validator', { signal });
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      const json = await res.json();
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

  /** Fetch all UNL validators from mapper microservice. */
  async function loadNetworkValidators(signal) {
    try {
      const url = mockFailing
        ? '/dashboard/api/validators?includeMockFailing=true'
        : '/dashboard/api/validators';
      const res = await fetch(url, { signal });
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      const json = await res.json();
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

  // Live data: fetch immediately, then poll every 30 seconds
  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    loadData(controller.signal);
    loadNetworkValidators(controller.signal);

    const intervalId = setInterval(() => {
      if (!isMounted) return;
      const c = new AbortController();
      loadData(c.signal);
      loadNetworkValidators(c.signal);
    }, 30_000);

    return () => {
      isMounted = false;
      controller.abort();
      clearInterval(intervalId);
    };
  }, [mockFailing]);

  // Historical data: fetch once when validatorId is known (daily data, no need to poll)
  useEffect(() => {
    if (!data?.validatorId) return;
    let isMounted = true;
    setHistoryLoading(true);

    fetch(`/dashboard/api/history?validatorId=${encodeURIComponent(data.validatorId)}&days=30`)
      .then((r) => { if (!r.ok) throw new Error(`${r.status}`); return r.json(); })
      .then((json) => { if (isMounted) { setHistoryData(json); setHistoryError(null); setHistoryLoading(false); } })
      .catch((err) => { if (isMounted) { setHistoryError(err.message); setHistoryLoading(false); } });

    return () => { isMounted = false; };
  }, [data?.validatorId]);

  /** Manual retry after an error. */
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

  // ── Governance evaluation ─────────────────────────────────────────────
  const { evaluations, flaggedValidators, triggers } = useMemo(() => {
    if (!networkValidators) return { evaluations: {}, flaggedValidators: [], triggers: [] };

    const evals = {};
    const flagged = [];
    const trigs = [];

    for (const v of networkValidators) {
      const history = v.aiScore?.anomalyHistory ?? null;
      const evaluation = evaluateGovernanceThresholds(v, history);
      evals[v.validatorId] = evaluation;

      if (evaluation.isFlagged) {
        flagged.push({ validatorId: v.validatorId, evaluation });
        trigs.push(buildGovernanceTrigger(v, evaluation));
      }
    }

    return { evaluations: evals, flaggedValidators: flagged, triggers: trigs };
  }, [networkValidators]);

  // ── Loading state (local node only blocks full render) ──────────────────
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600" />
          <p className="text-gray-600">Loading validator data…</p>
        </div>
      </div>
    );
  }

  // ── Error state ────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="rounded-lg border border-red-200 bg-red-50 p-8 text-center">
          <p className="mb-2 text-lg font-semibold text-red-800">Error Loading Data</p>
          <p className="text-sm text-red-600">{error}</p>
          <button
            onClick={handleRetry}
            className="mt-4 rounded bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // ── Data loaded ────────────────────────────────────────────────────────
  const computedStatus = deriveStatus(
    data.nodeHealth.peerCount,
    data.aiScore.anomalyScore,
  );

  return (
    <>
      <Head>
        <title>Public Validator Dashboard</title>
        <meta name="description" content="Public Validator Dashboard — node health, uptime, and AI scoring metrics" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="border-b bg-white shadow-sm">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            <h1 className="text-2xl font-bold text-gray-900">
              Public Validator Dashboard
            </h1>
            {data.lastUpdated && (
              <p className="mt-1 text-sm text-gray-500">
                Last updated: {formatTimestamp(data.lastUpdated)}
              </p>
            )}
            {computedStatus !== data.nodeHealth.status && (
              <p className="mt-1 text-xs text-orange-600">
                ⚠ JSON status &quot;{data.nodeHealth.status}&quot; does not match
                computed status &quot;{computedStatus}&quot;.
              </p>
            )}
          </div>
        </header>

        <main className="mx-auto max-w-7xl space-y-10 px-4 py-8 sm:px-6 lg:px-8">
          {/* ── Governance alert banner ──────────────────────────────────── */}
          <GovernanceAlertBanner
            flaggedValidators={flaggedValidators}
            triggers={triggers}
          />

          {/* ── Local node cards ─────────────────────────────────────────── */}
          <section>
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">
              Local Node
            </h2>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <NodeHealthCard
                validatorId={data.validatorId}
                nodeHealth={data.nodeHealth}
              />
              <UptimeCard uptime={data.uptime} />
              <AIScoringCard aiScore={data.aiScore} />
            </div>
          </section>

          {/* ── Network UNL validators table ──────────────────────────────── */}
          <section>
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">
              Network Validators (UNL)
            </h2>

            {networkLoading && (
              <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-500">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-blue-500" />
                Loading network validators…
              </div>
            )}

            {!networkLoading && networkError && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
                Failed to load network validators: {networkError}
              </div>
            )}

            {!networkLoading && !networkError && (
              <NetworkValidatorsTable
                validators={networkValidators}
                evaluations={evaluations}
              />
            )}
          </section>

          {/* ── 30-day historical charts ──────────────────────────────── */}
          <section>
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">
              Historical Trends (30 Days)
            </h2>

            {historyLoading && (
              <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-6 text-sm text-gray-500">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-indigo-500" />
                Loading historical data…
              </div>
            )}

            {!historyLoading && historyError && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
                Failed to load history: {historyError}
              </div>
            )}

            {!historyLoading && !historyError && historyData && (
              <HistoryChart
                history={historyData.history}
                validatorId={historyData.validatorId}
              />
            )}
          </section>
        </main>
      </div>
    </>
  );
}
