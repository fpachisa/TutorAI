#!/bin/bash

# TutorAI Static Code Analysis - QA Validation
# This script performs static analysis to identify potential issues

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
PASS_COUNT=0
FAIL_COUNT=0
WARN_COUNT=0

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_pass() {
    echo -e "${GREEN}[PASS]${NC} $1"
    ((PASS_COUNT++))
}

log_fail() {
    echo -e "${RED}[FAIL]${NC} $1"
    ((FAIL_COUNT++))
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
    ((WARN_COUNT++))
}

log_info "🔍 Starting TutorAI Static Code Analysis..."

# Check project structure
log_info "📁 Validating project structure..."

REQUIRED_FILES=(
    "package.json"
    "apps/web/package.json" 
    "apps/web/next.config.mjs"
    "apps/web/tailwind.config.ts"
    "apps/web/app/layout.tsx"
    "apps/web/app/page.tsx"
    "apps/web/app/api/ping/route.ts"
    "apps/web/app/api/health/route.ts"
    "apps/web/lib/firebaseClient.ts"
    "apps/web/lib/firebaseAdmin.ts"
    "apps/web/lib/auth.ts"
    "firebase/firestore.rules"
    "firebase/firestore.indexes.json"
    "infra/Dockerfile"
    "infra/cloudbuild.yaml"
    ".env.sample"
)

for file in "${REQUIRED_FILES[@]}"; do
    if [[ -f "$file" ]]; then
        log_pass "Required file exists: $file"
    else
        log_fail "Missing required file: $file"
    fi
done

# Check for environment variables
log_info "🔐 Checking environment configuration..."

if [[ -f ".env.sample" ]]; then
    REQUIRED_ENV_VARS=(
        "NEXT_PUBLIC_FIREBASE_API_KEY"
        "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN"
        "NEXT_PUBLIC_FIREBASE_PROJECT_ID"
        "FIREBASE_PRIVATE_KEY"
        "FIREBASE_CLIENT_EMAIL"
        "FIREBASE_PROJECT_ID"
    )
    
    for var in "${REQUIRED_ENV_VARS[@]}"; do
        if grep -q "$var" .env.sample; then
            log_pass "Environment variable documented: $var"
        else
            log_fail "Missing environment variable in .env.sample: $var"
        fi
    done
else
    log_fail "Missing .env.sample file"
fi

# Check for hardcoded secrets (security audit)
log_info "🔒 Scanning for hardcoded secrets..."

SECRET_PATTERNS=(
    "AIza[0-9A-Za-z\\-_]{35}"  # Firebase API key
    "-----BEGIN PRIVATE KEY-----"
    "firebase.*private.*key"
    "client_secret"
    "access_token"
)

SCAN_DIRECTORIES=("apps/web" "lib" "components" "contexts")
SECRET_FOUND=false

for dir in "${SCAN_DIRECTORIES[@]}"; do
    if [[ -d "$dir" ]]; then
        for pattern in "${SECRET_PATTERNS[@]}"; do
            if grep -r -E "$pattern" "$dir" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" 2>/dev/null; then
                log_fail "Potential hardcoded secret found in $dir (pattern: $pattern)"
                SECRET_FOUND=true
            fi
        done
    fi
done

if [[ "$SECRET_FOUND" == false ]]; then
    log_pass "No hardcoded secrets detected in source code"
fi

# Check TypeScript configuration
log_info "📝 Validating TypeScript configuration..."

if [[ -f "apps/web/tsconfig.json" ]]; then
    if grep -q '"strict": true' apps/web/tsconfig.json; then
        log_pass "TypeScript strict mode enabled"
    else
        log_warn "TypeScript strict mode not enabled"
    fi
    
    if grep -q '"noEmit": true' apps/web/tsconfig.json; then
        log_pass "TypeScript noEmit enabled for type checking"
    else
        log_warn "TypeScript noEmit not enabled"
    fi
else
    log_fail "Missing TypeScript configuration"
fi

# Check Next.js configuration
log_info "⚡ Validating Next.js configuration..."

if [[ -f "apps/web/next.config.mjs" ]]; then
    if grep -q 'serverComponentsExternalPackages.*firebase-admin' apps/web/next.config.mjs; then
        log_pass "Firebase Admin SDK properly externalized"
    else
        log_warn "Firebase Admin SDK externalization not found"
    fi
    
    if grep -q 'output.*standalone' apps/web/next.config.mjs; then
        log_pass "Next.js standalone output configured for Docker"
    else
        log_fail "Next.js standalone output not configured"
    fi
