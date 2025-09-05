#!/bin/bash

# AI Math Tutor - GCP Setup Script
# This script sets up the Google Cloud environment for the AI tutoring platform

set -e  # Exit on any error

# Configuration
PROJECT_ID="${PROJECT_ID:-ai-tutor-prod}"
REGION="${REGION:-asia-southeast1}"
ZONE="${ZONE:-asia-southeast1-a}"
BILLING_ACCOUNT_ID="${BILLING_ACCOUNT_ID}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if gcloud is installed
check_dependencies() {
    log_info "Checking dependencies..."
    
    if ! command -v gcloud &> /dev/null; then
        log_error "gcloud CLI is not installed. Please install it first."
        exit 1
    fi
    
    if ! command -v terraform &> /dev/null; then
        log_warning "Terraform is not installed. Infrastructure deployment will be manual."
    fi
    
    if ! command -v firebase &> /dev/null; then
        log_warning "Firebase CLI is not installed. Install with: npm install -g firebase-tools"
    fi
    
    log_success "Dependencies checked"
}

# Authenticate with Google Cloud
authenticate() {
    log_info "Authenticating with Google Cloud..."
    
    if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q "@"; then
        log_info "No active authentication found. Please authenticate..."
        gcloud auth login
    fi
    
    log_success "Authentication verified"
}

# Create or select project
setup_project() {
    log_info "Setting up project: $PROJECT_ID"
    
    # Check if project exists
    if gcloud projects describe $PROJECT_ID &>/dev/null; then
        log_info "Project $PROJECT_ID already exists"
    else
        log_info "Creating project $PROJECT_ID..."
        gcloud projects create $PROJECT_ID --name="AI Math Tutor"
        
        if [ -n "$BILLING_ACCOUNT_ID" ]; then
            log_info "Linking billing account..."
            gcloud billing projects link $PROJECT_ID --billing-account=$BILLING_ACCOUNT_ID
        else
            log_warning "No billing account ID provided. Please link billing manually:"
            log_warning "gcloud billing projects link $PROJECT_ID --billing-account=BILLING_ACCOUNT_ID"
        fi
    fi
    
    # Set current project
    gcloud config set project $PROJECT_ID
    gcloud config set compute/region $REGION
    gcloud config set compute/zone $ZONE
    
    log_success "Project setup complete"
}

# Enable required APIs
enable_apis() {
    log_info "Enabling required Google Cloud APIs..."
    
    local apis=(
        "cloudbuild.googleapis.com"
        "run.googleapis.com"
        "firestore.googleapis.com"
        "firebase.googleapis.com"
        "aiplatform.googleapis.com"
        "cloudfunctions.googleapis.com"
        "storage-component.googleapis.com"
        "cloudresourcemanager.googleapis.com"
        "iam.googleapis.com"
        "logging.googleapis.com"
        "monitoring.googleapis.com"
        "compute.googleapis.com"
        "artifactregistry.googleapis.com"
    )
    
    for api in "${apis[@]}"; do
        log_info "Enabling $api..."
        gcloud services enable $api
    done
    
    log_success "All APIs enabled"
}

# Create service accounts
create_service_accounts() {
    log_info "Creating service accounts..."
    
    # Cloud Run service account
    local cloudrun_sa="ai-tutor-cloudrun"
    if ! gcloud iam service-accounts describe "${cloudrun_sa}@${PROJECT_ID}.iam.gserviceaccount.com" &>/dev/null; then
        gcloud iam service-accounts create $cloudrun_sa \
            --display-name="AI Tutor Cloud Run Service Account" \
            --description="Service account for the AI Tutor Cloud Run application"
        
        # Grant necessary permissions
        gcloud projects add-iam-policy-binding $PROJECT_ID \
            --member="serviceAccount:${cloudrun_sa}@${PROJECT_ID}.iam.gserviceaccount.com" \
            --role="roles/datastore.user"
        
        gcloud projects add-iam-policy-binding $PROJECT_ID \
            --member="serviceAccount:${cloudrun_sa}@${PROJECT_ID}.iam.gserviceaccount.com" \
            --role="roles/storage.objectViewer"
        
        gcloud projects add-iam-policy-binding $PROJECT_ID \
            --member="serviceAccount:${cloudrun_sa}@${PROJECT_ID}.iam.gserviceaccount.com" \
            --role="roles/aiplatform.user"
    fi
    
    # Cloud Functions service account
    local functions_sa="ai-tutor-functions"
    if ! gcloud iam service-accounts describe "${functions_sa}@${PROJECT_ID}.iam.gserviceaccount.com" &>/dev/null; then
        gcloud iam service-accounts create $functions_sa \
            --display-name="AI Tutor Cloud Functions Service Account" \
            --description="Service account for AI Tutor Cloud Functions"
        
        # Grant necessary permissions
        gcloud projects add-iam-policy-binding $PROJECT_ID \
            --member="serviceAccount:${functions_sa}@${PROJECT_ID}.iam.gserviceaccount.com" \
            --role="roles/datastore.user"
        
        gcloud projects add-iam-policy-binding $PROJECT_ID \
            --member="serviceAccount:${functions_sa}@${PROJECT_ID}.iam.gserviceaccount.com" \
            --role="roles/aiplatform.user"
    fi
    
    log_success "Service accounts created"
}

# Set up Firestore
setup_firestore() {
    log_info "Setting up Firestore database..."
    
    # Create Firestore database
    if ! gcloud firestore databases describe --region=$REGION &>/dev/null; then
        gcloud firestore databases create --region=$REGION
    else
        log_info "Firestore database already exists"
    fi
    
    log_success "Firestore setup complete"
}

