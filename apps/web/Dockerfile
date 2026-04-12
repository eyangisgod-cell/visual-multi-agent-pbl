# syntax=docker/dockerfile:1.4
# apps/web/Dockerfile (Development)

FROM node:20-bookworm-slim AS base

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    openssl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

ENV PRISMA_QUERY_ENGINE_BINARY=/app/node_modules/@prisma/engines/query-engine \
    NEXT_TELEMETRY_DISABLED=1

FROM base AS deps

COPY package.json package-lock.json* ./

RUN --mount=type=cache,target=/root/.npm \
    npm config set registry https://registry.npmmirror.com && \
    npm install --legacy-peer-deps

FROM base AS runtime

COPY --from=deps /app/node_modules ./node_modules

COPY . .

RUN npx prisma generate

EXPOSE 3000

HEALTHCHECK --interval=10s --timeout=5s --start-period=40s --retries=3 \
    CMD wget -q --spider http://localhost:3000/api/health || exit 1

CMD ["npm", "run", "dev"]
