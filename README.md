# DeLaw

**African Law. Intelligently Practiced.**

DeLaw is a pan-African, AI-native legal practice platform for law firms,
chambers, corporate legal departments, individual lawyers, and judiciary
institutions across Africa. This repository is the single source of truth for
all development work, governed by `DeLaw_Technical_Specification_v1.0.docx`.

## Monorepo structure (spec §2.4)

This is a [Turborepo](https://turbo.build/repo) monorepo using
[pnpm workspaces](https://pnpm.io/workspaces).

```
delaw/
  apps/
    web/              # Next.js 14 (App Router) frontend — TypeScript + Tailwind
    api/              # Node.js + Fastify API — business logic, auth, data
    ai-service/       # Python + FastAPI — RAG pipeline, embeddings, LLM orchestration
  packages/
    db/               # Drizzle ORM schema + migrations (shared)
    types/            # Shared TypeScript types (Zod schemas)
    config/           # Shared ESLint, TypeScript, and Tailwind configs
    ui/               # Shared component library (shadcn-based)
  infrastructure/
    docker/           # Docker Compose for local dev + on-premise
```

### Workspaces

| Package          | Path                  | Description                                      |
| ---------------- | --------------------- | ------------------------------------------------ |
| `@delaw/web`     | `apps/web`            | Next.js 14 App Router frontend                   |
| `@delaw/api`     | `apps/api`            | Fastify API (TypeScript)                         |
| _delaw-ai-service_ | `apps/ai-service`   | FastAPI AI service (Python — not a pnpm package) |
| `@delaw/db`      | `packages/db`         | Drizzle ORM schema, client, migrations           |
| `@delaw/types`   | `packages/types`      | Shared TypeScript types                          |
| `@delaw/config`  | `packages/config`     | Shared ESLint / TypeScript / Tailwind config     |
| `@delaw/ui`      | `packages/ui`         | Shared component library                         |

> The `apps/ai-service` directory is a Python project and is intentionally
> excluded from the pnpm workspace (it has no `package.json`).

## Tech stack (spec §14.1)

- **Frontend:** Next.js 14+, TypeScript, Tailwind CSS, shadcn/ui
- **API:** Node.js 20 LTS, Fastify, TypeScript, Drizzle ORM
- **AI service:** Python 3.12, FastAPI, LangChain, Anthropic + OpenAI SDKs
- **Data:** PostgreSQL 16 + pgvector, Redis, Cloudflare R2
- **Tooling:** Turborepo, pnpm, ESLint, Prettier

## Prerequisites

- [Node.js](https://nodejs.org/) 20+
- [pnpm](https://pnpm.io/) 9+ (`npm install -g pnpm`)
- [Python](https://www.python.org/) 3.12+ (for `apps/ai-service`)

## Getting started

```bash
# 1. Install JS/TS workspace dependencies
pnpm install

# 2. Configure environment
cp .env.example .env   # then fill in real values

# 3. Run everything in dev
pnpm dev
```

### AI service (Python)

```bash
cd apps/ai-service
python -m venv .venv
source .venv/bin/activate    # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

## Root scripts

| Command           | Description                                  |
| ----------------- | -------------------------------------------- |
| `pnpm dev`        | Run all apps in development (Turborepo)      |
| `pnpm build`      | Build all apps and packages                  |
| `pnpm lint`       | Lint all workspaces                          |
| `pnpm typecheck`  | Type-check all workspaces                    |
| `pnpm format`     | Format the repo with Prettier                |

## Design system

The product UI follows the established DeLaw design system (dark theme only for
v1). Tokens — colours, typography (Inter / Source Serif 4 / JetBrains Mono),
spacing, and radii — are encoded in `packages/config/tailwind/preset.ts` and
mirror the reference designs in the project's HTML exports.
