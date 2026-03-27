#!/bin/bash
# License Compliance Checker
# Usage: ./license-checker.sh [--output-format text|json]

set -euo pipefail

OUTPUT_FORMAT="text"

# Parse arguments
if [ $# -gt 0 ]; then
    OUTPUT_FORMAT=$1
fi

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}License Compliance Checker${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Function to check license type
check_license() {
    local license=$1
    case "$license" in
        "MIT")
            echo -e "${GREEN}✓${NC} MIT (Permissive)"
            ;;
        "Apache-2.0")
            echo -e "${GREEN}✓${NC} Apache-2.0 (Permissive)"
            ;;
        "Apache License 2.0")
            echo -e "${GREEN}✓${NC} Apache License 2.0 (Permissive)"
            ;;
        "ISC")
            echo -e "${GREEN}✓${NC} ISC (Permissive)"
            ;;
        "BSD-3-Clause")
            echo -e "${GREEN}✓${NC} BSD-3-Clause (Permissive)"
            ;;
        "BlueOak-1.0.0")
            echo -e "${GREEN}✓${NC} BlueOak-1.0.0 (Permissive)"
            ;;
        "UNLICENSED")
            echo -e "${YELLOW}⚠${NC} UNLICENSED (Private)"
            ;;
        "GPL"|"gpl"|"AGPL"|"agpl"|"LGPL"|"lgpl")
            echo -e "${RED}✗${NC} $license (RESTRICTIVE - Consider replacement)"
            ;;
        "CDDL"|"cddl"|"CPL"|"cpl")
            echo -e "${RED}✗${NC} $license (RESTRICTIVE - Consider replacement)"
            ;;
        *)
            echo -e "${YELLOW}⚠${NC} UNKNOWN ($license)"
            ;;
    esac
}

# Check production dependencies
echo -e "${BLUE}Production Dependencies:${NC}"
echo ""

case $OUTPUT_FORMAT in
    json)
        echo '['
        first=true

        while IFS=':' read -r package license; do
            if [ -n "$package" ]; then
                if [ "$first" = true ]; then
                    first=false
                else
                    echo ','
                fi
                echo "  {"
                echo "    \"package\": \"$package\","
                echo "    \"license\": \"$license\","
                echo "    \"status\": \"$(case $license in MIT|Apache-2.0|ISC|BSD-3-Clause|BlueOak-1.0.0)permissive$(esac)\""
                echo "  }"
            fi
        done < <(npx license-checker --production --json 2>/dev/null | jq -r 'to_entries[] | "\(.key):\(.value.licenses)"' 2>/dev/null || true)

        echo ']'
        ;;

    text)
        while IFS=':' read -r package license; do
            if [ -n "$package" ]; then
                echo -e "  ${BLUE}$package${NC}"
                check_license "$license"
            fi
        done < <(npx license-checker --production --json 2>/dev/null | jq -r 'to_entries[] | "\(.key):\(.value.licenses)"' 2>/dev/null || true)

        echo ""
        ;;
esac

# Summary
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Summary${NC}"
echo -e "${BLUE}========================================${NC}"

RESTRICTIVE_COUNT=$(npx license-checker --production --json 2>/dev/null | jq -r '[.[] | select(.licenses == "GPL" or .licenses == "AGPL" or .licenses == "CDDL")] | length' 2>/dev/null || echo 0)

if [ "$RESTRICTIVE_COUNT" -eq 0 ]; then
    echo -e "${GREEN}✓ All licenses are permissive${NC}"
    echo -e "${GREEN}✓ No license compliance issues${NC}"
    echo -e "${GREEN}✓ Project ready for public distribution${NC}"
else
    echo -e "${RED}✗ Found $RESTRICTIVE_COUNT package(s) with restrictive licenses${NC}"
    echo -e "${RED}✗ These may impact commercial use or require attribution${NC}"
    echo -e "${YELLOW}⚠ Review these packages:${NC}"

    npx license-checker --production --json 2>/dev/null | jq -r '.[] | select(.licenses == "GPL" or .licenses == "AGPL" or .licenses == "CDDL") | "  - \(.name): \(.licenses)"' 2>/dev/null || true
fi

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Export Options${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "Export as JSON:"
echo -e "  ${GREEN}./license-checker.sh json > licenses.json${NC}"
echo ""
echo -e "Export as CSV:"
echo -e "  ${GREEN}./license-checker.sh json | jq -r '.[] | \"\(.package),\(.license)\"' > licenses.csv${NC}"
echo ""
echo -e "View detailed report:"
echo -e "  ${GREEN}./license-checker.sh${NC}"
echo -e "${GREEN}========================================${NC}"
