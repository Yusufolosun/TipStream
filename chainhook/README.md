# Chainhook Integration

## Overview

TipStream uses [Chainhook](https://docs.hiro.so/stacks/chainhook) to listen for real-time print events from the tipstream contract on Stacks. Events are delivered via HTTP POST to a callback server that indexes them in a database, replacing the need for frontend polling.

## Architecture

```
Stacks Blockchain
       │
       ▼
  Chainhook Node
  (event listener)
       │
       ▼
  Callback Server
  (POST /api/chainhook/events)
       │
       ▼
  SQLite / PostgreSQL
       │
       ▼
  REST API ──► Frontend
```

## Predicate Configuration

The predicate at `chainhook/tipstream-events.chainhook.json` listens for all `print_event` calls from the deployed tipstream contract. It filters events containing the `event` key, which is emitted by every public function in the contract.

### Indexed Events

| Event Type | Source Function | Key Fields |
|------------|----------------|------------|
| `tip-sent` | `send-tip` | tip-id, sender, recipient, amount, fee, net-amount |
| `profile-updated` | `update-profile` | user, display-name |
| `user-blocked` | `toggle-block-user` | blocker, blocked, is-blocked |
| `contract-paused` | `set-paused` | paused |
| `fee-updated` | `set-fee-basis-points` | new-fee |
| `fee-change-proposed` | `propose-fee-change` | new-fee, effective-height |
| `fee-change-executed` | `execute-fee-change` | new-fee |
| `fee-change-cancelled` | `cancel-fee-change` | - |
| `pause-change-proposed` | `propose-pause-change` | paused, effective-height |
| `pause-change-executed` | `execute-pause-change` | paused |
| `ownership-proposed` | `propose-new-owner` | current-owner, proposed-owner |
| `ownership-transferred` | `accept-ownership` | new-owner |
| `multisig-updated` | `set-multisig` | multisig |

## Setup

### Prerequisites

- [Chainhook CLI](https://github.com/hirosystems/chainhook) installed
- Node.js 18+

### Environment Variables

```bash
CHAINHOOK_CALLBACK_URL=http://localhost:3100   # Callback server URL
CHAINHOOK_AUTH_TOKEN=your-secret-token         # Bearer token for webhook auth
DATABASE_URL=sqlite://./data/tipstream.db      # Database connection string
```

### Running Locally

1. Start the callback server:
   ```bash
   cd chainhook
   npm install
   node server.js
   ```

2. Register the predicate with Chainhook:
   ```bash
   chainhook predicates register chainhook/tipstream-events.chainhook.json --mainnet
   ```

3. The server will receive events at `POST /api/chainhook/events` as they occur on-chain.

### Production Deployment

For production, deploy the callback server behind HTTPS and replace the `CHAINHOOK_CALLBACK_URL` with the public endpoint. Use PostgreSQL instead of SQLite for concurrent access.

## API Endpoints

The callback server exposes these read endpoints once events are indexed:

| Endpoint | Description |
|----------|-------------|
| `GET /api/tips?limit=20&offset=0` | Recent tips with pagination |
| `GET /api/tips/:id` | Single tip by ID |
| `GET /api/tips/user/:address` | Tips sent or received by a user |
| `GET /api/stats` | Aggregated platform statistics |

## Frontend Integration

Replace the existing polling logic in `RecentTips.jsx` with direct API calls:

```javascript
const response = await fetch(`${CHAINHOOK_API_URL}/api/tips?limit=20`);
const tips = await response.json();
```

For real-time updates, the server can be extended with WebSocket or Server-Sent Events (SSE) support.
