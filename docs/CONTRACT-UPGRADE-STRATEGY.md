# Contract Upgrade Strategy

## Overview

Clarity smart contracts on Stacks are immutable once deployed. This document outlines the upgrade and migration strategy for TipStream contracts.

## Version Tracking

Each contract includes version metadata accessible via read-only functions:

```clarity
(get-contract-version) ;; Returns { version: u1, name: "tipstream-core" }
```

All deployments should increment the version constant before deploying a new contract instance.

## Upgrade Approaches

### 1. Parallel Deployment (Recommended)

Deploy a new contract alongside the existing one. Both contracts remain functional during the transition period.

**Steps:**

1. Deploy the new contract with an incremented version number
2. Update the frontend `contracts.js` configuration to point to the new contract address
3. Build a migration UI that reads historical data from the old contract and displays it alongside new contract data
4. Announce the migration timeline to users
5. After the transition period, deprecate the old contract in the UI

**Advantages:**
- Zero downtime for users
- Old contract data remains accessible on-chain permanently
- Users can verify both contracts independently

**Limitations:**
- User statistics (tip counts, volumes) do not carry over automatically
- Platform-wide stats reset on the new contract

### 2. Proxy Pattern

Use a data-only contract for storage and a separate logic contract for operations. Upgrading means deploying a new logic contract and pointing the data contract to it.

**Architecture:**

```
tipstream-data.clar    (stores all maps and data vars)
tipstream-logic-v1.clar (current business logic)
tipstream-logic-v2.clar (upgraded business logic)
```

The data contract accepts calls only from an authorized logic contract, which the owner can update.

**Advantages:**
- State is preserved across upgrades
- Seamless transition for users

**Limitations:**
- Adds complexity and gas costs to every transaction
- Requires careful access control between data and logic contracts
- Must be designed from the start; retrofitting is not practical

### 3. Accept Immutability

For the current deployment, the contracts are immutable. The focus should be on:

- Thorough testing before deployment (29+ automated tests currently)
- Time-locked admin changes (144-block delay for sensitive operations)
- Multi-sig governance to prevent unilateral changes
- Conservative fee limits (capped at 10%)

## Current Contract Addresses

| Contract | Network | Address |
|----------|---------|---------|
| tipstream | Mainnet | SP31PKQVQZVZCK3FM3NH67CGD6G1FMR17VQVS2W5T.tipstream |

## Migration Checklist

When deploying a new contract version:

- [ ] Increment `contract-version` constant
- [ ] Run full test suite against the new contract
- [ ] Deploy to testnet and verify all functions
- [ ] Deploy to mainnet
- [ ] Update `frontend/src/config/contracts.js` with new address
- [ ] Update deployment documentation
- [ ] Communicate changes to users via changelog
- [ ] Monitor the new contract for the first 24-48 hours

## Data Preservation

All historical data remains on-chain permanently in the original contract. Read-only functions like `get-tip`, `get-user-stats`, and `get-platform-stats` continue to work on deprecated contracts. The frontend can aggregate data from multiple contract versions if needed.

## Emergency Procedures

If a critical vulnerability is discovered in the deployed contract:

1. Use `set-paused` to halt all tipping operations immediately
2. If multi-sig is configured, coordinate with signers to pause
3. Assess the vulnerability and develop a fix
4. Deploy a patched contract with an incremented version
5. Follow the parallel deployment migration process
6. Unpause the old contract only if it is safe and users still need access
