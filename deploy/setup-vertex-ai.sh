#!/bin/bash

# TutorAI - Vertex AI Setup Script
# Sets up Vertex AI and required authentication for Gemini 2.5 Flash

set -e  # Exit on any error

# Configuration
PROJECT_ID="${PROJECT_ID:-ai-math-tutor-prod}"
REGION="${REGION:-asia-southeast1}"
SERVICE_ACCOUNT_NAME="vertex-ai-tutor"
SERVICE_ACCOUNT_EMAIL="${SERVICE_ACCOUNT_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Setting up Vertex AI for TutorAI${NC}"
echo "Project: ${PROJECT_ID}"
echo "Region: ${REGION}"
echo ""

# Set the project
echo -e "${BLUE}Setting GCP project...${NC}"
gcloud config set project "${PROJECT_ID}"

# Enable required APIs
echo -e "${BLUE}Enabling required APIs...${NC}"
gcloud services enable \
  aiplatform.googleapis.com \
  compute.googleapis.com \
  cloudbuild.googleapis.com \
  run.googleapis.com \
  secretmanager.googleapis.com

# Create service account for Vertex AI
echo -e "${BLUE}Creating Vertex AI service account...${NC}"
if ! gcloud iam service-accounts describe "${SERVICE_ACCOUNT_EMAIL}" --quiet 2>/dev/null; then
  gcloud iam service-accounts create "${SERVICE_ACCOUNT_NAME}" \
    --display-name="TutorAI Vertex AI Service Account" \
    --description="Service account for accessing Vertex AI APIs in TutorAI"
  echo -e "${GREEN}✓ Service account created${NC}"
  
  # Wait for service account propagation
  echo -e "${BLUE}Waiting for service account to propagate...${NC}"
  sleep 10
else
  echo -e "${YELLOW}Service account already exists${NC}"
fi

# Grant necessary IAM roles
echo -e "${BLUE}Granting IAM roles...${NC}"
gcloud projects add-iam-policy-binding "${PROJECT_ID}" \
  --member="serviceAccount:${SERVICE_ACCOUNT_EMAIL}" \
  --role="roles/aiplatform.user"

gcloud projects add-iam-policy-binding "${PROJECT_ID}" \
  --member="serviceAccount:${SERVICE_ACCOUNT_EMAIL}" \
  --role="roles/ml.developer"

# Create and store service account key
echo -e "${BLUE}Creating service account key...${NC}"
KEY_FILE="/tmp/vertex-ai-key.json"
gcloud iam service-accounts keys create "${KEY_FILE}" \
  --iam-account="${SERVICE_ACCOUNT_EMAIL}"

# Store the key in Secret Manager
echo -e "${BLUE}Storing service account key in Secret Manager...${NC}"
if ! gcloud secrets describe VERTEX_AI_SERVICE_KEY --quiet 2>/dev/null; then
  gcloud secrets create VERTEX_AI_SERVICE_KEY --data-file="${KEY_FILE}"
  echo -e "${GREEN}✓ Secret created${NC}"
else
  echo -e "${YELLOW}Secret already exists, updating...${NC}"
  gcloud secrets versions add VERTEX_AI_SERVICE_KEY --data-file="${KEY_FILE}"
fi

# Clean up temporary key file
rm "${KEY_FILE}"

# Grant Cloud Build access to the secret
echo -e "${BLUE}Granting Cloud Build access to secrets...${NC}"
PROJECT_NUMBER=$(gcloud projects describe "${PROJECT_ID}" --format="value(projectNumber)")
CLOUD_BUILD_SA="${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com"

gcloud secrets add-iam-policy-binding VERTEX_AI_SERVICE_KEY \
  --member="serviceAccount:${CLOUD_BUILD_SA}" \
  --role="roles/secretmanager.secretAccessor"

gcloud secrets add-iam-policy-binding FIREBASE_PRIVATE_KEY \
  --member="serviceAccount:${CLOUD_BUILD_SA}" \
  --role="roles/secretmanager.secretAccessor"

# Test Vertex AI access
echo -e "${BLUE}Testing Vertex AI access...${NC}"
gcloud ai models list --region="${REGION}" --limit=1 > /dev/null 2>&1 && \
  echo -e "${GREEN}✓ Vertex AI access confirmed${NC}" || \
  echo -e "${YELLOW}⚠ Vertex AI access test failed - may need time to propagate${NC}"

echo ""
echo -e "${GREEN}🎉 Vertex AI setup complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Deploy using: gcloud builds submit --config=cloudbuild-direct.yaml"
echo "2. The deployed service will have access to Gemini 2.5 Flash"
echo ""
echo "Environment variables configured:"
echo "- GOOGLE_CLOUD_PROJECT=${PROJECT_ID}"
echo "- GOOGLE_CLOUD_REGION=${REGION}"
echo "- GOOGLE_APPLICATION_CREDENTIALS (from secret)"