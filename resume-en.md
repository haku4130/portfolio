# Andrey Osipov — Experience (EN)

Backend-focused software engineer. Python, high-load systems, and security.

---

## Innovation Center «Safe Transport» — Python Developer

**02.2026 — Present**

**Context:** highload services for transport-safety systems; multi-terabyte MongoDB, modern stack, working with sensitive data under NDA.

- Designed and shipped an aggregated collection on top of the main multi-terabyte MongoDB database: consolidated data from many disparate collections into a single complete model — providing richer data out of the box and removing the need to assemble it from dozens of collections on every request.
- Built from scratch (backend + frontend) a Git-style state-versioning system for the main service: change tracking (commits), state diffs, stable versions, and history visualized as a graph — making changes transparent and traceable, with the ability to compare states and rely on stable versions.
- Modernizing legacy services by rewriting them in FastAPI: improving performance and reducing technical debt.
- Working with sensitive systems under NDA — strict security and code-quality requirements, directly resonating with my information-security specialization (MEPHI).

---

## VendorHub LLC — Full-stack Developer

**09.2025 — 02.2026**

**Context:** B2B platform for matching vendors to company projects (vendorfind.ru); solo full-cycle development — architecture, backend, frontend, infrastructure, and deployment.

- Designed and single-handedly shipped to production a B2B vendor-matching platform: companies post projects with requirements, and the system surfaces the most relevant vendors. Sole owner of the product — from DB schema and API design to UI and deployment.
- Built the product's core — the vendor matching and ranking logic based on project requirements.
- Developed the backend on FastAPI / DRF with PostgreSQL: projects, vendor profiles, requests, matching.
- Offloaded analytics generation and other heavy operations to Celery background tasks — keeping the API responsive.
- Integrated external APIs and a notification system, automating key user flows.
- Built the frontend on Nuxt (Vue) — company and vendor dashboards, with no separate frontend developer.
- Set up CI/CD (GitHub Actions) and containerization (Docker) — reproducible environments and automated deployment.

---

## RUTUBE — Python Developer

**09.2024 — 08.2025**

**Context:** primary Django (DRF) monolith + microservices on aiohttp and FastAPI; part of a 15-engineer team, independently owning my services.

- Optimized 10+ API endpoints (including high-load ones) based on Prometheus / Grafana monitoring: reworked ORM queries (`select_related`/`prefetch`, indexes), added Redis caching and rate limiting. Cut p95 latency from ~1 s to a stable <100 ms under horizontal scaling (~100 RPS per instance).
- Eliminated SQL queries running >10 minutes that caused critical DB load: logic refactoring + Django CTEs — execution time dropped to seconds.
- Established testing: migrated part of the suite to pytest (200+ tests), raising coverage from below 50%, with distributed CI/CD runs — faster pipeline and more reliable releases.
- Migrated API docs to OpenAPI 3.0: replaced the legacy `django-rest-swagger` with drf-spectacular, updated and documented 150+ endpoints — providing clear API contracts for the Go and frontend teams.
- Ran a security audit: fixed SQL injections and replaced unsafe libraries — at the intersection of backend and my information-security specialization (MEPHI).
- Unified Dockerfiles across 2 services and adopted the uv package manager — faster builds and easier onboarding.

---

## PSK NPO Mashinostroyeniya — Python Developer

**05.2023 — 08.2024**

- Built the backend of 4 corporate web projects (e-commerce, landing pages, informational sites) with Python / Django and PostgreSQL: user flows, catalogs, and admin panels — all shipped to production.
- Automated customer-request handling: server-side form processing with PostgreSQL storage and instant notifications — cut the business's response time to inquiries from several hours to 1–2 minutes.
- Integrated third-party services — payment gateways, web analytics, and email services: ensured correct payment processing and behavioral-data collection.
- Set up production infrastructure: hosting, domains, and SSL certificates (HTTPS) — secure access and uninterrupted site uptime.
- Optimized site load and response times (caching, SQL-query and static-asset optimization, image compression) — noticeably sped up page loads and improved stability.
- Built responsive interfaces (HTML / CSS / JavaScript): correct rendering across desktop and mobile devices.
- Maintained and evolved existing projects: extended functionality per business requirements and resolved production incidents.

---

## Freelance — Full-stack Developer

**2023 — Present**

- ters.gallery — a furniture online store (Django/DRF + Nuxt): catalog, cart, checkout. Live in production and generating revenue.
- I run every project solo: backend, frontend, infrastructure, and deployment.
- Also corporate sites and landing pages: estvel.ru, metamorphosis.moscow (closed), maison-stroy.ru.
