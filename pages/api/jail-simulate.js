/**
 * pages/api/jail-simulate.js
 *
 * Proxy endpoint for jail simulation from dashboard.
 */

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const upstream = await fetch("http://localhost:3001/jail-simulate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body),
    });

    const data = await upstream.json();
    res.status(upstream.status).json(data);
  } catch (err) {
    res.status(502).json({ error: "Mapper service unavailable: " + err.message });
  }
}
