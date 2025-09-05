# AI Socratic Math Tutor - Infrastructure

This repository contains the complete infrastructure configuration for the AI Socratic Math Tutoring platform, designed for Primary 6 students in Singapore.

## 🚀 Quick Start

### Prerequisites

- Google Cloud SDK (`gcloud`)
- Terraform (optional, for IaC)
- Firebase CLI (`npm install -g firebase-tools`)
- Node.js 20+
- Docker (for local development)

### 1. Initial Setup

```bash
# Clone and navigate to the project
cd tutorai

# Make setup script executable (if not already)
chmod +x deploy/setup-gcp.sh

# Set required environment variables
export PROJECT_ID="ai-math-tutor-prod"
export BILLING_ACCOUNT_ID="your-billing-account-id"
export REGION="asia-southeast1"

# Run the automated setup
./deploy/setup-gcp.sh
```

### 2. Manual Configuration

After running the setup script:

1. **Update Firebase Configuration**: Copy values from Firebase Console to `.env.local`
2. **Configure Domain**: Update `domain_name` in `terraform/variables.tf`
3. **Set Billing**: Ensure billing account is linked to the project

### 3. Deploy Infrastructure

```bash
# Using Terraform (recommended)
cd terraform
terraform init
terraform plan
terraform apply

# Or deploy manually using the generated deploy.sh script
./deploy.sh
```

## 📁 Project Structure

```
tutorai/
├── infra_plan.md              # Comprehensive infrastructure documentation
├── README.md                  # This file
├── deploy/
│   ├── setup-gcp.sh          # Automated GCP setup script
│   └── monitoring-setup.yaml # Monitoring and alerting configuration
├── terraform/
│   ├── main.tf               # Main Terraform configuration
│   ├── variables.tf          # Terraform variables
│   └── outputs.tf            # Terraform outputs
└── config/
    ├── .env.example          # Environment variables template
    ├── firebase.json         # Firebase configuration
    ├── firestore.rules       # Firestore security rules
    └── storage.rules         # Cloud Storage security rules
```

## 🏗️ Architecture Overview

The platform uses a modern, cloud-native architecture on Google Cloud Platform:

- **Frontend**: Next.js 14+ with React and Tailwind CSS
- **Hosting**: Cloud Run with automatic scaling
- **Database**: Firestore for real-time data
- **AI/ML**: Vertex AI with Gemini Pro models
- **Authentication**: Firebase Auth
- **Storage**: Cloud Storage for assets and backups
- **Monitoring**: Cloud Logging, Monitoring, and Error Reporting

## 💰 Cost Estimation

### MVP Phase (500 students, 6 months)
- **Total Monthly Cost**: ~$450
- **Per Student Cost**: ~$0.90/month
- **Scaling**: Costs decrease per student as usage scales

### Key Cost Components
- Compute (Cloud Run): $352/month
- AI Services (Vertex AI): $18/month
- Database (Firestore): $26/month
- Storage & CDN: $28/month
- Other services: $25/month

## 🔒 Security & Compliance

### PDPA Compliance
- Data minimization and purpose limitation
- Encryption at rest and in transit
- Right to erasure and data portability
- Consent management system
- Audit logging for all data access

### Security Features
- Role-based access control (RBAC)
- Web Application Firewall (Cloud Armor)
- DDoS protection and rate limiting
- Automated security scanning
- PII redaction in logs

## 📊 Monitoring & Alerting

### Key Metrics Tracked
- Response time (target: <1s for 95% of requests)
- Error rate (target: <0.1%)
- Availability (target: 99.9% uptime)
- Resource utilization (CPU, memory, disk)
- Business metrics (active users, session duration)

### Alerting
- High error rate alerts
- Performance degradation notifications
- Security incident alerts
- Cost threshold warnings

## 🔄 CI/CD Pipeline

### Automated Deployment
- GitHub Actions for continuous integration
- Automated testing (unit, integration, E2E)
- Blue/green deployments with Cloud Run
- Rollback capabilities for failed deployments

### Environment Management
- **Development**: Feature testing and integration
- **Staging**: Production-like environment for final testing
- **Production**: Live environment with full monitoring

## 📈 Scaling Strategy

### Auto-Scaling Configuration
- **Cloud Run**: 1-50 instances based on traffic
- **Database**: Automatic Firestore scaling
- **AI Services**: Vertex AI handles model scaling
- **Storage**: Unlimited with lifecycle management

### Performance Targets
- Sub-1-second response times for 95% of requests
- Support for 1,000+ concurrent students
- 99.9% uptime SLA
- Linear cost scaling with user growth

## 🛠️ Development Workflow

### Local Development
```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your configuration

# Start development server
npm run dev

# Run tests
npm test
npm run test:e2e
```

### Deployment Commands
```bash
# Deploy to staging
./deploy.sh staging

# Deploy to production (requires approval)
./deploy.sh production

# Monitor deployment
gcloud run services describe ai-tutor-app --region=asia-southeast1
```

## 📚 Documentation

- **[Infrastructure Plan](infra_plan.md)**: Comprehensive architecture and deployment guide
- **[AI Team Prompts](ai_team_prompts.md)**: AI agent templates for development
- **[Requirements Document](AI_tutor_requirements.md)**: Detailed product requirements

## 🐛 Troubleshooting

### Common Issues

**1. Authentication Errors**
```bash
# Re-authenticate with Google Cloud
gcloud auth login
gcloud auth application-default login
```

**2. Permission Denied**
```bash
# Check IAM permissions
gcloud projects get-iam-policy $PROJECT_ID
```

**3. Firestore Connection Issues**
```bash
# Verify Firestore is enabled
gcloud firestore databases describe --region=$REGION
```

**4. Cloud Run Deployment Failures**
```bash
# Check build logs
gcloud builds log [BUILD_ID]

# Check service logs
gcloud logs read --service=ai-tutor-app --limit=50
```

## 🤝 Contributing

1. Create feature branch from `main`
2. Make changes and test locally
3. Submit pull request with description
4. Automated tests must pass
5. Manual review and approval required

## 📞 Support

For infrastructure issues:
- Check logs in Cloud Console
- Review monitoring dashboards
- Escalate to on-call engineer if critical

For development questions:
- See troubleshooting guide above
- Check existing GitHub issues
- Contact development team lead

## 📄 License

This infrastructure configuration is proprietary and confidential. All rights reserved.