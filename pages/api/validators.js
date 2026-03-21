/**
 * pages/api/validators.js
 *
 * Next.js API route — proxies requests to the mapper /validators endpoint.
 * Returns an array of all UNL validators with their availability data.
 *
 * Query params:
 *   includeMockFailing=true  — append a synthetic failing validator for testing
 */

import { MOCK_FAILING_VALIDATOR } from '../../lib/mockFailingValidator';

export default async function handler(req, res) {
  let upstream;
  try {
    upstream = await fetch('http://localhost:3001/validators');
  } catch {
    return res.status(502).json({ error: 'Mapper service unavailable' });
  }

  if (!upstream.ok) {
    return res.status(502).json({ error: `Mapper returned ${upstream.status}` });
  }

  const data = await upstream.json();

  if (req.query.includeMockFailing === 'true') {
    const mock = { ...MOCK_FAILING_VALIDATOR, lastUpdated: new Date().toISOString() };
    data.push(mock);
  }

  res.setHeader('Cache-Control', 'no-store').status(200).json(data);
}
