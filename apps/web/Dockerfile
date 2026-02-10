# Stage 1: Dependencies
FROM node:22-alpine AS deps
RUN npm install -g npm@11
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install

# Stage 2: Build
FROM node:22-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

ARG NEXT_PUBLIC_GRAPHQL_API_URL
ENV NEXT_PUBLIC_GRAPHQL_API_URL=$NEXT_PUBLIC_GRAPHQL_API_URL

ARG NEXT_PUBLIC_BACKEND_PUBLIC_URL
ENV NEXT_PUBLIC_BACKEND_PUBLIC_URL=$NEXT_PUBLIC_BACKEND_PUBLIC_URL

ARG NEXT_PUBLIC_GOOGLE_LOGIN_API
ENV NEXT_PUBLIC_GOOGLE_LOGIN_API=$NEXT_PUBLIC_GOOGLE_LOGIN_API

ARG BACKEND_URL
ENV BACKEND_URL=$BACKEND_URL

RUN npm run build

# Stage 3: Production
FROM node:22-alpine AS production
WORKDIR /app

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

COPY --from=build /app/public ./public
COPY --from=build --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
