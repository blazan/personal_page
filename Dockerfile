# syntax=docker/dockerfile:1

# ---------------------------------------------------------------------------
# Multi-stage build for the Marijana Mandić portfolio.
#
# Why this shape:
#   * Alpine keeps the runtime image small (musl binaries for sharp, Next's
#     SWC and Tailwind's oxide are all present in the lockfile, so the Alpine
#     build resolves without extra work).
#   * `output: "standalone"` in next.config.mjs means the final image ships only
#     the server plus the modules it actually imports - no full node_modules.
#   * Native addons (better-sqlite3, sharp) are compiled/installed in the
#     builder stage against the same Alpine version the runtime uses.
# ---------------------------------------------------------------------------

# ===========================================================================
# Stage 1 - deps: install node modules (cached unless the lockfile changes)
# ===========================================================================
FROM node:22-alpine AS deps

# libc6-compat smooths over glibc/musl differences for prebuilt binaries.
RUN apk add --no-cache libc6-compat

WORKDIR /app

# Copy only manifests first so this layer is reused when only source changes.
COPY package.json package-lock.json ./

# `npm ci` is reproducible and fails if the lockfile and manifest disagree.
#
# --ignore-scripts is deliberate: better-sqlite3 ships prebuilt musl binaries
# (prebuilds/linuxmusl-x64.node) and its lib/*.js loads them directly, but npm
# would otherwise auto-run `node-gyp rebuild` just because the package contains
# a binding.gyp. That would require a full C++ toolchain and Python in the
# image for no benefit. sharp is unaffected: it resolves its libvips binary
# from the @img/sharp-linuxmusl-* optional dependency, which needs no scripts.
RUN npm ci --ignore-scripts

# Fail fast if a native addon did not resolve. Without this, a missing or
# wrong-architecture prebuild would only surface as a runtime crash after
# deploy; here it stops the build. Nothing is written to the filesystem.
RUN node -e "\
  const Database = require('better-sqlite3');\
  const db = new Database(':memory:');\
  db.exec('CREATE TABLE t (a)');\
  db.prepare('INSERT INTO t VALUES (?)').run(1);\
  if (db.prepare('SELECT COUNT(*) AS c FROM t').get().c !== 1) throw new Error('sqlite read/write failed');\
  db.close();\
  const sharp = require('sharp');\
  if (!sharp.versions.vips) throw new Error('sharp/libvips unavailable');\
  console.log('native addons ok: better-sqlite3 + sharp (libvips ' + sharp.versions.vips + ')');\
"

# ===========================================================================
# Stage 2 - builder: compile the Next.js app
# ===========================================================================
FROM node:22-alpine AS builder

RUN apk add --no-cache libc6-compat

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1

# No secrets are set for the build. AUTH_SECRET is read lazily at request time
# (never at module import), so the build does not need it, and this keeps the
# real value out of every image layer.

RUN npm run build

# ---------------------------------------------------------------------------
# Prune the standalone output before it is copied into the runtime image.
#
# This runs in the builder (not the runner) on purpose: deleting files in a
# later Docker layer would not shrink the image, because the bytes would still
# live in the earlier COPY layer. Doing it here means the smaller tree is what
# actually gets copied.
#
# Next's dependency tracing is conservative and keeps things the server cannot
# reach:
#   * typescript         - a build-time tool; the server runs compiled JS.
#   * non-musl prebuilds - this image is Alpine (musl). Both musl architectures
#                          are kept so the same image runs on x86-64 and arm64.
#   * sharp-wasm32       - a fallback for platforms with no native binary.
# Together these account for roughly 40 MB.
# ---------------------------------------------------------------------------
RUN set -eux; \
    rm -rf .next/standalone/node_modules/typescript; \
    find .next/standalone/node_modules/better-sqlite3/prebuilds -type f \
      ! -name 'linuxmusl-*.node' -delete; \
    rm -rf .next/standalone/node_modules/@img/sharp-wasm32; \
    find .next/standalone/node_modules -type d -empty -delete

# ===========================================================================
# Stage 3 - runner: minimal production image
# ===========================================================================
FROM node:22-alpine AS runner

# wget is used by the container healthcheck in docker-compose.yml.
RUN apk add --no-cache libc6-compat wget

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
# Bind to all interfaces so the port is reachable from outside the container.
ENV HOSTNAME=0.0.0.0

# Persisted state. Both paths are declared as volumes in docker-compose.yml.
ENV DATA_DIR=/app/data
ENV UPLOAD_DIR=/app/uploads

# Run as an unprivileged user. The app only ever writes to /app/data and
# /app/uploads, so those two directories are the only ones that need to be
# owned by it.
RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 --ingroup nodejs nextjs \
 && mkdir -p /app/data /app/uploads \
 && chown -R nextjs:nodejs /app/data /app/uploads

# Standalone server, its trimmed node_modules, and the static assets.
# The static and public folders are NOT included in the standalone bundle, so
# they must be copied explicitly or CSS/images return 404.
# The standalone tree was already pruned in the builder stage.
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# npm is only needed to build, and this container starts the server directly.
# Removing it here does shrink the image: it lives in the base image layer,
# which no COPY has re-added.
RUN rm -rf /usr/local/lib/node_modules/npm /usr/local/bin/npm /usr/local/bin/npx

USER nextjs

EXPOSE 3000

# The healthcheck lives here as well as in compose so the image is verifiable
# on its own (`docker run` without compose still reports health).
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/api/health > /dev/null || exit 1

CMD ["node", "server.js"]
