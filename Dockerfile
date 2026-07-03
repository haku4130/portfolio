# syntax=docker/dockerfile:1

FROM node:22-slim AS base
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable
WORKDIR /app

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
COPY --from=build /app/.output ./.output
EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
