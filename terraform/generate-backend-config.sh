#!/bin/bash

# Script to generate backend.tfvars file for Terraform R2 backend configuration
# Based on environment variables

set -e

if [ -z "$R2_BUCKET" ]; then
    echo "Error: R2_BUCKET environment variable is required"
    exit 1
fi

if [ -z "$TF_VAR_cloudflare_account_id" ]; then
    echo "Error: TF_VAR_cloudflare_account_id environment variable is required"
    exit 1
fi

if [ -z "$TF_VAR_environment" ]; then
    echo "Error: TF_VAR_environment environment variable is required"
    exit 1
fi

# Make sure TF_VAR_pr_number exists for ephemeral environments
if [ "$TF_VAR_environment" = "ephemeral" ] && [ -z "$TF_VAR_pr_number" ]; then
    echo "Error: TF_VAR_pr_number is required for ephemeral environments"
    exit 1
fi

if ! [[ "$TF_VAR_cloudflare_account_id" =~ ^[[:xdigit:]]{32}$ ]]; then
    echo "Error: TF_VAR_cloudflare_account_id must be a 32-character Cloudflare account ID"
    exit 1
fi

S3_ENDPOINT="https://${TF_VAR_cloudflare_account_id}.r2.cloudflarestorage.com"
if command -v sha256sum >/dev/null 2>&1; then
    ACCOUNT_ID_SHA="$(printf '%s' "$TF_VAR_cloudflare_account_id" | sha256sum | cut -c1-12)"
else
    ACCOUNT_ID_SHA="$(printf '%s' "$TF_VAR_cloudflare_account_id" | shasum -a 256 | cut -c1-12)"
fi

set +e
HTTP_CODE="$(curl -sS --connect-timeout 10 --max-time 20 -o /dev/null -w '%{http_code}' "$S3_ENDPOINT/")"
CURL_EXIT=$?
set -e

if [ "$CURL_EXIT" -ne 0 ]; then
    echo "Error: Unable to complete TLS handshake with Cloudflare R2 endpoint for account hash $ACCOUNT_ID_SHA"
    echo "Check the CLOUDFLARE_ACCOUNT_ID secret/variable in the selected GitHub Environment."
    exit 1
fi

ENDPOINTS="{ s3 = \"$S3_ENDPOINT\" }"

# Generate the .tfvars file
cat > backend.tfvars << EOF
bucket = "$R2_BUCKET"
key = "template/terraform.tfstate"
endpoints = $ENDPOINTS
EOF

echo "Generated Terraform backend config for bucket '$R2_BUCKET' using account hash $ACCOUNT_ID_SHA (R2 endpoint HTTP $HTTP_CODE)."
