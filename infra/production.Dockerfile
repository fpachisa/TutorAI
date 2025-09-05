# infra/production.Dockerfile
FROM node:20-alpine AS deps
WORKDIR /app
RUN npm i -g pnpm
COPY package.json pnpm-workspace.yaml ./
COPY apps/web/package.json apps/web/package.json
RUN pnpm install --no-frozen-lockfile

FROM node:20-alpine AS builder
WORKDIR /app
RUN npm i -g pnpm
COPY . .
RUN pnpm install --no-frozen-lockfile
RUN pnpm --filter web build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
# Copy the entire standalone output preserving the structure
COPY --from=builder /app/apps/web/.next/standalone ./
# Copy public assets
COPY --from=builder /app/apps/web/public ./apps/web/public
# Copy static assets
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static
# Cloud Run PORT
ENV PORT=8080
EXPOSE 8080
# Start from the root where the standalone server.js expects to be
CMD ["node", "apps/web/server.js"]