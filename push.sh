#!/bin/bash

# =============================================================================
# Smart Push Script for Ouse Passar Monorepo
# =============================================================================
# This script automatically pushes changes to the correct repositories based
# on which packages were modified in the commits.
#
# Repositories:
#   - packages/site    -> https://github.com/deviuno/site-ouse
#   - packages/questoes -> https://github.com/deviuno/Ouse-Questoes
# =============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}   Ouse Passar - Smart Push Script${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check if we're in a git repository
if ! git rev-parse --is-inside-work-tree > /dev/null 2>&1; then
    echo -e "${RED}Error: Not a git repository${NC}"
    exit 1
fi

# Get the list of changed files in the last commit compared to each remote
ORIGIN_CHANGES=$(git diff --name-only origin/main...HEAD 2>/dev/null || git diff --name-only HEAD~1 HEAD)

# Check which packages have changes
SITE_CHANGED=false
QUESTOES_CHANGED=false

if echo "$ORIGIN_CHANGES" | grep -q "^packages/site/"; then
    SITE_CHANGED=true
fi

if echo "$ORIGIN_CHANGES" | grep -q "^packages/questoes/"; then
    QUESTOES_CHANGED=true
fi

# Also check for root-level changes that should go to origin
ROOT_CHANGED=false
if echo "$ORIGIN_CHANGES" | grep -qvE "^packages/"; then
    ROOT_CHANGED=true
fi

echo -e "${YELLOW}Analyzing changes...${NC}"
echo ""

# Push to origin (monorepo) first
echo -e "${BLUE}[1/3] Pushing to origin (monorepo)...${NC}"
if git push origin main 2>/dev/null; then
    echo -e "${GREEN}  ✓ origin/main updated${NC}"
else
    echo -e "${YELLOW}  - origin/main already up to date${NC}"
fi
echo ""

# Push to site repository if site package changed
echo -e "${BLUE}[2/3] Checking site package...${NC}"
if [ "$SITE_CHANGED" = true ]; then
    echo -e "${YELLOW}  Site changes detected, pushing to site-ouse...${NC}"
    if git push site main 2>/dev/null; then
        echo -e "${GREEN}  ✓ site-ouse updated${NC}"
    else
        echo -e "${YELLOW}  - Trying force push...${NC}"
        git push site main --force
        echo -e "${GREEN}  ✓ site-ouse force updated${NC}"
    fi
else
    echo -e "${YELLOW}  - No changes in packages/site${NC}"
fi
echo ""

# Push to questoes repository if questoes package changed
echo -e "${BLUE}[3/3] Checking questoes package...${NC}"
if [ "$QUESTOES_CHANGED" = true ]; then
    echo -e "${YELLOW}  Questoes changes detected, pushing to Ouse-Questoes...${NC}"
    if git push questoes main 2>/dev/null; then
        echo -e "${GREEN}  ✓ Ouse-Questoes updated${NC}"
    else
        echo -e "${YELLOW}  - Trying force push...${NC}"
        git push questoes main --force
        echo -e "${GREEN}  ✓ Ouse-Questoes force updated${NC}"
    fi
else
    echo -e "${YELLOW}  - No changes in packages/questoes${NC}"
fi

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}   Push completed successfully!${NC}"
echo -e "${GREEN}========================================${NC}"
