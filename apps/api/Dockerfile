# ── Stage: install only the API workspace deps ───────────────────────────────
# Build context is the monorepo root (see docker-compose.yml).
FROM node:22-bookworm-slim AS deps
WORKDIR /app

# libpg-query ships a native .node binary — Debian slim has the glibc it needs.
# Copy manifests first so Docker can cache `npm ci` when source code changes.
COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/
RUN npm ci -w @querylens/api --omit=dev --include-workspace-root=false

# ── Stage: runtime image ─────────────────────────────────────────────────────
FROM node:22-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

# npm workspaces hoist everything into the root node_modules — there is no
# apps/api/node_modules to copy.
COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json ./
COPY apps/api ./apps/api

WORKDIR /app/apps/api
EXPOSE 4000

# Migrations first (no-op if already applied), then the API.
CMD ["sh", "-c", "node src/db/migrate.js && node src/server.js"]
