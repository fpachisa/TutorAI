# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

TutorAI is an AI-powered Socratic Math Tutor platform designed for Primary 6 students in Singapore. It's a production-ready Next.js application deployed on Google Cloud Platform with Firebase integration.

## Architecture

This is a pnpm workspace monorepo with the main web application in `apps/web/`:
- **Frontend**: Next.js 14+ with React 18, TypeScript, and Tailwind CSS
- **Authentication**: Firebase Auth with AuthContext provider
- **Database**: Firestore with strict security rules
- **AI/ML**: Vertex AI integration for tutoring responses
- **Deployment**: Google Cloud Run with Cloud Build
- **Package Manager**: pnpm (required - workspace configuration depends on it)

## Essential Commands

Run all commands from the repository root unless otherwise specified:

```bash
# Development
pnpm dev                    # Start development server
pnpm build                  # Build production bundle
pnpm start                  # Start production server
pnpm lint                   # Run ESLint
pnpm lint:fix              # Fix ESLint issues automatically
pnpm type-check            # Run TypeScript compiler check
pnpm test                   # Run Jest tests
pnpm test:watch            # Run tests in watch mode

# Infrastructure
./deploy/setup-gcp.sh      # Initial GCP setup (requires env vars)
gcloud builds submit       # Deploy via Cloud Build
firebase deploy           # Deploy Firebase rules/functions
```

## Environment Variables

Production deployment requires these environment variables:
- `PROJECT_ID=ai-math-tutor-prod`
- `REGION=asia-southeast1`
- `BILLING_ACCOUNT_ID` (for initial setup)

## Key Application Structure

### Core Tutoring System
- `lib/api.ts`: Main TutorAPI class and type definitions
- `/api/tutor/turn`: Primary API endpoint for student-tutor interactions
- Topic-based learning with mastery scoring and checkpoints

### Authentication Flow
- `contexts/AuthContext.tsx`: Global auth state management
- `lib/auth.ts`: Firebase auth utilities
- `components/AuthGate.tsx`: Route protection
- Auth pages: `/auth/signin`, `/auth/signup`

### Database Security
Firebase Firestore rules (`firebase/firestore.rules`) enforce strict access control:
- Students can only access their own data
- Parents can view children's reports and sessions
- System data (curriculum, progress) is read-only for users
- All mutations require proper authentication and ownership validation

### UI Components
Key reusable components in `components/`:
- `ChatWindow.tsx`: Main tutoring interface
- `CheckpointCard.tsx`: Quiz/assessment UI
- `SessionSummary.tsx`: Progress visualization
- `MessageBubble.tsx`: Conversation display

## Development Patterns

### API Integration
The `TutorAPI` class in `lib/api.ts` provides:
- Mock responses for development mode
- Typed interfaces for all tutoring interactions
- Intent-based conversation flow (`ask_probe`, `give_hint`, `checkpoint`, etc.)
- Built-in error handling and loading states

### Testing Strategy
Tests are located in `apps/web/tests/`:
- Unit tests: `lib/` components
- Integration tests: `api/` endpoints
- Test transcripts: Real conversation flows in JSON format

### Deployment Process
The project uses multiple Dockerfiles and Cloud Build configurations:
- `production.Dockerfile`: Main production build
- `cloudbuild.yaml`: Full CI/CD pipeline
- Various simplified build configs for different deployment scenarios

## Firebase Configuration

Critical Firebase files:
- `firebase.json`: Project configuration
- `firestore.rules`: Database security rules
- `storage.rules`: File storage permissions

## Performance Considerations

- Next.js configured with `output: 'standalone'` for Cloud Run optimization
- Image optimization enabled
- TypeScript strict mode with proper path mapping (`@/*`)
- Component-level error boundaries for graceful failures

## Security Notes

- All API endpoints require Firebase Auth tokens
- Firestore rules prevent unauthorized data access
- PII redaction implemented in logging
- PDPA compliance features built-in for Singapore market
- No sensitive data should ever be committed to the repository

## AI/ML Integration

The tutoring engine uses Vertex AI (Google Cloud's ML platform):
- Gemini Pro models for conversation generation
- Intent classification for appropriate responses
- Mastery scoring based on student interactions
- Safety filters and content moderation built-in