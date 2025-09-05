# Minimal fix based on runbook pattern
FROM node:20-alpine AS base

# Install dependencies stage
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
RUN corepack enable pnpm

# Copy package files
COPY package.json pnpm-workspace.yaml ./
COPY apps/web/package.json ./apps/web/

# Install dependencies
RUN pnpm install --no-frozen-lockfile

# Build stage
FROM base AS builder
WORKDIR /app
RUN corepack enable pnpm

# Copy node_modules and source
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules
COPY . .

# Set build environment
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV NEXT_PUBLIC_ENV=staging
ENV NEXT_PUBLIC_FIREBASE_PROJECT_ID=ai-math-tutor-prod
ENV NEXT_PUBLIC_FIREBASE_API_KEY=dummy-key-for-build
ENV NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=ai-math-tutor-prod.firebaseapp.com
ENV NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=ai-math-tutor-prod.firebasestorage.app
ENV NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=739150684593
ENV NEXT_PUBLIC_FIREBASE_APP_ID=dummy-app-id-for-build

# Build the app
RUN cd apps/web && pnpm build

# Runtime stage - following runbook pattern exactly
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copy Next standalone output for monorepo (runbook pattern)
COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/public ./apps/web/public  
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static

# Cloud Run PORT (runbook requirement)
ENV PORT=8080
EXPOSE 8080

# Create user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
RUN chown -R nextjs:nodejs /app
USER nextjs

# The server.js is at /app/server.js (root of standalone), not in apps/web
CMD ["node","/app/server.js"]