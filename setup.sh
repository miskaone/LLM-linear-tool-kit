#!/bin/bash

# Linear Toolkit - Local Setup Script
# Automates the setup process for local development

set -e  # Exit on error

echo "🚀 Linear Toolkit - Local Setup"
echo "================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check prerequisites
echo "📋 Checking prerequisites..."

if ! command -v node &> /dev/null; then
  echo -e "${RED}❌ Node.js not found. Please install Node.js 18+${NC}"
  exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
  echo -e "${RED}❌ Node.js 18+ required (you have $NODE_VERSION)${NC}"
  exit 1
fi

if ! command -v git &> /dev/null; then
  echo -e "${RED}❌ Git not found. Please install Git${NC}"
  exit 1
fi

echo -e "${GREEN}✅ Node.js $(node -v)${NC}"
echo -e "${GREEN}✅ Git $(git --version | cut -d' ' -f3)${NC}"
echo ""

# Check if .env exists
if [ -f .env ]; then
  echo -e "${YELLOW}⚠️  .env already exists${NC}"
  read -p "Overwrite it? (y/N) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Skipping .env creation"
  else
    rm .env
  fi
else
  # Create .env
  echo "📝 Creating .env file..."

  read -p "Enter Linear API Key (lin_api_...): " LINEAR_API_KEY
  read -p "Enter GitHub Organization name (optional): " GITHUB_ORG
  read -p "Enter GitHub Personal Access Token (optional): " GITHUB_TOKEN

  cat > .env <<EOF
# Linear API Configuration
LINEAR_API_KEY=$LINEAR_API_KEY

# GitHub Organization Configuration (optional, for org-wide mode)
GITHUB_ORG=$GITHUB_ORG
GITHUB_TOKEN=$GITHUB_TOKEN

# Deployment Mode
DEPLOYMENT_MODE=org-wide

# Optional: Cache and Logging
REPO_CACHE_TTL=3600000
LOG_LEVEL=info
EOF

  echo -e "${GREEN}✅ Created .env${NC}"
fi

echo ""

# Install dependencies
if [ -d "node_modules" ]; then
  echo -e "${YELLOW}⚠️  node_modules already exists${NC}"
  read -p "Reinstall dependencies? (y/N) " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "📦 Installing dependencies..."
    npm install
    echo -e "${GREEN}✅ Dependencies installed${NC}"
  fi
else
  echo "📦 Installing dependencies..."
  npm install
  echo -e "${GREEN}✅ Dependencies installed${NC}"
fi

echo ""

# Build TypeScript
echo "🔨 Building TypeScript..."
npm run build
echo -e "${GREEN}✅ Build complete${NC}"

echo ""

# Run tests
read -p "Run tests? (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  echo "🧪 Running tests..."
  npm test -- --passWithNoTests
  echo -e "${GREEN}✅ Tests complete${NC}"
fi

echo ""

# Validate configuration
echo "✓ Validating configuration..."
node -e "
const { loadConfig } = require('./dist/utils/config');
try {
  const config = loadConfig();
  console.log('✅ Configuration valid!');
  console.log('   - Linear API Key:', config.apiKey ? '✓ SET' : '✗ MISSING');
  console.log('   - Deployment Mode:', config.deploymentMode || 'per-repo');
  if (config.github) {
    console.log('   - GitHub Org:', config.github.org);
  }
} catch (error) {
  console.error('❌ Configuration error:', error.message);
  process.exit(1);
}
"

echo ""
echo -e "${GREEN}🎉 Setup complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Read the quick start guide:"
echo "   cat docs/QUICK_START_LOCAL.md"
echo ""
echo "2. Try the toolkit:"
echo "   node example-basic.js"
echo ""
echo "3. Run with file watching:"
echo "   npm run watch"
echo ""
