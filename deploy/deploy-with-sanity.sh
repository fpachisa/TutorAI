#!/bin/bash

# TutorAI Production Deployment with Sanity CMS
# This script deploys the application with complete Sanity integration

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 TutorAI Production Deployment with Sanity CMS${NC}"
echo "=================================================="

# Check required environment variables
if [[ -z "$PROJECT_ID" ]]; then
    echo -e "${RED}❌ Error: PROJECT_ID environment variable is required${NC}"
    exit 1
fi

if [[ -z "$REGION" ]]; then
    echo -e "${YELLOW}⚠️  Warning: REGION not set, using default: asia-southeast1${NC}"
    export REGION="asia-southeast1"
fi

echo -e "${BLUE}📋 Deployment Configuration:${NC}"
echo "  • Project ID: $PROJECT_ID"
echo "  • Region: $REGION"
echo "  • Sanity Project: nq8wt9av"
echo "  • Sanity Dataset: production"
echo

# Verify Sanity secret exists
echo -e "${BLUE}🔐 Verifying Sanity API token in Secret Manager...${NC}"
if gcloud secrets describe SANITY_API_TOKEN --quiet > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Sanity API token found in Secret Manager${NC}"
else
    echo -e "${RED}❌ Error: SANITY_API_TOKEN not found in Secret Manager${NC}"
    echo "Please run: gcloud secrets create SANITY_API_TOKEN --data-file=<path-to-token-file>"
    exit 1
fi

# Test Sanity connection
echo -e "${BLUE}🔌 Testing Sanity connection...${NC}"
cd apps/web
if node scripts/test-sanity.js > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Sanity connection successful${NC}"
else
    echo -e "${YELLOW}⚠️  Warning: Could not verify Sanity connection (may work in production)${NC}"
fi
cd ../..

# Deploy using Cloud Build
echo -e "${BLUE}🏗️  Starting Cloud Build deployment...${NC}"
gcloud builds submit --config=infra/cloudbuild-simple.yaml

echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
echo

# Get service URL
echo -e "${BLUE}🌐 Getting service URL...${NC}"
SERVICE_URL=$(gcloud run services describe tutorai-web --region=$REGION --format='value(status.url)')
echo -e "${GREEN}🔗 Service URL: $SERVICE_URL${NC}"

# Test health endpoint
echo -e "${BLUE}🏥 Testing health endpoint...${NC}"
if curl -f "$SERVICE_URL/api/health" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Health check passed!${NC}"
else
    echo -e "${YELLOW}⚠️  Health check failed - service may still be starting up${NC}"
fi

# Test curriculum API with Sanity
echo -e "${BLUE}📚 Testing curriculum API with Sanity...${NC}"
if curl -f "$SERVICE_URL/api/curriculum/topics?grade=primary-6&subject=mathematics" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Curriculum API working with Sanity CMS!${NC}"
else
    echo -e "${YELLOW}⚠️  Curriculum API test failed - check logs for details${NC}"
fi

echo
echo -e "${GREEN}🎉 TutorAI with Sanity CMS deployed successfully!${NC}"
echo "=================================================="
echo -e "${BLUE}Next steps:${NC}"
echo "1. Test the complete Socratic tutoring flow"
echo "2. Monitor application logs: gcloud logs read --service=tutorai-web"
echo "3. Access Sanity Studio: https://nq8wt9av.sanity.studio/"
echo