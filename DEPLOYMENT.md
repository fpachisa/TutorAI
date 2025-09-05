# TutorAI Production Deployment Guide

## Overview

This guide covers the complete production deployment of TutorAI with Sanity CMS integration. The application uses Google Cloud Run for hosting, Firestore for user data, and Sanity CMS for curriculum content management.

## Prerequisites

### Required Tools
- Google Cloud SDK (`gcloud` CLI)
- Docker
- Node.js and pnpm
- Firebase CLI (optional, for Firestore rules)

### Required Access
- Google Cloud Project: `ai-math-tutor-prod`
- Sanity Project: `nq8wt9av` 
- Firebase Project: `ai-math-tutor-prod`

### Environment Variables
```bash
export PROJECT_ID=ai-math-tutor-prod
export REGION=asia-southeast1
```

## Deployment Architecture

### Infrastructure Components
1. **Google Cloud Run**: Main application hosting
2. **Google Secret Manager**: Secure storage for API keys and certificates
3. **Google Artifact Registry**: Docker image storage
4. **Firebase Firestore**: User data and session storage
5. **Sanity CMS**: Curriculum content management
6. **Vertex AI**: AI tutoring responses

### Data Flow
```
Student Request → Cloud Run → {
  User Data: Firestore
  Curriculum: Sanity CMS  
  AI Responses: Vertex AI
} → Response
```

## Secret Management

The following secrets must be configured in Google Secret Manager:

### 1. Firebase Private Key
```bash
gcloud secrets create FIREBASE_PRIVATE_KEY --data-file=firebase-private-key.json
```

### 2. Sanity API Token
```bash
gcloud secrets create SANITY_API_TOKEN --data-file=<(echo "your_sanity_token")
```

### 3. Vertex AI Service Key
```bash
gcloud secrets create VERTEX_AI_SERVICE_KEY --data-file=vertex-ai-key.json
```

## Deployment Options

### Option 1: Automated Deployment (Recommended)
```bash
./deploy/deploy-with-sanity.sh
```

### Option 2: Manual Cloud Build
```bash
# Main deployment
gcloud builds submit --config=infra/cloudbuild.yaml

# Or simplified version with health checks
gcloud builds submit --config=infra/cloudbuild-simple.yaml

# Or direct deployment
gcloud builds submit --config=cloudbuild-direct.yaml
```

## Environment Configuration

### Production Environment Variables
The following environment variables are automatically configured during deployment:

#### Application Settings
- `NODE_ENV=production`
- `NEXT_PUBLIC_ENV=production`
- `GOOGLE_CLOUD_PROJECT=ai-math-tutor-prod`
- `GOOGLE_CLOUD_REGION=asia-southeast1`

#### Firebase Configuration
- `FIREBASE_PROJECT_ID=ai-math-tutor-prod`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID=ai-math-tutor-prod`
- `FIREBASE_CLIENT_EMAIL=firebase-admin@ai-math-tutor-prod.iam.gserviceaccount.com`
- Firebase private key loaded from Secret Manager

#### Sanity CMS Configuration
- `SANITY_PROJECT_ID=nq8wt9av`
- `SANITY_DATASET=production`
- Sanity API token loaded from Secret Manager

## Build Configurations

### 1. Main Build (`infra/cloudbuild.yaml`)
- Full production build with substitution variables
- Configurable via Cloud Build triggers
- Uses gcr.io container registry

### 2. Simple Build (`infra/cloudbuild-simple.yaml`)
- Direct deployment with hardcoded values
- Includes health checks
- Uses Artifact Registry
- Recommended for manual deployments

### 3. Direct Build (`cloudbuild-direct.yaml`)
- Legacy configuration
- Uses fixed image tags
- For emergency deployments

## Deployment Process

### 1. Pre-deployment Checklist
- [ ] All secrets exist in Secret Manager
- [ ] Sanity CMS has curriculum data migrated
- [ ] Firebase rules are deployed
- [ ] Docker build context is clean

### 2. Deployment Steps
1. **Build Phase**: Docker image creation
2. **Push Phase**: Image push to registry
3. **Deploy Phase**: Cloud Run service update
4. **Health Check**: Service validation

### 3. Post-deployment Verification
```bash
# Get service URL
SERVICE_URL=$(gcloud run services describe tutorai-web --region=asia-southeast1 --format='value(status.url)')

