# syntax=docker/dockerfile:1

FROM node:22-bookworm-slim AS deps
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@9.15.9 --activate
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY patches ./patches
COPY vendor ./vendor
RUN pnpm install --frozen-lockfile

FROM deps AS build
COPY . .
# Client-side Clerk key must be present at build time (Vite embed).
ARG VITE_CLERK_PUBLISHABLE_KEY
ARG VITE_CLERK_SIGN_IN_URL=/sign-in
ARG VITE_CLERK_SIGN_UP_URL=/sign-up
ARG VITE_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/
ARG VITE_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/
ENV VITE_CLERK_PUBLISHABLE_KEY=$VITE_CLERK_PUBLISHABLE_KEY \
  VITE_CLERK_SIGN_IN_URL=$VITE_CLERK_SIGN_IN_URL \
  VITE_CLERK_SIGN_UP_URL=$VITE_CLERK_SIGN_UP_URL \
  VITE_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=$VITE_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL \
  VITE_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=$VITE_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL
RUN pnpm build

FROM node:22-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production \
  PORT=3000 \
  HOST=0.0.0.0
RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates \
  && rm -rf /var/lib/apt/lists/* \
  && corepack enable \
  && corepack prepare pnpm@9.15.9 --activate \
  && groupadd --system --gid 1001 nodejs \
  && useradd --system --uid 1001 --gid nodejs appuser
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY patches ./patches
COPY vendor ./vendor
RUN pnpm install --frozen-lockfile --prod
COPY --from=build /app/dist ./dist
USER appuser
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["pnpm", "start"]
