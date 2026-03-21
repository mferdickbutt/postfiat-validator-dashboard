/**
 * pages/api/validator.js
 *
 * Next.js API route — proxies every request to the mapper microservice.
 * The mapper handles the live RPC call; the dashboard just relays.
 */

export default async function handler(req, res) {
  let upstream;
  try {
    upstream = await fetch('http://localhost:3001/validator');
  } catch {
    return res.status(502).json({ error: 'Mapper service unavailable' });
  }

  if (!upstream.ok) {
    return res.status(502).json({ error: `Mapper returned ${upstream.status}` });
  }

  const data = await upstream.json();
  res.setHeader('Cache-Control', 'no-store').status(200).json(data);
}
