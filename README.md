# TipStream

A micro-tipping platform built on the Stacks blockchain.

## Features

- **Send STX Tips**: Send micro-tips with optional messages to any Stacks address.
- **Activity Tracking**: View your sent and received tips in a beautifully designed dashboard.
- **Platform Analytics**: Real-time stats on total volume, tip counts, and fees.
- **Live Stream**: Watch tipping activity happen live on-chain.
- **Leaderboards**: Compete for the top spot among tippers and creators.

## Deployment Status

- **Smart Contract**: `tipstream.clar`
- **Address**: `SP31PKQVQZVZCK3FM3NH67CGD6G1FMR17VQVS2W5T.tipstream`
- **Network**: Mainnet (Secured by Bitcoin)
- **Status**: ✅ Deployed
- **Transaction ID**: [0xf7ac0877ce65494779264fb0172023facd101b639ad5ae8bbd71e102387033ef](https://explorer.hiro.so/txid/0xf7ac0877ce65494779264fb0172023facd101b639ad5ae8bbd71e102387033ef?chain=mainnet)

## Quick Start

### Smart Contract
```bash
# Initialize and test
clarinet check
npm test

# Deploy to Mainnet
sh scripts/deploy.sh
clarinet deployments apply -p deployments/default.mainnet-plan.yaml
```

### Frontend
```bash
cd frontend
npm install
npm run dev # Development
npm run build # Production
```

## Architecture

See [ARCHITECTURE.md](ARCHITECTURE.md) for the system design, data model, component hierarchy, and deployment overview.

## Security Note

The `settings/Devnet.toml` file contains mnemonic phrases and private keys for Clarinet devnet test accounts. These hold **no real value** and exist only in the local devnet sandbox. Never use devnet mnemonics or keys on mainnet or testnet.

See [SECURITY.md](SECURITY.md) for the full smart contract security audit, access control model, and vulnerability reporting guidelines.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for setup instructions, coding standards, and how to submit pull requests.

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for a history of changes and releases.

## License
MIT
