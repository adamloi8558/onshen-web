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
ENV DATABASE_URL="postgres://postgres:7q5Fc3THW88L73nd7pizr2nmmrfYsriUgFGGUvoBLdzXQUD287omXrjKzjNPc9Be@s4kcgg0kcw0c4wowoocsogk0:5432/postgres"
ENV JWT_SECRET="development-jwt-secret-key-123456789"
ENV CLOUDFLARE_R2_ACCOUNT_ID="006ec9fb36d37617efc47a9811cc37a1"
ENV CLOUDFLARE_R2_ACCESS_KEY_ID="6e6790ddc7c1b21a8534798c687a2042"
ENV CLOUDFLARE_R2_SECRET_ACCESS_KEY="166ebdd1490e9dedeceaa2b8068632db7642d8920070f2cc30aaaddcf0a9d640"
ENV CLOUDFLARE_R2_BUCKET_NAME="movieflix"
ENV CLOUDFLARE_R2_PUBLIC_URL="https://pub-b24c104618264932a27b9455988b0fae.r2.dev"
ENV TURNSTILE_SITE_KEY="0x4AAAAABsXjXiK8Z15XV7m"
ENV TURNSTILE_SECRET_KEY="0x4AAAAABsXjSITwbcy65L684ku_5wV4HU"
ENV REDIS_URL="redis://default:G5iC4QtMVcz3rfoumgK9fZdrg1dCs3NRb5hydif816fkaJzMEibS5wuHqNDZVYbx@o8wkkoo88ks0ww8oko0ck448:6379/00"
ENV NODE_ENV="production"
ENV NEXT_PUBLIC_APP_URL="https://ronglakorn.com/"
ENV NEXT_PUBLIC_API_URL="https://ronglakorn.com/api"
ENV NEXT_PUBLIC_TURNSTILE_SITE_KEY="0x4AAAAABsXjXiK8Z15XV7m"
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