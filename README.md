# Wera Admin

[![CI](https://github.com/wera-jobs/wera-admin/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/wera-jobs/wera-admin/actions/workflows/ci.yml)
[![Coverage](https://img.shields.io/endpoint?url=https://raw.githubusercontent.com/wera-jobs/wera-admin/badges/coverage.json)](https://github.com/wera-jobs/wera-admin/actions/workflows/ci.yml)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)](tsconfig.json)
[![Conventional Commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-fe5196?logo=conventionalcommits&logoColor=white)](https://www.conventionalcommits.org)
[![License: proprietary](https://img.shields.io/badge/license-proprietary-lightgrey)](LICENSE)

Private admin console for [Wera](https://github.com/wera-jobs/Wera). Talks only to `/api/admin/*` using an admin browser session, with every change recorded in an audit log. User-facing pages live in [Wera-Frontend](https://github.com/wera-jobs/Wera-Frontend).

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/architecture-dark.svg">
  <img alt="Wera Admin architecture: your browser reaches wera-admin (nginx on 127.0.0.1, no public port) through an SSH tunnel; it calls the API admin routes, which check the admin role on every call; PostgreSQL records every change in an audit log" src="docs/architecture.svg">
</picture>

## What it does

- **Overview:** Live user counts, open/new jobs, pending scores, monthly AI spend (with cap warnings on every page), last pipeline run, email status, and a **Needs attention** queue. Auto-refreshes every 30s.
- **Users:** Search and filter accounts, edit name or monthly AI budget, toggle admin role, sign out everywhere, or delete with email confirmation.
- **Runs & AI usage:** Pipeline history, manual **Run now** trigger, daily token/cost charts, cache hit rate, and per-user spend.
- **Traffic & Companies:** Cookieless site traffic metrics and per-company fetch health (failures first).
- **Reports & Community:** Review extension problem reports and moderate community posts/comments (publish, hide, delete).
- **Email & Audit log:** Preview templates (HTML/text, desktop/mobile), send test emails, inspect the outbox, and review all admin actions.

## Run it

Grant admin access on the server:

```sh
docker exec wera-api /app/wera users admin --email you@example.com
```

Local development (against a Wera API on `:8080`, or set `WERA_API`):

```sh
npm install
npm run dev         # http://localhost:5175
```

Quality checks:

```sh
npm run lint && npm run typecheck && npm test
```

## Deploy

Built as `wera-admin` from `../wera/docker-compose.yml` on port `3001`. Nginx restricts access to private networks (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, localhost); never expose it through a public tunnel.

## Stack

React 19, TypeScript 6 (strict), Vite 8, Tailwind CSS 4, TanStack Query, React Router, Recharts, Vitest, Testing Library.

Commits follow [Conventional Commits](https://www.conventionalcommits.org); [release-please](https://github.com/googleapis/release-please) cuts releases and publishes `ghcr.io/wera-jobs/wera-admin`.

## License

Copyright (c) 2026 Wera. All rights reserved. This code is proprietary: it is visible here, but that grants no right to use, copy, modify or distribute it (see [LICENSE](LICENSE)). The Wera name and logo are trademarks of Wera. Third-party packages keep their own licenses, listed in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md); regenerate it with `node scripts/third-party-notices.mjs` after changing dependencies.
