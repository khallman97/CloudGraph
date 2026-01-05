#!/bin/bash
# Deploy CloudGraph IDE Frontend to S3 + CloudFront
#
# Usage:
#   ./deploy-frontend.sh
#
# Prerequisites:
#   - AWS CLI configured
#   - Terraform outputs available (run from terraform directory, or set env vars)
#   - Node.js and npm installed

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  CloudGraph IDE - Frontend Deployment${NC}"
echo -e "${GREEN}========================================${NC}"

# Get configuration from Terraform outputs or environment
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TERRAFORM_DIR="$SCRIPT_DIR/../terraform"
FRONTEND_DIR="$SCRIPT_DIR/../../../frontend"

# Try to get values from Terraform
if [ -d "$TERRAFORM_DIR" ] && command -v terraform &> /dev/null; then
    cd "$TERRAFORM_DIR"

    if terraform output &> /dev/null; then
        BUCKET_NAME=$(terraform output -raw frontend_bucket_name 2>/dev/null || echo "")
        DISTRIBUTION_ID=$(terraform output -raw cloudfront_distribution_id 2>/dev/null || echo "")
        CLOUDFRONT_DOMAIN=$(terraform output -raw cloudfront_domain_name 2>/dev/null || echo "")
    fi
fi

# Fall back to environment variables if Terraform outputs not available
BUCKET_NAME="${BUCKET_NAME:-$S3_BUCKET_NAME}"
DISTRIBUTION_ID="${DISTRIBUTION_ID:-$CLOUDFRONT_DISTRIBUTION_ID}"
CLOUDFRONT_DOMAIN="${CLOUDFRONT_DOMAIN:-$CLOUDFRONT_DOMAIN_NAME}"

# Validate required values
if [ -z "$BUCKET_NAME" ]; then
    echo -e "${RED}Error: S3 bucket name not found.${NC}"
    echo "Set S3_BUCKET_NAME environment variable or run from terraform directory."
    exit 1
fi

if [ -z "$DISTRIBUTION_ID" ]; then
    echo -e "${RED}Error: CloudFront distribution ID not found.${NC}"
    echo "Set CLOUDFRONT_DISTRIBUTION_ID environment variable or run from terraform directory."
    exit 1
fi

echo -e "${YELLOW}Configuration:${NC}"
echo "  S3 Bucket:      $BUCKET_NAME"
echo "  Distribution:   $DISTRIBUTION_ID"
echo "  CloudFront:     $CLOUDFRONT_DOMAIN"
echo ""

# Build frontend
echo -e "${YELLOW}Building frontend...${NC}"
cd "$FRONTEND_DIR"

# Set API URL to CloudFront domain
export VITE_API_URL="https://${CLOUDFRONT_DOMAIN}"
echo "  VITE_API_URL=$VITE_API_URL"

npm run build

echo -e "${GREEN}Build complete!${NC}"
echo ""

# Deploy to S3
echo -e "${YELLOW}Deploying to S3...${NC}"
aws s3 sync dist/ "s3://${BUCKET_NAME}" \
    --delete \
    --cache-control "public, max-age=31536000, immutable" \
    --exclude "index.html" \
    --exclude "*.json"

# Upload index.html and JSON files with no-cache
aws s3 cp dist/index.html "s3://${BUCKET_NAME}/index.html" \
    --cache-control "no-cache, no-store, must-revalidate"

# Upload any JSON files (like manifest) with shorter cache
find dist -name "*.json" -exec aws s3 cp {} "s3://${BUCKET_NAME}/" \
    --cache-control "public, max-age=0, must-revalidate" \;

echo -e "${GREEN}S3 deployment complete!${NC}"
echo ""

# Invalidate CloudFront cache
echo -e "${YELLOW}Invalidating CloudFront cache...${NC}"
INVALIDATION_ID=$(aws cloudfront create-invalidation \
    --distribution-id "$DISTRIBUTION_ID" \
    --paths "/*" \
    --query 'Invalidation.Id' \
    --output text)

echo "  Invalidation ID: $INVALIDATION_ID"
echo -e "${GREEN}Cache invalidation started!${NC}"
echo ""

# Summary
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  Deployment Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "  ${YELLOW}Application URL:${NC} https://${CLOUDFRONT_DOMAIN}"
echo ""
echo "  Note: CloudFront invalidation may take a few minutes to propagate."
echo ""
