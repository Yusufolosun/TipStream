# Contributing to TipStream

Thanks for your interest in contributing to TipStream. This guide covers the basics of getting set up and submitting changes.

## Prerequisites

- [Node.js](https://nodejs.org/) v18 or later
- [Clarinet](https://github.com/hirosystems/clarinet) for smart contract development
- A [Hiro Wallet](https://wallet.hiro.so/) for testing on testnet/devnet

## Getting Started

1. Fork the repository and clone your fork:

```bash
git clone https://github.com/<your-username>/TipStream.git
cd TipStream
```

2. Install dependencies for the smart contract tests:

```bash
npm install
```

3. Install dependencies for the frontend:

```bash
cd frontend
npm install
```

4. Copy the environment file and configure it:

```bash
cp .env.example .env
```

5. Start the frontend dev server:

```bash
npm run dev
```

## Project Structure

```
contracts/        Clarity smart contracts
tests/            Contract unit tests (Vitest + Clarinet SDK)
frontend/         React frontend (Vite + Tailwind CSS)
scripts/          Deployment and utility scripts
settings/         Network configuration (Devnet, Testnet, Mainnet)
deployments/      Deployment plans
```

## Running Tests

**Smart contract tests:**

```bash
npm test
```

**Contract syntax check:**

```bash
clarinet check
```

## Making Changes

1. Create a branch from `main`:

```bash
git checkout -b fix/short-description
```

2. Make your changes with clear, focused commits.

3. Run tests to make sure nothing is broken.

4. Push your branch and open a pull request against `main`.

## Commit Messages

- Use lowercase, imperative mood: `fix input validation for tip amount`
- Keep the subject line under 72 characters
- Add a blank line and a body paragraph if the change needs explanation

## Pull Requests

- Reference any related issue with `closes #N` in the PR description
- Keep PRs focused on a single concern
- Make sure tests pass before requesting review

## Smart Contract Changes

If you are modifying the Clarity contract:

- Run `clarinet check` to validate syntax
- Run `npm test` to verify all contract tests pass
- Document any new public functions or error codes
- Consider backward compatibility since the contract is deployed on mainnet

## Code Style

- Frontend follows the existing ESLint configuration
- Use functional React components with hooks
- Keep components small and focused
- Use the shared utilities in `src/lib/utils.js` for formatting

## Reporting Issues

If you find a bug or have a feature request, please open an issue with:

- A clear title describing the problem or feature
- Steps to reproduce (for bugs)
- Expected vs actual behavior
- Any relevant screenshots or error messages

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).
