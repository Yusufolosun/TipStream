#!/bin/bash
set -euo pipefail

# TipStream Deployment Script
# This script prepares the smart contract for mainnet deployment and builds the frontend.

echo "Starting TipStream deployment preparation..."

# Verify clarinet is installed
if ! command -v clarinet &> /dev/null; then
    echo "Error: clarinet is not installed or not in PATH."
    echo "Install it from https://github.com/hirosystems/clarinet"
    exit 1
fi

# Run contract checks before deploying
echo "Running contract syntax check..."
if ! clarinet check; then
    echo "Error: contract check failed. Fix issues before deploying."
    exit 1
fi

# Generate deployment plan for mainnet
echo "Generating Clarinet mainnet deployment plan..."
if ! clarinet deployments generate --mainnet --medium-cost; then
    echo "Error: failed to generate deployment plan."
    exit 1
fi

# Verify deployment plan was created
if [ ! -f "deployments/default.mainnet-plan.yaml" ]; then
    echo "Error: deployment plan not found at deployments/default.mainnet-plan.yaml"
    exit 1
fi

echo "Mainnet deployment plan generated successfully."

# Post-deployment instructions
echo ""
echo "Next steps:"
echo "  1. Review the plan:  cat deployments/default.mainnet-plan.yaml"
echo "  2. Deploy contract:  clarinet deployments apply -p deployments/default.mainnet-plan.yaml"
echo "  3. Build frontend:   cd frontend && npm run build"
echo ""
echo "Preparation complete."