else
    log_fail "Missing Next.js configuration"
fi

# Check Firebase configuration
log_info "🔥 Validating Firebase configuration..."

if [[ -f "firebase/firestore.rules" ]]; then
    if grep -q 'rules_version.*2' firebase/firestore.rules; then
        log_pass "Firestore rules version 2 configured"
    else
        log_warn "Firestore rules version not set to 2"
    fi
    
    if grep -q 'request.auth != null' firebase/firestore.rules; then
        log_pass "Authentication checks found in Firestore rules"
    else
        log_fail "No authentication checks in Firestore rules"
    fi
    
    if grep -q 'allow read, write: if false' firebase/firestore.rules; then
        log_pass "Default deny rule found in Firestore rules"
    else
        log_fail "No default deny rule in Firestore rules"
    fi
else
    log_fail "Missing Firestore rules file"
fi

# Check Docker configuration
log_info "🐳 Validating Docker configuration..."

if [[ -f "infra/Dockerfile" ]]; then
    if grep -q 'node:20-alpine' infra/Dockerfile; then
        log_pass "Using Node.js 20 Alpine image"
    else
        log_warn "Not using recommended Node.js 20 Alpine image"
    fi
    
    if grep -q 'HEALTHCHECK' infra/Dockerfile; then
        log_pass "Docker health check configured"
    else
        log_warn "No Docker health check configured"
    fi
    
    if grep -q 'USER nextjs' infra/Dockerfile; then
        log_pass "Non-root user configured in Docker"
    else
        log_fail "Running as root user in Docker"
    fi
else
    log_fail "Missing Dockerfile"
fi

# Check for proper error handling
log_info "🚨 Checking error handling patterns..."

ERROR_PATTERNS=(
    "try.*catch"
    "\.catch\("
    "NextResponse\.json.*status.*[45][0-9][0-9]"
)

ERROR_FILES=(
    "apps/web/app/api/ping/route.ts"
    "apps/web/app/api/health/route.ts"
    "apps/web/lib/firebaseAdmin.ts"
    "apps/web/lib/auth.ts"
)

for file in "${ERROR_FILES[@]}"; do
    if [[ -f "$file" ]]; then
        ERROR_HANDLING_FOUND=false
        for pattern in "${ERROR_PATTERNS[@]}"; do
            if grep -q -E "$pattern" "$file"; then
                ERROR_HANDLING_FOUND=true
                break
            fi
        done
        
        if [[ "$ERROR_HANDLING_FOUND" == true ]]; then
            log_pass "Error handling found in $file"
        else
            log_warn "No error handling detected in $file"
        fi
    fi
done

# Check package.json scripts
log_info "📦 Validating package.json scripts..."

REQUIRED_SCRIPTS=("dev" "build" "start" "lint")

if [[ -f "apps/web/package.json" ]]; then
    for script in "${REQUIRED_SCRIPTS[@]}"; do
        if grep -q "\"$script\":" apps/web/package.json; then
            log_pass "Required script found: $script"
        else
            log_fail "Missing required script: $script"
        fi
    done
else
    log_fail "Missing apps/web/package.json"
fi

# Check for security headers
log_info "🛡️  Checking security configuration..."

if [[ -f "apps/web/next.config.mjs" ]]; then
    if grep -q 'X-Frame-Options' apps/web/next.config.mjs; then
        log_pass "X-Frame-Options header configured"
    else
        log_warn "X-Frame-Options header not configured"
    fi
    
    if grep -q 'X-Content-Type-Options' apps/web/next.config.mjs; then
        log_pass "X-Content-Type-Options header configured"
    else
        log_warn "X-Content-Type-Options header not configured"
    fi
fi

# Generate summary
log_info "📊 Analysis Summary:"
echo "✅ Passed: $PASS_COUNT"
echo "❌ Failed: $FAIL_COUNT"  
echo "⚠️  Warnings: $WARN_COUNT"

TOTAL=$((PASS_COUNT + FAIL_COUNT + WARN_COUNT))
if [[ $TOTAL -gt 0 ]]; then
    PASS_RATE=$(( (PASS_COUNT * 100) / TOTAL ))
    echo "📈 Pass Rate: ${PASS_RATE}%"
fi

# Exit with appropriate code
if [[ $FAIL_COUNT -eq 0 ]]; then
    log_info "✅ Static analysis completed successfully"
    exit 0
else
    log_info "❌ Static analysis found ${FAIL_COUNT} critical issues"
    exit 1
fi