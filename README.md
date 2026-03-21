# PostFiat Validator Dashboard

Real-time monitoring dashboard for PostFiat validators. Built with Next.js, provides visibility into node health, uptime, AI scoring, and governance status.

## Features

- **Node Health Card** - Server state, peer count, ledger height
- **Uptime Card** - 24h, 7d, 30d uptime percentages
- **AI Scoring Card** - Performance, reliability, anomaly scores
- **Network Validators Table** - All UNL validators with status
- **History Chart** - Time-series visualization
- **Governance Alerts** - Jail/re-scoring warnings

## Tech Stack

- Next.js 14
- React 18
- Tailwind CSS
- Recharts

## Requirements

- Node.js >= 18
- PostFiat validator-history-mapper running on port 3001

## Installation

```bash
npm install
```

## Development

```bash
npm run dev
```

Open http://localhost:3000

## Production

```bash
npm run build
npm start
```

## API Routes

| Endpoint | Description |
|----------|-------------|
| `/api/validator` | Single validator data |
| `/api/validators` | All UNL validators |
| `/api/history` | Time-series history |
| `/api/jail-simulate` | Simulate jail/release (testing) |

## Configuration

The dashboard connects to the validator-history-mapper microservice. Update API routes if mapper runs on a different host/port.

## Mock Mode

Add `?mockFailing=true` to URL to simulate a failing validator (testing governance alerts).

## License

MIT
