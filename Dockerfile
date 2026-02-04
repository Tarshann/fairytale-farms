# Fairytale Farms – run on Railway, Fly.io, or any Docker host.
# Build: docker build -t fairytale-farms .
# Run:   docker run -p 3000:3000 -e DATABASE_URL=... -e NODE_ENV=production fairytale-farms

FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

# Install dependencies
FROM base AS deps
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Build app
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm build

# Production image: only dist + node_modules + package.json
FROM base AS runner
ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
CMD ["node", "dist/index.js"]
