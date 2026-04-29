FROM node:20-alpine AS base

WORKDIR /app

# wget is needed for the HEALTHCHECK
RUN apk add --no-cache wget

# Copy manifests first so Docker can cache the install layer
COPY package*.json ./

# Install production dependencies only, then clean the cache
RUN npm ci --omit=dev && npm cache clean --force

# Copy the rest of the server source
COPY . .

# Run as the unprivileged 'node' user (not root)
USER node

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget --quiet --spider http://localhost:3000/health || exit 1

CMD ["node", "src/index.js"]
