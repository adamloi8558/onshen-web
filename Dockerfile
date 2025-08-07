# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./
COPY next.config.js ./
COPY tailwind.config.ts ./
COPY postcss.config.js ./
COPY drizzle.config.ts ./
COPY components.json ./

# Install dependencies (all for build)
RUN npm ci && npm cache clean --force

# Copy source code
COPY src ./src
COPY public ./public

# Build the application (with placeholder for required env vars)
ENV DATABASE_URL="placeholder://placeholder"
ENV JWT_SECRET="placeholder-jwt-secret-for-build"
ENV CLOUDFLARE_R2_ACCOUNT_ID="placeholder"
ENV CLOUDFLARE_R2_ACCESS_KEY_ID="placeholder"
ENV CLOUDFLARE_R2_SECRET_ACCESS_KEY="placeholder"
ENV CLOUDFLARE_R2_BUCKET_NAME="placeholder"
ENV CLOUDFLARE_R2_PUBLIC_URL="https://placeholder.r2.dev"
ENV TURNSTILE_SITE_KEY="placeholder"
ENV TURNSTILE_SECRET_KEY="placeholder"
ENV REDIS_URL="redis://placeholder:6379/0"
ENV NODE_ENV="production"
ENV NEXT_PUBLIC_APP_URL="https://placeholder.com"
ENV NEXT_PUBLIC_API_URL="https://placeholder.com/api"
ENV NEXT_PUBLIC_TURNSTILE_SITE_KEY="placeholder"
RUN npm run build

# Production stage
FROM node:18-alpine AS runner

WORKDIR /app

# Install curl for healthcheck
RUN apk add --no-cache curl

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy necessary files from builder
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Set correct permissions
RUN chown -R nextjs:nodejs /app
USER nextjs

# Expose port
EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# Start the application
CMD ["node", "server.js"]