# Portfolio — Andrey Osipov

Personal portfolio of a Python backend developer, live at **[aosipov.dev](https://aosipov.dev)**.
Bilingual (Russian / English), content-driven, deployed as a Dockerized SSR app behind Traefik.

## Tech stack

- **[Nuxt 4](https://nuxt.com)** · Vue 3 · TypeScript
- **[Nuxt UI 4](https://ui.nuxt.com)** · Tailwind CSS 4
- **[Nuxt Content](https://content.nuxt.com)** — content-driven pages (YAML/Markdown)
- **[@nuxtjs/i18n](https://i18n.nuxtjs.org)** — Russian & English
- **[@nuxt/image](https://image.nuxt.com)** — on-the-fly AVIF/WebP via IPX
- **nuxt-og-image** — generated social preview images
- **motion-v** — animations

## Features

- Bilingual RU/EN with a language switcher (`prefix_except_default` routing)
- Landing sections: hero, about, work experience (detail modals + auto-computed tenure), education, tech stack, testimonials, FAQ
- Projects and About pages driven by localized content
- Downloadable résumé (RU/EN PDF)
- Dark / light mode, fully responsive, optimized images, SEO meta & OG images

## Project structure

```
app/            # pages, components, layouts, composables
content/
  ru/           # Russian content (index, about, projects/*)
  en/           # English content
i18n/           # UI locale strings
public/         # static assets, résumé PDFs, favicon
content.config.ts   # Nuxt Content collections & schemas
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
pnpm build        # production build (.output)
pnpm preview      # preview the production build
```

## Deployment

The app is a Node SSR server (`node .output/server/index.mjs`) packaged with the
provided `Dockerfile` and published behind **Traefik**, which terminates TLS via
Let's Encrypt.

CI/CD ([GitHub Actions](.github/workflows/ci.yml)):

1. On every push — run **lint** and **typecheck**.
2. On push to `main` — SSH into the server and redeploy:
   `git pull && docker compose up -d --build`.

Manual deploy:

```bash
ssh <server> 'cd ~/portfolio && git pull && docker compose up -d --build'
```
