# Build context must be the monorepo root:
#   docker build -f services/hardware-relayer/Dockerfile .
#
# ─── Stage 1: Build TypeScript ────────────────────────────────────────────────
FROM node:20-slim AS builder

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app/services/hardware-relayer

# Cache dependency layer
COPY services/hardware-relayer/package.json ./
RUN pnpm install --frozen-lockfile

# Compile TypeScript
COPY services/hardware-relayer/tsconfig.json ./
COPY services/hardware-relayer/src ./src
RUN pnpm build


# ─── Stage 2: Runtime ─────────────────────────────────────────────────────────
FROM node:20-slim AS runtime

# Leo CLI prerequisites
RUN apt-get update && apt-get install -y \
    curl \
    ca-certificates \
    --no-install-recommends \
  && rm -rf /var/lib/apt/lists/*

# Install Leo CLI (binary lands at ~/.aleo/bin/leo)
RUN curl -L https://raw.githubusercontent.com/AleoHQ/leo/mainnet/install.sh | bash
ENV PATH="/root/.aleo/bin:${PATH}"

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Production deps
COPY services/hardware-relayer/package.json ./
RUN pnpm install --frozen-lockfile --prod

# Compiled JS
COPY --from=builder /app/services/hardware-relayer/dist ./dist

# Aleo compliance Leo project (leo run needs the full project directory)
COPY contracts/aleo-compliance ./contracts/aleo-compliance

ENV NODE_ENV=production
ENV PORT=3001
ENV ALEO_PROGRAM_PATH=/app/contracts/aleo-compliance

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

CMD ["node", "dist/index.js"]
