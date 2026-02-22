# Security

This document describes the security model of the TipStream smart contract and the measures taken to protect user funds.

## Language Safety Guarantees

TipStream is written in [Clarity](https://docs.stacks.co/clarity/overview), a decidable, non-Turing-complete smart contract language on the Stacks blockchain. Clarity provides several safety guarantees by design:

- **No reentrancy** - Clarity does not support callbacks or re-entrant calls, eliminating an entire class of exploits common in Solidity.
- **No buffer overflows** - Clarity is a high-level language with managed memory.
- **No unchecked arithmetic** - Integer overflow and underflow cause runtime errors rather than silent wrapping.
- **Decidable execution** - All Clarity programs are guaranteed to terminate; there are no infinite loops.

## Access Control

| Function | Who can call | Enforced by |
|---|---|---|
| `send-tip` | Any user | Open |
| `send-batch-tips` | Any user | Open |
| `update-profile` | Any user (own profile only) | `tx-sender` |
| `toggle-block-user` | Any user (own block list) | `tx-sender` |
| `set-paused` | Contract owner only | `(asserts! (is-eq tx-sender contract-owner))` |
| `set-fee-basis-points` | Contract owner only | `(asserts! (is-eq tx-sender contract-owner))` |

The contract owner is set to `tx-sender` at deployment time and cannot be transferred.

## Fee Calculation

Fees are calculated as `(amount * fee-basis-points) / 10000`. This uses integer division, which truncates toward zero:

- For very small amounts (below 200 microSTX at the default 0.5% fee), the fee rounds to zero. The recipient receives the full amount and the platform collects nothing.
- The maximum fee is capped at 10% (`<= u1000` basis points) by the `set-fee-basis-points` function. This prevents the contract owner from setting an unreasonably high fee.

## Trust Assumptions

Users should be aware of the following owner privileges:

1. **Pause control** - The contract owner can pause and unpause tipping at any time via `set-paused`.
2. **Fee adjustment** - The contract owner can change the fee percentage up to 10%.
3. **Fee collection** - Platform fees are sent directly to the contract owner's address on each tip.

There is currently no time-lock, multi-sig, or governance mechanism for admin actions. Users trust the contract owner to act in good faith.

## Post-Conditions

The frontend uses `PostConditionMode.Deny` with a post-condition that limits the sender to transferring at most the tip amount in STX. This prevents the contract from transferring more than the user authorized, even if the contract logic were compromised.

## Self-Tipping

The contract prevents users from tipping themselves: `(asserts! (not (is-eq tx-sender recipient)) err-invalid-amount)`.

## Blocking

Users can block other users from sending them tips. The block check uses the recipient's block list: `(asserts! (not (default-to false (map-get? blocked-users { blocker: recipient, blocked: tx-sender }))) err-user-blocked)`.

## Batch Tips

`send-batch-tips` accepts up to 50 tips and maps over them individually. Each tip in the batch is processed independently. If one tip fails (e.g., insufficient balance), the entire batch transaction reverts because Clarity transactions are atomic.

## Known Limitations

- No contract upgrade or migration path. If a bug is found, a new contract must be deployed and users must migrate manually.
- No ownership transfer mechanism.
- No time-lock on admin actions.
- Fee calculation truncates to zero for very small tip amounts.
- The `send-batch-tips` function does not aggregate individual errors; partial successes cause a full revert.

## Reporting Vulnerabilities

If you discover a security vulnerability, please open a private issue on the [GitHub repository](https://github.com/Mosas2000/TipStream) or contact the maintainers directly. Do not disclose vulnerabilities publicly until a fix is available.
