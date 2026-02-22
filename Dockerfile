# ---- Stage 1: Build ----
FROM node:20-slim AS builder
WORKDIR /app

# Install dependencies (cached if package.json unchanged)
COPY package.json package-lock.json* ./
COPY scripts/patch-watcher.js ./scripts/
RUN --mount=type=cache,target=/root/.npm npm ci

# Build Medusa
COPY tsconfig.json medusa-config.ts ./
COPY src/ ./src/
RUN npx medusa build && ls -la .medusa/server/

# ---- Stage 2: Production runner ----
FROM node:20-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copy built server and install only production deps
COPY --from=builder /app/.medusa/server ./
RUN mkdir -p scripts && echo "" > scripts/patch-watcher.js
RUN npm ci --omit=dev

EXPOSE 9000

CMD ["sh", "-c", "npx medusa db:migrate && npx medusa start"]
