FROM node:22-alpine
WORKDIR /app
COPY server.mjs hash-password.mjs ./
COPY public ./public
ENV NODE_ENV=production HOST=0.0.0.0 PORT=8080 VAULT_DIR=/vault
USER node
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://127.0.0.1:8080/healthz || exit 1
CMD ["node", "server.mjs"]
