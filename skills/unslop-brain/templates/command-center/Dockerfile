# Stage 1: build the UI (React, HeroUI, Tailwind) from ui/ and the design tokens in design/
FROM node:22-alpine AS ui
WORKDIR /build
COPY ui/package.json ui/package-lock.json ./ui/
RUN cd ui && npm ci
COPY ui ./ui
COPY design ./design
RUN cd ui && npm run build

# Stage 2: the dependency-free server plus the built UI
FROM node:22-alpine
WORKDIR /app
COPY server.mjs hash-password.mjs ./
COPY --from=ui /build/ui/dist ./public
ENV NODE_ENV=production HOST=0.0.0.0 PORT=8080 VAULT_DIR=/vault PUBLIC_DIR=/app/public
USER node
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://127.0.0.1:8080/healthz || exit 1
CMD ["node", "server.mjs"]
