# syntax=docker/dockerfile:1.7

# Build context = repo root. Build with:
#   docker build -f apps/web/Dockerfile -t restart-frontend .

# Stage 1: Prune monorepo down to web + its workspace deps
FROM node:22-alpine AS pruner
WORKDIR /app
RUN apk add --no-cache libc6-compat
RUN corepack enable
COPY . .
RUN pnpm dlx turbo@^2 prune @restart/web --docker

# Stage 2: Install dependencies based on pruned lockfile
FROM node:22-alpine AS deps
WORKDIR /app
RUN apk add --no-cache libc6-compat
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

# Client-side API/image/login URLs are same-origin & relative (`/api`), so no
# NEXT_PUBLIC_* URL is baked at build time anymore. This is what makes the image
# domain-agnostic: the exact same SHA built on staging can be promoted to prod
# without a rebuild. The server-side GraphQL client reads INTERNAL_GRAPHQL_API_URL
# from the runtime environment (k8s secret), not from a build arg.
#
# BACKEND_URL is only used by next.config.ts rewrites (`/api/*` proxy) for the
# local `next dev` server; in the cluster the ingress handles same-origin routing.
ARG BACKEND_URL
ENV BACKEND_URL=$BACKEND_URL

RUN pnpm turbo run build --filter=@restart/web

# Stage 4: Production runtime (Next.js standalone)
FROM node:22-alpine AS production
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
