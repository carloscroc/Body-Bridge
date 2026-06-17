#!/bin/bash
# Automated Dependency Security Update Script
# Usage: ./update-dependencies.sh [package-manager] [update-level]

set -euo pipefail

PACKAGE_MANAGER="npm"
UPDATE_LEVEL="minor"  # default: patch, can be 'patch', 'minor', or 'major'

# Parse arguments
if [ $# -gt 0 ]; then
    PACKAGE_MANAGER=$1
fi

if [ $# -gt 1 ]; then
    UPDATE_LEVEL=$2
fi

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Dependency Security Update Script${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}Package Manager:${NC} $PACKAGE_MANAGER"
echo -e "${GREEN}Update Level:${NC} $UPDATE_LEVEL"
echo -e "${BLUE}========================================${NC}"
echo ""

# Function to run npm commands
run_npm() {
    echo -e "${YELLOW}Running: $1${NC}"
    eval "$1"
    echo ""
}

# Step 1: Audit current vulnerabilities
echo -e "${BLUE}Step 1: Checking current vulnerabilities...${NC}"
run_npm "npm audit --audit-level=high"
echo ""

# Step 2: Check for outdated packages
echo -e "${BLUE}Step 2: Checking for outdated packages...${NC}"
run_npm "npm outdated --json > outdated-packages.json"
if [ -s outdated-packages.json ]; then
    echo -e "${RED}Found $(jq 'length' outdated-packages.json) outdated package(s)${NC}"
else
    echo -e "${GREEN}No outdated packages found${NC}"
fi
echo ""

# Step 3: Display outdated packages
if [ -s outdated-packages.json ]; then
    echo -e "${BLUE}Outdated packages:${NC}"
    jq -r '.[] | "\(.packageName): \(.current) -> \(.latest)"' outdated-packages.json
    echo ""
fi

# Step 4: Cleanup old node_modules
echo -e "${BLUE}Step 3: Cleaning up old node_modules...${NC}"
run_npm "rm -rf node_modules package-lock.json"
echo ""

# Step 5: Install dependencies
echo -e "${BLUE}Step 4: Installing dependencies...${NC}"
run_npm "npm install"
echo ""

# Step 6: Run security audit
echo -e "${BLUE}Step 5: Running security audit...${NC}"
run_npm "npm audit --audit-level=high"
echo ""

# Step 7: Check for new vulnerabilities
if [ -s outdated-packages.json ]; then
    echo -e "${YELLOW}Note: Some packages still show as outdated${NC}"
    echo -e "${YELLOW}Consider manually updating critical packages:${NC}"
    jq -r '.[] | select(.latest | split(".") | .[0] as $v | [$v, "0", "0"] | map(tonumber) | map(select(. > 0)) | length > 0) | "  - \(.packageName): \(.current) -> \(.latest)"' outdated-packages.json
fi

# Step 8: Generate updated SBOM
echo -e "${BLUE}Step 6: Generating updated SBOM...${NC}"
run_npm "npx @cyclonedx/cyclonedx-npm -o sbom.json"
if [ -f sbom.json ]; then
    echo -e "${GREEN}✓ SBOM generated: sbom.json${NC}"
    rm sbom.json  # Cleanup temporary SBOM
fi

# Step 9: Display summary
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Update Summary${NC}"
echo -e "${BLUE}========================================${NC}"

if [ -s outdated-packages.json ]; then
    echo -e "${YELLOW}✓ Some packages may still be outdated${NC}"
    echo -e "${YELLOW}  Run 'npm outdated' to see details${NC}"
else
    echo -e "${GREEN}✓ All packages are up to date${NC}"
fi

echo -e "${GREEN}✓ Dependencies installed successfully${NC}"
echo -e "${GREEN}✓ Security audit completed${NC}"
echo -e "${GREEN}✓ npm lock file updated${NC}"

echo ""
echo -e "${BLUE}Next steps:${NC}"
echo -e "  1. Run tests: ${YELLOW}npm test${NC}"
echo -e "  2. Run build: ${YELLOW}npm run build${NC}"
echo -e "  3. Review any changes in git: ${YELLOW}git diff package.json${NC}"

# Cleanup
rm -f outdated-packages.json

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✓ Update Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
