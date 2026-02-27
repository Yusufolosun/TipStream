# TipStream Roadmap

> A phased plan for building the premier micro-tipping platform on Stacks, secured by Bitcoin.

---

## Phase 1 — Core Tipping (Current)

**Status:** Complete

The foundation is live on mainnet. Users can send STX tips, track activity, and explore the platform.

| Feature | Status |
|---------|--------|
| STX tip sending with configurable amounts | ✅ Shipped |
| Platform fee collection (0.5%) | ✅ Shipped |
| User profiles with display names and bios | ✅ Shipped |
| Tip history and activity tracking | ✅ Shipped |
| Tip categories and tags | ✅ Shipped |
| Batch tipping (up to 10 recipients) | ✅ Shipped |
| User blocking / privacy controls | ✅ Shipped |
| Admin dashboard with platform analytics | ✅ Shipped |
| SIP-010 token tipping support | ✅ Shipped |
| PWA with offline support | ✅ Shipped |
| Demo / sandbox mode | ✅ Shipped |
| Contract deployment health check | ✅ Shipped |
| Web Vitals performance monitoring | ✅ Shipped |
| Comprehensive test suite (contract + frontend + E2E) | ✅ Shipped |

---

## Phase 2 — Social & Discovery

**Status:** In Progress

Make tipping more social and help users discover creators worth supporting.

| Feature | Target |
|---------|--------|
| Public leaderboard with sorting and filtering | ✅ Shipped |
| Real-time notification system | ✅ Shipped |
| Shareable tip receipts (social cards) | ✅ Shipped |
| Embeddable tip widgets for external sites | Q3 2025 |
| Creator profiles with tip goals and milestones | Q3 2025 |
| Follow system for favorite creators | Q3 2025 |
| Tip streaks and achievement badges | Q3 2025 |
| Social feed with tip activity from followed creators | Q4 2025 |

---

## Phase 3 — Advanced Features

**Status:** Planned

Expand beyond simple tipping into recurring support and content monetization.

| Feature | Target |
|---------|--------|
| Recurring subscriptions (monthly tips) | Q4 2025 |
| Escrow-based milestone tipping | Q4 2025 |
| Content-linked tips (attach URLs to tips) | Q4 2025 |
| Referral rewards program | Q1 2026 |
| Multi-signature treasury management | Q1 2026 |
| DAO governance for platform decisions | Q1 2026 |
| Advanced analytics dashboard for creators | Q1 2026 |
| Tip splitting (multiple recipients per tip) | Q2 2026 |

---

## Phase 4 — Ecosystem & Integrations

**Status:** Planned

Build an ecosystem around TipStream that connects with the broader Stacks and Bitcoin communities.

| Feature | Target |
|---------|--------|
| Public REST API for third-party integrations | Q2 2026 |
| Browser extension for tipping on any website | Q2 2026 |
| Discord / Telegram bot integration | Q3 2026 |
| Mobile app (React Native) | Q3 2026 |
| Chainhook-powered real-time event processing | Q3 2026 |
| Cross-chain tipping via bridges | Q4 2026 |
| SDK for developers to embed tipping in their apps | Q4 2026 |
| Marketplace for premium creator tools | 2027 |

---

## Technical Debt & Infrastructure

Ongoing improvements that span all phases:

- [ ] Migrate frontend fully to TypeScript
- [ ] Add comprehensive contract property-based testing
- [ ] Implement CI/CD pipeline with automated testing
- [ ] Add contract upgrade mechanism (proxy pattern)
- [ ] Set up monitoring and alerting for mainnet contract
- [ ] Optimize bundle size and code splitting
- [ ] Add internationalization (i18n) support
- [ ] Implement rate limiting and abuse prevention at API level

---

## How to Contribute

We welcome contributions! Check our [Contributing Guide](CONTRIBUTING.md) for details on:
- Picking up roadmap items
- Proposing new features
- Reporting bugs
- Submitting pull requests

---

## Buildathon Deliverables

This project was built for the Stacks Buildathon. Key deliverables:

1. **Smart Contract** — 11 Clarity contracts deployed on mainnet
2. **Frontend** — Full-featured React SPA with wallet integration
3. **Testing** — 100+ tests (contract, frontend unit, integration, E2E)
4. **Documentation** — Architecture docs, security policy, upgrade strategy, roadmap
5. **Demo Mode** — Risk-free exploration without needing STX

---

*Last updated: July 2025*
