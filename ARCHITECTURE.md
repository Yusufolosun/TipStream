# Architecture

This document describes how the TipStream platform is structured and how its components interact.

## System Overview

TipStream is a micro-tipping platform built on the Stacks blockchain. Users connect a Stacks wallet, fill in a recipient address, amount, and optional message, and submit a tip. The smart contract handles the STX transfer, fee collection, and on-chain record keeping.

```
+------------------+       +-------------------+       +------------------+
|                  |       |                   |       |                  |
|  React Frontend  +------>+  Stacks Wallet    +------>+  Stacks Node     |
|  (Vite + Tailwind|       |  (Leather/Xverse) |       |  (Hiro API)      |
|                  +<------+                   +<------+                  |
+--------+---------+       +-------------------+       +--------+---------+
         |                                                      |
         |               Read-only calls via                    |
         +-------------------Hiro API--------------------------+
                                                                |
                                                       +--------+---------+
                                                       |                  |
                                                       |  tipstream.clar  |
                                                       |  Smart Contract  |
                                                       |                  |
                                                       +------------------+
```

## Smart Contract

**Deployed at:** `SP31PKQVQZVZCK3FM3NH67CGD6G1FMR17VQVS2W5T.tipstream` on mainnet.

### Data Model

| Structure | Type | Purpose |
|---|---|---|
| `tips` | Map (uint -> record) | Stores every tip with sender, recipient, amount, message, and block height |
| `user-tip-count` | Map (principal -> uint) | Number of tips a user has sent |
| `user-received-count` | Map (principal -> uint) | Number of tips a user has received |
| `user-total-sent` | Map (principal -> uint) | Total microSTX sent by a user |
| `user-total-received` | Map (principal -> uint) | Total microSTX received by a user |
| `user-profiles` | Map (principal -> record) | Optional display name, bio, and avatar URL |
| `blocked-users` | Map ({blocker, blocked} -> bool) | Privacy controls |
| `total-tips-sent` | Variable (uint) | Global tip counter, also used as tip ID |
| `total-volume` | Variable (uint) | Running total of all tip amounts |
| `platform-fees` | Variable (uint) | Running total of collected fees |
| `is-paused` | Variable (bool) | Emergency pause switch |
| `current-fee-basis-points` | Variable (uint) | Fee rate, default 50 (0.5%) |

### Key Functions

| Function | Type | Description |
|---|---|---|
| `send-tip` | Public | Transfer STX from sender to recipient with fee deduction |
| `send-batch-tips` | Public | Process up to 50 tips in a single transaction |
| `tip-a-tip` | Public | Tip the original sender of an existing tip |
| `update-profile` | Public | Set display name, bio, and avatar for `tx-sender` |
| `toggle-block-user` | Public | Block/unblock a user from sending tips to you |
| `set-paused` | Admin | Pause or resume the contract |
| `set-fee-basis-points` | Admin | Adjust the fee rate (max 10%) |
| `get-tip` | Read-only | Retrieve a tip by ID |
| `get-user-stats` | Read-only | Get send/receive counts and totals for a user |
| `get-platform-stats` | Read-only | Get global tip count, volume, and fees |

### Tip Flow

1. User calls `send-tip(recipient, amount, message)`.
2. Contract checks: not paused, amount > 0, not self-tipping, not blocked.
3. Fee is calculated: `amount * fee_basis_points / 10000`.
4. `net-amount` (amount minus fee) is transferred to the recipient via `stx-transfer?`.
5. Fee is transferred to the contract owner via `stx-transfer?`.
6. Tip record is stored in the `tips` map.
7. User stats and global counters are updated.
8. The tip ID is returned.

## Frontend

Built with React 19, Vite 7, and Tailwind CSS 4. Uses `@stacks/connect` for wallet interaction and `@stacks/transactions` for building contract calls.

### Component Hierarchy

```
main.jsx
  ErrorBoundary
    App
      Header (wallet connect/disconnect, logo)
      AnimatedHero (shown when not connected)
      Tab Navigation (send, history, recent, stats, leaderboard)
        SendTip (tip form, validation, confirmation dialog)
        TipHistory (lazy-loaded, user's tip activity)
        RecentTips (lazy-loaded, live feed of all tips)
        PlatformStats (lazy-loaded, global metrics)
        Leaderboard (lazy-loaded, top tippers)
      ToastContainer (notifications)
```

### State Management

Each component manages its own state via React hooks. There is no global state store. The wallet session is managed by `@stacks/connect`'s `UserSession` and stored in local storage.

### API Calls

The frontend reads on-chain data through the Hiro API:

- `GET /v2/contracts/call-read/{address}/{name}/{function}` for read-only contract functions like `get-tip`, `get-platform-stats`, and `get-user-stats`.
- Write operations (`send-tip`, etc.) go through the wallet extension, which broadcasts the transaction to the Stacks node.

### Configuration

Contract address and name are centralized in `frontend/src/config/contracts.js`. Network selection is controlled by the `VITE_NETWORK` environment variable (defaults to mainnet).

## Deployment

- **Smart contract:** Deployed via Clarinet to Stacks mainnet.
- **Frontend:** Static single-page application. Can be deployed to any static host (Vercel, Netlify, GitHub Pages).
- **API dependency:** The frontend depends on the public Hiro API (`api.hiro.so`) for read-only contract calls.

## Error Handling

TipStream uses a standardized error handling pattern to provide clear feedback to users when transactions fail.

### Smart Contract Layer
Errors are defined as constants in the `tipstream.clar` contract using numeric codes (u100-u114). These codes are chosen to be unique across the project and are used in `asserts!` and `unwrap!` calls.

### Frontend Layer
The frontend includes a dedicated error mapping utility in `src/utils/errors.js`. 
- **Parsing**: The `TxStatus` component monitors transaction status. If a transaction fails with `abort_by_response`, it extracts the error code from the `tx_result`.
- **Mapping**: The `getErrorMessage(code)` function maps these numeric codes to user-friendly messages.
- **Display**: Mapped messages are displayed directly in the transaction status window and via toast notifications to help users understand why a failure occurred.

## Security

See [SECURITY.md](SECURITY.md) for the full security model, trust assumptions, and vulnerability reporting.
