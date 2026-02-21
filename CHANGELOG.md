# Changelog

All notable changes to the TipStream project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added
- Toast notification system replacing browser alert() dialogs
- Fee breakdown display in SendTip showing platform fee and net amount
- Custom SVG favicon matching app branding
- MIT license file and license field in package.json manifests
- Contributing guidelines (CONTRIBUTING.md)
- Environment variable support for network switching (VITE_NETWORK)
- Shared `formatSTX` and `toMicroSTX` utility functions
- Centralized contract address configuration in `config/contracts.js`
- Post conditions for SendTip transactions (PostConditionMode.Deny)
- HTML meta tags for SEO, Open Graph, and Twitter Cards
- Contract explorer link in footer
- `.env.example` for frontend environment variables

### Changed
- PlatformStats now uses `fetchCallReadOnlyFunction` instead of undefined import
- Clarinet.toml updated with project description, author, clarity version, and epoch
- Error logging standardized to use `error.message` across all components
- Test script now requires RECIPIENT env var to avoid self-tipping
- Footer links point to real URLs with proper target and rel attributes
- Copyright year corrected to 2025

### Removed
- Debug console.log statements from frontend source
- Vite boilerplate styles from App.css
- Default vite.svg favicon
- Commented-out counter contract from Clarinet.toml

## [1.0.0] - 2025-01-01

### Added
- TipStream smart contract deployed on Stacks mainnet
- Send tip functionality with recipient address, amount, and message
- Platform fee system (0.5% via basis points)
- Admin functions for fee adjustment and contract pausing
- Recent tips feed with on-chain data
- User activity dashboard (tips sent/received)
- Platform-wide statistics display
- Leaderboard for top tippers and recipients
- Wallet connect/disconnect via Hiro Wallet
- Animated hero landing section
- Responsive tabbed interface
