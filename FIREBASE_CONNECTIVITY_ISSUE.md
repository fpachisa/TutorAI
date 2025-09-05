# Firebase Connectivity Issue - Production Debugging Report

**Date**: August 30, 2025  
**Status**: CRITICAL - Tutoring functionality completely broken in production  
**Priority**: HIGH - Blocks core application functionality  

## Problem Description

### User-Reported Error
When accessing tutoring subtopic pages in production, users encounter:
```
Failed to load resource: the server responded with a status of 500 ()
[TutorAPI] Turn request failed: Error: Failed to get session: Failed to get document because the client is offline.
```

### Impact
- ✅ **Static pages work**: Main page, curriculum API (Sanity CMS)
- ❌ **Tutoring sessions broken**: Cannot start or continue tutoring sessions
- ❌ **API endpoint `/api/tutor/turn` returns 500 errors**
- ❌ **Core product functionality non-operational**

## Technical Analysis

### Root Cause: Firebase Project Configuration Mismatch

The application suffers from **mixed Firebase project configuration**, causing client-server database access conflicts.

#### Current Problematic Configuration
```yaml
# In cloudbuild-direct.yaml - INCONSISTENT PROJECT REFERENCES
FIREBASE_PROJECT_ID=ai-math-tutor-prod                                    # Google Cloud project
NEXT_PUBLIC_FIREBASE_PROJECT_ID=ai-math-tutor-prod                        # Same as above
NEXT_PUBLIC_FIREBASE_API_KEY=YOUR_FIREBASE_API_KEY_HERE                       # Points to ai-tutor-live-firebase (example redacted)
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=ai-tutor-live-firebase.firebaseapp.com   # Different project!
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=ai-tutor-live-firebase.firebasestorage.app # Different project!
NEXT_PUBLIC_FIREBASE_APP_ID=1:779031795596:web:6f728c5fdbcfe983b968a9     # Points to ai-tutor-live-firebase
```

#### Architectural Problem
The SessionManager (`lib/tutor/sessionManager.ts`) **incorrectly uses client-side Firestore SDK in server-side API routes**:

```typescript
// WRONG: Client SDK used in server context
import { getFirestore, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import firebaseApp from '../firebaseClient';

const db = getFirestore(firebaseApp); // Client SDK in server environment!
```

This causes:
1. **Server-side code** tries to connect to Firestore using client SDK
2. **Client SDK** is designed for browser environments, not server
3. **Project mismatch** between client config and server config
4. **"Client is offline"** error when server tries to access Firestore

### Error Chain Analysis

1. **User accesses tutoring page** → Frontend calls `/api/tutor/turn`
2. **API route** (`app/api/tutor/turn/route.ts:70`) calls `SessionManager.getOrCreateSession()`
3. **SessionManager** (`lib/tutor/sessionManager.ts:17`) calls `getDoc(sessionRef)`
4. **Client SDK** fails in server context → "client is offline" error
5. **API returns 500** → Frontend shows error to user

## Firebase Projects Audit

### Project 1: `ai-math-tutor-prod` (Google Cloud Project)
- **Purpose**: Primary Google Cloud hosting project
- **Services**: Cloud Run, Secret Manager, Vertex AI
- **Firebase Status**: ❓ Unknown if properly configured with Firestore

### Project 2: `ai-tutor-live-firebase` (Dedicated Firebase Project)  
- **Purpose**: Authentication and database services
- **Configuration**: API keys and domains point here
- **Firebase Status**: ❓ Likely contains user data and Firestore collections

## Fix Strategy

### Phase 1: Project Audit & Decision (30 minutes)
1. **Audit `ai-tutor-live-firebase`**:
   - Check if Firestore database exists
   - Verify user authentication data
   - Check existing tutoring session collections
   
2. **Audit `ai-math-tutor-prod`**:
   - Check if Firebase is properly configured
   - Verify Firestore database status
   
3. **Decision**: Choose single Firebase project for both client and server

### Phase 2: Fix Server-Side Database Access (45 minutes)
**Critical Fix**: Replace client SDK with Admin SDK in SessionManager

#### Current (Broken):
```typescript
// lib/tutor/sessionManager.ts
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import firebaseApp from '../firebaseClient';
const db = getFirestore(firebaseApp);
```

