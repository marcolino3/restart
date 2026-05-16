# syntax=docker/dockerfile:1.7

# Build context = repo root. Build with:
#   docker build -f apps/backend/Dockerfile -t restart-backend .

# Stage 1: Prune monorepo down to backend + its workspace deps
FROM node:22-alpine AS pruner
WORKDIR /app
RUN apk add --no-cache libc6-compat
RUN corepack enable
COPY . .
RUN pnpm dlx turbo@^2 prune @restart/backend --docker

# Stage 2: Install dependencies based on pruned lockfile
FROM node:22-alpine AS deps
WORKDIR /app
RUN apk add --no-cache libc6-compat python3 make g++
RUN corepack enable
COPY --from=pruner /app/out/json/ ./
RUN pnpm install --frozen-lockfile

# Stage 3: Build
FROM node:22-alpine AS build
WORKDIR /app
RUN apk add --no-cache libc6-compat
RUN corepack enable
COPY --from=deps /app/ ./
COPY --from=pruner /app/out/full/ ./

# SENTRY_RELEASE wird beim CI-Build mit dem Git-SHA gesetzt, sodass Sentry
# pro Release weiss, welcher Commit deployed ist. Wird zu einer ENV im
# Production-Image, damit instrument.ts es zur Laufzeit liest.
ARG SENTRY_RELEASE
ENV SENTRY_RELEASE=$SENTRY_RELEASE

RUN pnpm turbo run build --filter=@restart/backend
RUN pnpm --filter @restart/backend deploy --prod /prod/backend

# Stage 4: Production runtime
FROM node:22-alpine AS production
WORKDIR /app
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

COPY --from=build --chown=nestjs:nodejs /prod/backend/dist ./dist
COPY --from=build --chown=nestjs:nodejs /prod/backend/node_modules ./node_modules
COPY --from=build --chown=nestjs:nodejs /prod/backend/package.json ./package.json

# Release-Tag durchreichen (siehe ARG in Stage 3).
ARG SENTRY_RELEASE
ENV SENTRY_RELEASE=$SENTRY_RELEASE

USER nestjs

EXPOSE 3001

CMD ["node", "dist/src/main"]
