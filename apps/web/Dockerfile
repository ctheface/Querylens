# ── Stage 1: build the React app into static files ───────────────────────────
FROM node:22-bookworm-slim AS build
WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/web/package.json ./apps/web/
RUN npm ci -w @querylens/web --include-workspace-root=false

COPY apps/web ./apps/web
RUN npm run build -w @querylens/web

# ── Stage 2: serve with nginx (tiny final image) ─────────────────────────────
FROM nginx:1.27-alpine AS runner
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/web/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
