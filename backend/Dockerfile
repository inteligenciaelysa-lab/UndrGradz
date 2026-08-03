# ---- Stage 1: install deps & generate Prisma client ----
FROM node:22-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci

# ---- Stage 2: production runtime ----
FROM node:22-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/prisma ./prisma
COPY server.js ./
COPY src ./src
COPY public ./public

EXPOSE 8080
USER node
CMD ["node", "server.js"]
