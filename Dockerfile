# syntax=docker/dockerfile:1

FROM node:22-slim AS base
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable
WORKDIR /app

# ---- geo database stage ----
# Downloads the free DB-IP City Lite database at build time so the runtime
# container never makes network requests for geo lookups. Kept in a separate
# stage so that bumping DBIP_MONTH does not invalidate the dependency cache.
FROM base AS geo
# DB-IP publishes a new file on the 1st of every month. If the requested month
# is not published yet (404), we fall back to the previous month.
ARG DBIP_MONTH=2026-09
RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates curl \
  && rm -rf /var/lib/apt/lists/*
RUN set -eu; \
  mkdir -p /geo; \
  prev="$(date -u -d "${DBIP_MONTH}-01 -1 month" +%Y-%m 2>/dev/null || true)"; \
  for month in "${DBIP_MONTH}" ${prev}; do \
    url="https://download.db-ip.com/free/dbip-city-lite-${month}.mmdb.gz"; \
    echo "Fetching ${url}"; \
    if curl -fsSL --retry 3 --retry-delay 2 -o /tmp/dbip.mmdb.gz "${url}"; then \
      if gzip -dc /tmp/dbip.mmdb.gz > /geo/dbip-city-lite.mmdb; then \
        echo "GeoIP database for ${month} bundled"; \
        break; \
      fi; \
      rm -f /geo/dbip-city-lite.mmdb; \
    fi; \
    echo "GeoIP database for ${month} is unavailable"; \
  done; \
  rm -f /tmp/dbip.mmdb.gz; \
  [ -s /geo/dbip-city-lite.mmdb ] \
    || echo "WARNING: no GeoIP database bundled, the app will run without geo data"

# ---- build stage ----
FROM base AS build
# Native build deps for better-sqlite3 (@nuxt/content) and sharp (@nuxt/image)
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ ca-certificates \
  && rm -rf /var/lib/apt/lists/*
COPY package.json pnpm-lock.yaml ./
# pnpm 11 blocks native build scripts by default. The install still populates
# node_modules and only exits non-zero because of the ignored-builds gate, so we
# tolerate that exit code and then build the required native deps explicitly.
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile || true
RUN pnpm rebuild esbuild sharp better-sqlite3 unrs-resolver vue-demi @parcel/watcher
COPY . .
ENV NODE_OPTIONS=--max-old-space-size=4096
RUN pnpm run build

# ---- runtime stage ----
FROM base AS runtime
ENV NODE_ENV=production
ENV NITRO_HOST=0.0.0.0
ENV NITRO_PORT=3000
ENV GEOIP_DB=/app/geo/dbip-city-lite.mmdb
COPY --from=build /app/.output ./.output
# Copy the directory (not the file) so the build still succeeds when the
# database could not be downloaded: /app/geo is then simply empty.
COPY --from=geo /geo /app/geo
EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
