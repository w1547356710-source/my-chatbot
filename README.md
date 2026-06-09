# my-nextjs-agent

pnpm monorepo containing a Next.js app and an independently owned Agent package.

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

- `apps/web`: Next.js 16 app, routes, UI, Auth, DB, and Drizzle migrations.
- `packages/agent`: LangChain/LangGraph agent code, tools, models, and graph config.
- `docs/repo-ownership.md`: ownership and Git permission model.

## Common Commands

```bash
pnpm build
pnpm lint
pnpm typecheck
pnpm db:generate
pnpm db:migrate
```

## Ownership

Use `.github/CODEOWNERS` and branch protection for review separation. If strict Git read/write isolation is required, use Git submodules or separate repositories.