# Health check
curl $SERVICE_URL/api/health

# Curriculum API test
curl "$SERVICE_URL/api/curriculum/topics?grade=primary-6&subject=mathematics"

# Individual subtopic test
curl -X POST $SERVICE_URL/api/curriculum/subtopic \
  -H "Content-Type: application/json" \
  -d '{"topicId": "basic-operations", "subtopicId": "whole-numbers-addition"}'
```

## Monitoring and Maintenance

### Application Logs
```bash
# View recent logs
gcloud logs read --service=tutorai-web --limit=50

# Follow logs in real-time
gcloud logs tail --service=tutorai-web
```

### Service Management
```bash
# View service details
gcloud run services describe tutorai-web --region=asia-southeast1

# Update service configuration
gcloud run services update tutorai-web --region=asia-southeast1 --cpu=2 --memory=4Gi
```

### Sanity CMS Management
- **Studio URL**: https://nq8wt9av.sanity.studio/
- **Content Management**: Add/edit curriculum via Studio
- **Data Migration**: Run `pnpm migrate-curriculum` for bulk updates

## Troubleshooting

### Common Issues

#### 1. Secret Access Denied
```bash
# Grant Cloud Run access to secrets
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:$PROJECT_NUMBER-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

#### 2. Sanity Connection Failed
- Verify `SANITY_API_TOKEN` in Secret Manager
- Check token permissions (needs read/write access)
- Confirm project ID: `nq8wt9av`

#### 3. Firebase Auth Issues
- Verify `FIREBASE_PRIVATE_KEY` format
- Check service account permissions
- Confirm project ID matches configuration

#### 4. Build Timeouts
- Increase timeout in cloudbuild.yaml: `timeout: 1800s`
- Use faster machine type: `machineType: 'E2_HIGHCPU_32'`

### Rollback Procedure
```bash
# List previous revisions
gcloud run revisions list --service=tutorai-web --region=asia-southeast1

# Rollback to specific revision
gcloud run services update-traffic tutorai-web --region=asia-southeast1 \
  --to-revisions=REVISION_NAME=100
```

## Performance Configuration

### Cloud Run Settings
- **CPU**: 2 cores (4 for high traffic)
- **Memory**: 4Gi (8Gi for high traffic)
- **Concurrency**: 100 requests per instance
- **Min Instances**: 0 (1 for faster cold starts)
- **Max Instances**: 10 (adjust based on usage)

### Optimization Tips
1. **Enable HTTP/2**: Automatically enabled on Cloud Run
2. **Use CDN**: Configure Cloud Load Balancer with CDN
3. **Database Indexes**: Ensure Firestore indexes are optimized
4. **Sanity Caching**: Configure appropriate cache headers

## Security Considerations

### Access Control
- Cloud Run service allows unauthenticated requests (required for web app)
- Application-level authentication via Firebase Auth
- Firestore rules enforce data access restrictions
- Sanity API tokens have minimal required permissions

### Data Protection
- All secrets stored in Google Secret Manager
- HTTPS enforced on all endpoints
- Firebase security rules prevent unauthorized access
- Sanity dataset configured for production use

## Scaling Strategy

### Horizontal Scaling
Cloud Run automatically scales based on:
- Request volume
- CPU utilization
- Memory usage
- Custom metrics (if configured)

### Database Scaling
- **Firestore**: Automatically scales, monitor document reads/writes
- **Sanity**: CDN-cached globally, minimal scaling concerns

### Cost Optimization
- Use minimum instances = 0 for cost savings
- Monitor Cloud Run costs via billing dashboard
- Consider reserved capacity for predictable traffic

---

## Quick Reference

### Deployment Command
```bash
export PROJECT_ID=ai-math-tutor-prod REGION=asia-southeast1
./deploy/deploy-with-sanity.sh
```

### Emergency Rollback
```bash
gcloud run services update-traffic tutorai-web --region=asia-southeast1 --to-latest
```

### View Logs
```bash
gcloud logs tail --service=tutorai-web
```

### Access URLs
- **Production App**: https://tutorai-web-[hash].asia-southeast1.run.app
- **Sanity Studio**: https://nq8wt9av.sanity.studio/
- **Health Check**: https://[app-url]/api/health