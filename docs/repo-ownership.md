# Monorepo ownership and permission model

## Package boundaries

- `apps/web`: Next.js application, UI, routes, Auth, DB schema, Drizzle migrations, and Web-owned services.
- `apps/agent`: LangGraph runtime, Agent orchestration, RAG, tools, and shared Agent types.
- `packages/config`: platform-owned configuration helpers shared by applications.
- Root: pnpm workspace orchestration, formatting, Git hooks, and repository-level docs.

## Git permissions

This repository is now a pnpm monorepo. Git itself does not provide true read/write permissions per folder inside one repository.

Use `.github/CODEOWNERS` plus branch protection for review ownership:

- Require code-owner review before merging changes under `apps/web`.
- Require code-owner review before merging changes under `apps/agent`.
- Restrict direct pushes to protected branches.

If teams must have strict repository-level read/write isolation, use one of these models instead:

- Keep this root repository as an orchestrator and mount `apps/web` and `apps/agent` as Git submodules.
- Split Web and Agent into separate repositories, publish Agent as a package, and consume it from Web through a package registry.

## Extension rules

- Add new Next.js surfaces under `apps/*`.
- Add new Agent implementations under `apps/agent/src/core/agents`.
- Add Agent-specific capabilities under `apps/agent/src/rag` or `apps/agent/src/tools`.
- Keep only cross-application configuration helpers under `packages/config`.
- Keep imports directional: apps may depend on packages, but packages must not import from apps.
