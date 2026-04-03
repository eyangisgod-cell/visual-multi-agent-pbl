# apps/web/Dockerfile
FROM node:20-bookworm

WORKDIR /app

# Install OpenSSL 3 - Prisma 5.9+ supports OpenSSL 3
RUN apt-get update && apt-get install -y \
    openssl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Set environment for Prisma to use binary engine
ENV PRISMA_QUERY_ENGINE_BINARY=/app/node_modules/@prisma/engines/query-engine

# Install dependencies
COPY package.json ./
RUN npm install --legacy-peer-deps

# Copy source
COPY . .

# Generate Prisma client
RUN npx prisma generate

EXPOSE 3000

CMD ["npm", "run", "dev"]