#### Fixed:
```typescript
// lib/tutor/sessionManager.ts  
import { getAdminDb } from '../firebaseAdmin';
const db = getAdminDb();
// Use Admin SDK methods: doc(db, ...), getDoc(), etc.
```

#### Files to Modify:
1. **`lib/tutor/sessionManager.ts`**:
   - Replace all client SDK imports with Admin SDK
   - Update all Firestore operations
   - Change `firebaseClient` to `firebaseAdmin` import

### Phase 3: Align Environment Configuration (15 minutes)
**Fix deployment configuration** to use consistent Firebase project:

#### Option A: Use `ai-tutor-live-firebase` (Recommended)
```yaml
# Update cloudbuild-direct.yaml
FIREBASE_PROJECT_ID=ai-tutor-live-firebase
NEXT_PUBLIC_FIREBASE_PROJECT_ID=ai-tutor-live-firebase
# Keep existing API key, auth domain, etc. (already correct)
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@ai-tutor-live-firebase.iam.gserviceaccount.com
```

#### Option B: Use `ai-math-tutor-prod`
```yaml
# Update client-side config to match server
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=ai-math-tutor-prod.firebaseapp.com
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=ai-math-tutor-prod.appspot.com
# Update API key to match ai-math-tutor-prod project
```

### Phase 4: Update Service Account (10 minutes)
- Generate new Firebase Admin SDK key for chosen project
- Update `FIREBASE_PRIVATE_KEY` secret in Google Secret Manager
- Ensure service account has Firestore permissions

### Phase 5: Testing & Deployment (30 minutes)
1. **Local testing**: Verify SessionManager works with Admin SDK
2. **Deploy updated configuration**
3. **End-to-end test**: Create tutoring session in production
4. **Monitor logs**: Ensure no "client is offline" errors

## Files Requiring Changes

### Critical Files:
1. **`lib/tutor/sessionManager.ts`** - Replace client SDK with Admin SDK
2. **`cloudbuild-direct.yaml`** - Fix Firebase project configuration
3. **`infra/cloudbuild.yaml`** - Align environment variables  
4. **`infra/cloudbuild-simple.yaml`** - Consistent configuration

### Supporting Files:
- **Secret Manager**: Update `FIREBASE_PRIVATE_KEY` if needed
- **Firebase Console**: Verify chosen project has proper setup

## Risk Assessment

### High Risk Items:
- **Data Loss**: If switching projects, existing user sessions may be lost
- **Authentication**: Users may need to re-authenticate if project changes
- **Downtime**: Deployment will cause brief service interruption

### Mitigation:
- **Backup**: Export existing Firestore data before changes
- **Gradual Rollout**: Test with limited users first
- **Rollback Plan**: Keep current deployment accessible for quick revert

## Success Criteria

### Must Have:
- ✅ Tutoring sessions create successfully
- ✅ Session data persists in Firestore  
- ✅ No "client is offline" errors
- ✅ End-to-end tutoring flow works

### Nice to Have:
- ✅ Existing user data preserved
- ✅ No user re-authentication required
- ✅ Performance unchanged or improved

## Next Steps for Tomorrow

### Morning (First Hour):
1. **Project Audit**: Determine which Firebase project to use
2. **Fix SessionManager**: Replace client SDK with Admin SDK
3. **Local Testing**: Verify fixes work in development

### Afternoon (Second Hour):  
1. **Update Deployment Config**: Align all environment variables
2. **Deploy to Production**: Apply fixes with proper testing
3. **Validation**: Confirm tutoring functionality works end-to-end

---

## Technical Notes

### Why This Happened:
- **Development vs Production**: Code worked in development with emulators
- **Mixed Architecture**: Client SDK works in development, fails in production server context
- **Configuration Drift**: Multiple Firebase projects created confusion

### Long-term Prevention:
- **Consistent Architecture**: Use Admin SDK for all server-side database access
- **Single Firebase Project**: Avoid mixing multiple Firebase projects
- **Better Testing**: Production-like testing environment
- **Documentation**: Clear architecture decisions and project mappings

---

**Contact**: Available for implementation tomorrow  
**Estimated Fix Time**: 2-3 hours total  
**Confidence Level**: High - Root cause clearly identified with specific fix plan