# Create storage buckets
create_storage_buckets() {
    log_info "Creating Cloud Storage buckets..."
    
    local buckets=(
        "${PROJECT_ID}-assets"
        "${PROJECT_ID}-backups"
        "${PROJECT_ID}-functions-source"
        "${PROJECT_ID}-terraform-state"
    )
    
    for bucket in "${buckets[@]}"; do
        if ! gsutil ls -b gs://$bucket &>/dev/null; then
            log_info "Creating bucket: gs://$bucket"
            gsutil mb -l $REGION gs://$bucket
            
            # Set lifecycle policy for backups bucket
            if [[ $bucket == *"-backups" ]]; then
                cat > lifecycle.json << EOF
{
  "rule": [
    {
      "action": {"type": "Delete"},
      "condition": {"age": 90}
    }
  ]
}
EOF
                gsutil lifecycle set lifecycle.json gs://$bucket
                rm lifecycle.json
            fi
        else
            log_info "Bucket gs://$bucket already exists"
        fi
    done
    
    log_success "Storage buckets created"
}

# Set up Firebase
setup_firebase() {
    log_info "Setting up Firebase..."
    
    if command -v firebase &> /dev/null; then
        log_info "Initializing Firebase project..."
        # Create .firebaserc file
        cat > .firebaserc << EOF
{
  "projects": {
    "default": "$PROJECT_ID"
  }
}
EOF
        
        # Create firebase.json configuration
        cat > firebase.json << EOF
{
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  },
  "storage": {
    "rules": "storage.rules"
  },
  "hosting": {
    "public": "out",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ]
  }
}
EOF
        
        # Create default Firestore rules
        cat > firestore.rules << 'EOF'
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Students can only access their own data
    match /students/{studentId} {
      allow read, write: if request.auth != null && request.auth.uid == studentId;
    }
    
    // Parents can access their children's data
    match /parents/{parentId} {
      allow read, write: if request.auth != null && request.auth.uid == parentId;
    }
    
    // Session data accessible to authenticated users (for their own sessions)
    match /sessions/{sessionId} {
      allow read, write: if request.auth != null;
    }
    
    // Curriculum data is read-only for authenticated users
    match /curriculum/{topicId} {
      allow read: if request.auth != null;
    }
  }
}
EOF
        
        # Create default Storage rules
        cat > storage.rules << 'EOF'
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == resource.metadata.userId;
    }
  }
}
EOF
        
        # Create empty indexes file
        echo '{"indexes": [], "fieldOverrides": []}' > firestore.indexes.json
        
        log_success "Firebase configuration created"
    else
        log_warning "Firebase CLI not found. Skipping Firebase setup."
    fi
}

# Create environment files
create_env_files() {
    log_info "Creating environment configuration files..."
    
    # Create .env.example
    cat > .env.example << EOF
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=${PROJECT_ID}.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=${PROJECT_ID}
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=${PROJECT_ID}.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id_here
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id_here

# Google Cloud Configuration
PROJECT_ID=${PROJECT_ID}
GOOGLE_CLOUD_PROJECT=${PROJECT_ID}
GCLOUD_PROJECT=${PROJECT_ID}
VERTEX_AI_REGION=${REGION}

# Application Configuration
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
PORT=3000

# AI Configuration
GEMINI_PRO_MODEL=gemini-pro
EMBEDDING_MODEL=text-embedding-004

# Security
JWT_SECRET=your_jwt_secret_here
ENCRYPTION_KEY=your_encryption_key_here
EOF
    
    log_success "Environment files created"
}

# Create deployment script
create_deployment_script() {
    log_info "Creating deployment script..."
    
    cat > deploy.sh << 'EOF'
#!/bin/bash

# AI Math Tutor Deployment Script
set -e

PROJECT_ID="${PROJECT_ID:-ai-math-tutor-prod}"
REGION="${REGION:-asia-southeast1}"
SERVICE_NAME="ai-tutor-app"

echo "Deploying AI Math Tutor to $PROJECT_ID..."

# Build and deploy to Cloud Run
gcloud builds submit --tag gcr.io/$PROJECT_ID/$SERVICE_NAME:latest

gcloud run deploy $SERVICE_NAME \
    --image gcr.io/$PROJECT_ID/$SERVICE_NAME:latest \
    --region $REGION \
    --platform managed \
    --allow-unauthenticated \
    --service-account ai-tutor-cloudrun@$PROJECT_ID.iam.gserviceaccount.com \
    --set-env-vars PROJECT_ID=$PROJECT_ID \
    --set-env-vars NODE_ENV=production \
    --set-env-vars VERTEX_AI_REGION=$REGION \
    --min-instances 1 \
    --max-instances 50 \
    --cpu 2 \
    --memory 4Gi \
    --concurrency 100

echo "Deployment complete!"
echo "Service URL: $(gcloud run services describe $SERVICE_NAME --region $REGION --format='value(status.url)')"
EOF
    
    chmod +x deploy.sh
    
    log_success "Deployment script created"
}

# Main execution
main() {
    log_info "Starting AI Math Tutor GCP setup..."
    
    check_dependencies
    authenticate
    setup_project
    enable_apis
    create_service_accounts
    setup_firestore
    create_storage_buckets
    setup_firebase
    create_env_files
    create_deployment_script
    
    log_success "GCP setup complete!"
    log_info "Next steps:"
    log_info "1. Update .env.example with actual Firebase configuration values"
    log_info "2. Run terraform init && terraform plan && terraform apply"
    log_info "3. Deploy your application with ./deploy.sh"
    log_info "4. Set up monitoring and alerting"
}

# Check if script is being sourced or executed
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi