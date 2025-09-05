# TutorAI Web Application

A production-ready AI Socratic Math Tutoring skeleton application built with Next.js, Firebase, and Google Cloud Platform.

## 🚀 Features

### ✅ Core Infrastructure
- **Next.js 14** with App Router and TypeScript
- **Tailwind CSS** for responsive design
- **Firebase Authentication** (Email/Password + Google OAuth)
- **Firestore** real-time database integration
- **Cloud Run** deployment ready
- **Error boundaries** and comprehensive logging

### ✅ Authentication System
- Secure user registration and login
- Google OAuth integration  
- Protected routes with AuthGate component
- JWT token management
- Session persistence across browser refreshes

### ✅ Demo Features
- Interactive dashboard with real-time data
- Notes demo with CRUD operations
- Environment badges showing build info
- Health check endpoints (`/api/ping`, `/api/health`)
- Responsive mobile-first design

### ✅ Production Ready
- Docker containerization
- Cloud Build CI/CD pipeline
- Security headers and CSP
- Error tracking and monitoring
- PDPA compliant data handling

## 🏗️ Architecture

```
apps/web/                 # Next.js application
├── app/                  # App Router pages
│   ├── page.tsx         # Landing page  
│   ├── dashboard/       # Protected dashboard
│   ├── auth/            # Authentication pages
│   └── api/             # API endpoints
├── components/          # Reusable UI components
├── contexts/           # React contexts (Auth)
├── lib/                # Utility functions
│   ├── firebaseClient.ts # Firebase web SDK
│   ├── firebaseAdmin.ts  # Firebase admin SDK
│   └── auth.ts          # Authentication utilities
└── styles/             # Global CSS and Tailwind
```

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Node.js 20
- **Database**: Firestore (NoSQL)
- **Authentication**: Firebase Auth
- **Hosting**: Google Cloud Run
- **CI/CD**: Cloud Build
- **Monitoring**: Cloud Logging, Error Reporting

## ⚡ Quick Start

### Prerequisites
- Node.js 20+
- pnpm 8+
- Firebase project
- Google Cloud project

### Local Development

1. **Clone and setup**:
```bash
cd tutorai
pnpm install
```

2. **Configure environment**:
```bash
cp .env.sample .env.local
# Edit .env.local with your Firebase config
```

3. **Start development server**:
```bash
pnpm dev
# Visit http://localhost:3000
```

### Environment Variables

Required in `.env.local`:
```bash
# Firebase Web SDK
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com  
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_ENV=development

# Firebase Admin SDK (server-side)
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@your_project.iam.gserviceaccount.com
FIREBASE_PROJECT_ID=your_project_id
```

## 🧪 Testing the Application

### 1. Landing Page
- Visit `/` to see the homepage with environment badge
- Shows build SHA, environment, and feature overview
- Links to sign in/sign up pages

### 2. Authentication Flow  
- Visit `/auth/signup` to create an account
- Try both email/password and Google OAuth
- Automatic redirect to dashboard after successful login

### 3. Dashboard Demo
- Protected route requiring authentication
- Real-time Firestore integration
- Add/view demo notes to test database operations
- Environment information and user details

### 4. Health Checks
- `GET /api/health` - Basic service health
- `GET /api/ping` - Full Firestore connectivity test
- Both return JSON with service status

## 🚀 Deployment

### Cloud Run Deployment

1. **Build and deploy**:
```bash
# Using the setup script from infrastructure
./deploy/setup-gcp.sh

# Or manually with Cloud Build
gcloud builds submit --config infra/cloudbuild.yaml
```

2. **Environment Configuration**:
Store sensitive variables in Secret Manager:
```bash
# Store Firebase private key
gcloud secrets create firebase-private-key --data-file=path/to/private-key.json

# Update Cloud Run service with secrets
gcloud run services update tutorai-web \
  --region=asia-southeast1 \
  --set-secrets=FIREBASE_PRIVATE_KEY=firebase-private-key:latest
```

### CI/CD Pipeline

Automated deployment triggers:
- **Push to `main`** → Deploy to staging environment  
- **Tag `v*`** → Deploy to production environment

Pipeline includes:
- Dependency installation
- Linting and type checking
- Docker image build
- Cloud Run deployment
- Health check validation

## 🔒 Security Features

### Authentication & Authorization
- Firebase Auth with secure JWT tokens
- Role-based Firestore security rules
- Protected API routes with token validation
- Automatic token refresh handling

### Security Headers
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff  
- Referrer-Policy: strict-origin-when-cross-origin
- X-XSS-Protection: 1; mode=block

### Data Protection
- PDPA compliant data handling
- User data isolation with security rules
- No sensitive data in client-side code
- Proper error logging without PII exposure

## 📊 Monitoring & Observability

### Health Checks
- `/api/health` - Basic service status
- `/api/ping` - Database connectivity test
- Built-in Docker health checks
- Cloud Run readiness probes

### Error Tracking
- React Error Boundaries for client errors
- Server-side error logging to Cloud Logging
- Error IDs for tracking and debugging
- Development vs production error handling

### Performance Metrics
- Response time tracking
- Firestore operation latency
- Build time and deployment metrics
- User session analytics ready

## 🔧 Development

### Available Commands
```bash
pnpm dev          # Start development server
pnpm build        # Build for production  
pnpm start        # Start production server
pnpm lint         # Run ESLint
pnpm lint:fix     # Fix ESLint issues
pnpm type-check   # TypeScript type checking
```

### Code Structure
- **Components**: Reusable UI components with TypeScript
- **Contexts**: React contexts for global state (Auth)
- **Lib**: Utility functions and Firebase configuration
- **API Routes**: Server-side endpoints for health checks
- **Styles**: Global CSS with Tailwind utility classes

### Adding New Features
1. Create components in `/components`
2. Add pages in `/app` directory 
3. Use `useAuth()` hook for authentication state
4. Follow existing patterns for Firestore operations
5. Add appropriate TypeScript types

## 📱 User Interface

### Design System
- **Mobile-first responsive design**
- **Tailwind CSS utility classes**
- **Consistent color palette** (primary, success, warning, error)
- **Accessible form inputs** with proper labels
- **Loading states** for better UX
- **Error messaging** with user-friendly text

### Key Components
- `AuthGate` - Route protection
- `EnvironmentBadge` - Build information display
- `LoadingSpinner` - Loading states  
- `ErrorBoundary` - Error handling
- `SignInForm` / `SignUpForm` - Authentication flows

## 🔄 Data Flow

### Authentication
1. User signs in via Firebase Auth
2. Auth state managed by React Context
3. JWT tokens automatically handled
4. Protected routes check auth status
5. Firestore rules validate user access

### Firestore Operations
1. Client-side SDK for real-time updates
2. Server-side Admin SDK for privileged operations
3. Security rules enforce data isolation
4. Composite indexes for query performance

## 🚢 Production Checklist

### Before Going Live
- [ ] Update Firebase Auth domain whitelist
- [ ] Configure custom domain for Cloud Run
- [ ] Set up SSL certificates
- [ ] Configure monitoring alerts
- [ ] Test backup/restore procedures
- [ ] Review security rules
- [ ] Performance testing under load
- [ ] Update CORS settings if needed

### Post-Deployment
- [ ] Monitor error rates
- [ ] Check health endpoint status  
- [ ] Verify authentication flows
- [ ] Test Firestore operations
- [ ] Monitor response times
- [ ] Review access logs

## 🤝 Extending the Application

This skeleton provides a solid foundation for building the full TutorAI platform:

### Next Steps for AI/ML Agent
- Mount Socratic tutoring engine under `/app/tutor` 
- Integrate with Vertex AI for conversation handling
- Add session management for learning progress
- Store conversation history in Firestore

### Future Enhancements
- Parent dashboard with progress tracking
- Real-time chat with WebSocket support  
- File upload for math problems
- Progress analytics and reporting
- Push notifications
- Offline support with PWA

## 📞 Support

For development issues:
- Check browser console for client-side errors
- Review Cloud Logging for server-side errors  
- Test health endpoints for service status
- Verify Firebase configuration
- Check Firestore security rules

For deployment issues:
- Review Cloud Build logs
- Check Cloud Run service status
- Verify Secret Manager configuration
- Test environment variable setup

## 📄 License

This project is proprietary and confidential. All rights reserved.