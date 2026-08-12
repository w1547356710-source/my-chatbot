# my-nextjs-agent

pnpm monorepo containing a Next.js application, an independently deployable LangGraph service,
and reusable Agent packages.

## Getting Started

Install dependencies:

```bash
pnpm install
```

Run the Next.js app:

```bash
pnpm dev
```

Run the LangGraph agent dev server:

```bash
pnpm agent:dev
```

## Structure

- `apps/web`: Next.js app, routes, UI, Auth, DB, and Drizzle migrations.
- `apps/agent`: independently deployable LangGraph service containing Agent core, RAG, tools,
  and shared Agent types.
- `packages/config`: centralized environment access helpers.
- `docs/repo-ownership.md`: ownership and Git permission model.

Package dependencies flow in one direction:

```text
apps/web ──────> apps/agent package exports
apps/agent ────> core + rag + tools + shared ────> packages/config
```

Copy each app's `.env.example` to `.env` and provide local values. Environment files are never
committed.

## Common Commands

```bash
pnpm build
pnpm lint
pnpm typecheck
pnpm test
pnpm db:generate
pnpm db:migrate
```

## Ownership

Use `.github/CODEOWNERS` and branch protection for review separation. If strict Git read/write isolation is required, use Git submodules or separate repositories.
