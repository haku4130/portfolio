# Portfolio – Andrey Osipov

Personal portfolio of a Python backend developer, live at **[aosipov.dev](https://aosipov.dev)**.
Bilingual (Russian / English), content-driven, deployed as a Dockerized SSR app behind Traefik.

## Tech stack

- **[Nuxt 4](https://nuxt.com)** · Vue 3 · TypeScript
- **[Nuxt UI 4](https://ui.nuxt.com)** · Tailwind CSS 4
- **[Nuxt Content](https://content.nuxt.com)** – content-driven pages (YAML/Markdown)
- **[@nuxtjs/i18n](https://i18n.nuxtjs.org)** – Russian & English
- **[@nuxt/image](https://image.nuxt.com)** – on-the-fly AVIF/WebP via IPX
- **nuxt-og-image** – generated social preview images
- **motion-v** – animations

## Features

- Bilingual RU/EN with a language switcher (`prefix_except_default` routing)
- Landing sections: hero, about, work experience (detail modals + auto-computed tenure), education, tech stack, testimonials, FAQ
- Projects and About pages driven by localized content
- Downloadable résumé (RU/EN PDF)
- Dark / light mode, fully responsive, optimized images, SEO meta & OG images
- Self-hosted, cookie-free analytics with a private `/stats` dashboard and Telegram alerts

## Analytics

Visits are recorded by the app itself — no third-party script, no cookies, no
consent banner. The raw IP address is never stored: it is hashed together with a
daily-rotating salt, which counts unique visitors within a day while making the
same person impossible to follow across days. Events older than a year are
deleted on startup.

Two collectors work together: server middleware records the first request of a
visit (unblockable, and the source of the referrer and geo data), and a
first-party beacon to `/api/e` reports what the server cannot see — client-side
navigation, résumé downloads and contact clicks.

Country and city come from the free [DB-IP City Lite](https://db-ip.com/db/lite.php)
database, downloaded into the image at build time (`DBIP_MONTH` build arg), so
lookups never leave the container. Attribution is required by its CC BY licence
and is shown on the dashboard.

The dashboard lives at `/stats` and is protected by HTTP basic auth at the
Traefik layer, together with `/api/stats`. Telegram alerts fire for résumé
downloads, contact clicks and visits that arrive through a utm-tagged link.

### Required environment (`.env` on the server, never committed)

| Variable | Purpose |
| --- | --- |
| `STATS_BASIC_AUTH` | htpasswd entry guarding `/stats`, e.g. `htpasswd -nbB admin 'secret' \| sed -e 's/\$/\$\$/g'` — every `$` must be doubled for Compose |
| `ANALYTICS_SALT` | Secret for visitor hashing; if unset a random one is generated per restart and unique counts reset |
| `TELEGRAM_BOT_TOKEN` | Bot token for alerts; alerts are silently skipped when unset |
| `TELEGRAM_CHAT_ID` | Chat that receives the alerts |

`ANALYTICS_DB` and `GEOIP_DB` are set by `docker-compose.yml` and the
`Dockerfile`; the database lives in the `portfolio-data` volume so deploys do
not wipe it.

## Project structure

```
app/            # pages, components, layouts, composables
content/
  ru/           # Russian content (index, about, projects/*)
  en/           # English content
i18n/           # UI locale strings
public/         # static assets, résumé PDFs, favicon
content.config.ts   # Nuxt Content collections & schemas
server/         # analytics collectors, stats API, SQLite storage
test/           # vitest suites for the analytics logic
nuxt.config.ts
Dockerfile          # multi-stage build for the SSR server
docker-compose.yml  # service + Traefik labels
```

## Development

```bash
pnpm install
pnpm dev          # http://localhost:3000
```

```bash
pnpm lint         # ESLint
pnpm typecheck    # nuxt typecheck (vue-tsc)
pnpm test         # vitest (analytics logic)
pnpm build        # production build (.output)
pnpm preview      # preview the production build
```

In development the analytics database is written to `.data/analytics.db` and geo
lookups are skipped unless `GEOIP_DB` points at an mmdb file.

## Deployment

The app is a Node SSR server (`node .output/server/index.mjs`) packaged with the
provided `Dockerfile` and published behind **Traefik**, which terminates TLS via
Let's Encrypt.

CI/CD ([GitHub Actions](.github/workflows/ci.yml)):

1. On every push – run **lint**, **typecheck** and **tests**.
2. On push to `main` – SSH into the server and redeploy:
   `git pull && docker compose up -d --build`.

Manual deploy:

```bash
ssh <server> 'cd ~/portfolio && git pull && docker compose up -d --build'
```
