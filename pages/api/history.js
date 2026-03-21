/**
 * pages/api/history.js
 *
 * Proxies the history request to the validator-history-mapper microservice.
 * Passes validatorId and days query parameters through to the backend.
 */

export default async function handler(req, res) {
  const { validatorId, days } = req.query;

  if (!validatorId) {
    return res.status(400).json({ error: 'validatorId is required' });
  }

  const params = new URLSearchParams({ validatorId });
  if (days) params.set('days', days);

  let upstream;
  try {
    upstream = await fetch(`http://localhost:3001/history?${params}`);
  } catch {
    return res.status(502).json({ error: 'Mapper service unavailable' });
  }

  if (!upstream.ok) {
    return res.status(upstream.status).json({ error: `Mapper returned ${upstream.status}` });
  }

  const data = await upstream.json();
  res.setHeader('Cache-Control', 'no-store').status(200).json(data);
}
