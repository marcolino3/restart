# syntax=docker/dockerfile:1.7

# Build context = repo root. Build with:
#   docker build -f apps/web/Dockerfile -t restart-frontend .

# Stage 1: Prune monorepo down to web + its workspace deps
FROM node:26-alpine AS pruner
WORKDIR /app
RUN apk add --no-cache libc6-compat
RUN corepack enable
COPY . .
RUN pnpm dlx turbo@^2 prune @restart/web --docker

# Stage 2: Install dependencies based on pruned lockfile
FROM node:26-alpine AS deps
WORKDIR /app
RUN apk add --no-cache libc6-compat
RUN corepack enable
COPY --from=pruner /app/out/json/ ./
RUN pnpm install --frozen-lockfile

# Stage 3: Build
FROM node:26-alpine AS build
WORKDIR /app
RUN apk add --no-cache libc6-compat
RUN corepack enable
COPY --from=deps /app/ ./
COPY --from=pruner /app/out/full/ ./

ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

ARG NEXT_PUBLIC_GRAPHQL_API_URL
ENV NEXT_PUBLIC_GRAPHQL_API_URL=$NEXT_PUBLIC_GRAPHQL_API_URL

ARG NEXT_PUBLIC_BACKEND_PUBLIC_URL
ENV NEXT_PUBLIC_BACKEND_PUBLIC_URL=$NEXT_PUBLIC_BACKEND_PUBLIC_URL

ARG NEXT_PUBLIC_GOOGLE_LOGIN_API
ENV NEXT_PUBLIC_GOOGLE_LOGIN_API=$NEXT_PUBLIC_GOOGLE_LOGIN_API

ARG NEXT_PUBLIC_APPLE_LOGIN_API
ENV NEXT_PUBLIC_APPLE_LOGIN_API=$NEXT_PUBLIC_APPLE_LOGIN_API

ARG BACKEND_URL
ENV BACKEND_URL=$BACKEND_URL

# Sentry build-time args. SENTRY_AUTH_TOKEN ist nötig damit withSentryConfig
# Source-Maps hochlädt. Wenn leer, läuft der Build trotzdem durch.
ARG NEXT_PUBLIC_SENTRY_DSN
ENV NEXT_PUBLIC_SENTRY_DSN=$NEXT_PUBLIC_SENTRY_DSN

ARG NEXT_PUBLIC_SENTRY_ENVIRONMENT
ENV NEXT_PUBLIC_SENTRY_ENVIRONMENT=$NEXT_PUBLIC_SENTRY_ENVIRONMENT

ARG NEXT_PUBLIC_SENTRY_RELEASE
ENV NEXT_PUBLIC_SENTRY_RELEASE=$NEXT_PUBLIC_SENTRY_RELEASE

ARG SENTRY_ORG
ENV SENTRY_ORG=$SENTRY_ORG

ARG SENTRY_PROJECT
ENV SENTRY_PROJECT=$SENTRY_PROJECT

ARG SENTRY_AUTH_TOKEN
ENV SENTRY_AUTH_TOKEN=$SENTRY_AUTH_TOKEN

# PostHog: nur der Public-Key + Host werden ins Browser-Bundle inlined.
# Der Key ist nicht geheim (Project-Key, write-only), aber Misbrauch
# wird über das PostHog-Projekt selbst rate-limited.
ARG NEXT_PUBLIC_POSTHOG_KEY
ENV NEXT_PUBLIC_POSTHOG_KEY=$NEXT_PUBLIC_POSTHOG_KEY

ARG NEXT_PUBLIC_POSTHOG_HOST
ENV NEXT_PUBLIC_POSTHOG_HOST=$NEXT_PUBLIC_POSTHOG_HOST

RUN pnpm turbo run build --filter=@restart/web

# Stage 4: Production runtime (Next.js standalone)
FROM node:26-alpine AS production
WORKDIR /app

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Next.js standalone with outputFileTracingRoot=monorepo root copies the whole
# pruned workspace into .next/standalone, plus a flattened node_modules.
COPY --from=build --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=build --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "apps/web/server.js"]
