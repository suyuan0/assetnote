# AssetNote Architecture

- Status: baseline v1
- Last updated: 2026-08-20

## Purpose

This document defines AssetNote's durable system boundaries. It is intentionally small enough to guide everyday development while the product is young. Root and workspace `AGENTS.md` files translate these decisions into execution rules for coding agents.

The baseline favors explicit ownership, one-way dependencies, and runtime-validated boundaries. It does not require empty abstraction layers or speculative shared packages.

## System context

AssetNote currently contains two deployable applications:

- `apps/web`: the Next.js user experience and web delivery layer.
- `apps/api`: the NestJS backend and authority for business rules and persistent product data.

Shared packages provide reusable libraries and tooling to applications. They are not independently deployable runtimes or alternate application layers.

```text
Browser
   |
   v
apps/web -----------------------> packages/ui
   |
   | HTTP
   v
apps/api

apps/web -----\
               >---------------> packages/contracts (when introduced)
apps/api -----/

apps/* ------------------------> packages/*
packages/* ---------X----------> apps/*
apps/web ----------X-----------> apps/api source
apps/api ----------X-----------> apps/web source
```

## Workspace ownership

| Workspace                    | Owns                                                                               | Must not own                                                                   |
| ---------------------------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `apps/web`                   | Routes, presentation, interaction, web orchestration, API/session adapters         | Persistence, API business invariants, authorization policy, API implementation |
| `apps/api`                   | Use cases, business rules, authorization policy, persistence, backend integrations | Browser UI or web-framework concerns                                           |
| `packages/ui`                | Reusable product-agnostic React primitives and styling foundations                 | Product workflows, API access, auth policy, domain assumptions                 |
| `packages/eslint-config`     | Shared static-analysis policy                                                      | Application behavior                                                           |
| `packages/typescript-config` | Shared compiler defaults                                                           | Application behavior                                                           |
| `packages/contracts`         | Runtime transport schemas and inferred transport types, when created               | Domain entities, ORM models, framework decorators, UI behavior                 |

## Architecture invariants

1. Applications communicate through protocols, not source-code imports.
2. Applications may consume packages; packages never consume applications.
3. A workspace's internal source is private. Runtime/library packages expose public package exports; tooling packages expose documented configuration entrypoints.
4. The API is the authority for persistent product data and business invariants.
5. Every untrusted boundary is validated at runtime; TypeScript types do not replace validation.
6. Transport models, domain models, persistence models, and view models may resemble one another but are not the same ownership boundary.
7. Shared code is extracted for a stable boundary or real multi-consumer reuse, not anticipated reuse.

## Web baseline

The web application follows the Next.js App Router model.

- `app/` is the delivery and composition layer: routes, layouts, metadata, loading/error boundaries, and server-side page orchestration.
- Server Components are the default. Client Components are narrow interactive leaves.
- Product behavior may be grouped under `features/<feature>` when a feature becomes larger than route-local code.
- `lib/` contains technical boundaries such as a centralized API client, auth integration, and validated configuration.
- Generic UI primitives live in `@workspace/ui`; product-specific components remain in the web application.
- The web layer may orchestrate a user interaction, but it does not duplicate API-owned business decisions or access product persistence directly.

Backend calls pass through a centralized client boundary. That boundary owns base URL configuration, request policy, runtime response validation, and normalized errors. Components must not each invent those concerns.

## API baseline

The API is organized by product feature as real capabilities are added:

```text
src/
  modules/
    <feature>/
      presentation/    HTTP controllers and boundary DTO mapping
      application/     use cases, orchestration, ports
      domain/          business rules and domain models
      infrastructure/  persistence and third-party adapters
  common/              truly cross-cutting technical concerns
  app.module.ts        composition root
  main.ts              process/bootstrap configuration
```

Small features may begin with fewer directories. The responsibility and dependency direction still applies:

```text
presentation -> application -> domain
infrastructure -> application/domain ports
domain -> no NestJS, HTTP, ORM, or infrastructure dependency
```

Controllers remain thin, application providers coordinate use cases, domain code expresses business rules, and infrastructure implements outward-facing details. Feature-to-feature calls use an exported provider or explicit facade rather than deep imports.

## Authentication baseline

AssetNote currently authenticates its browser-only Web client with email and password. The API owns identity, password verification, platform authorization, and server-side sessions; the Web application only carries the session credential and presents the authenticated experience.

- Public registration is disabled. A controlled bootstrap operation creates the first super administrator, and invitation-based account creation will be added separately.
- Platform roles are `SUPER_ADMIN`, `ADMIN`, and `USER`. Invitation and administrative capabilities use explicit policy; future portfolio ownership or collaboration permissions remain resource-level concerns rather than additional platform roles.
- Passwords are stored only as Argon2id hashes behind an application-owned port.
- Authentication uses opaque, database-backed sessions with a fixed 24-hour lifetime. The browser receives the raw random token only through a protected cookie, while PostgreSQL stores only its hash.
- Authenticated requests resolve the current session and active user so logout, account disabling, and role changes take effect immediately.
- Prisma records, password hashes, and session credentials remain API infrastructure details and never become transport contracts.

The first account is created through the controlled [initial super administrator bootstrap operation](../operations/bootstrap-super-admin.md).

See [ADR 0002: Email/password authentication and server-side sessions](./decisions/0002-email-password-authentication-and-server-sessions.md) for the security, role, and session decisions.

## Shared contracts

`packages/contracts` is deliberately deferred until the first real Web/API feature needs a shared contract. When introduced, it will:

- contain framework-independent runtime schemas and types derived from them;
- describe transport payloads, not internal domain or persistence structures;
- be consumed through declared package exports by both applications;
- avoid imports from NestJS, Next.js, React, database libraries, or application source;
- require compatible API implementation and web consumption changes in the same pull request.

The schema library and versioning policy will be recorded when the package is introduced, based on actual requirements.

## Persistence baseline

PostgreSQL is the product relational database, and Prisma ORM 7 is the API-owned persistence toolkit. Prisma configuration, schema, migrations, generated client, database lifecycle code, and persistence adapters remain in `apps/api`. Application and domain code do not depend on Prisma runtime types.

See [ADR 0001: PostgreSQL and Prisma ORM 7](./decisions/0001-postgresql-and-prisma-7.md) for the decision and operating constraints.

## When to add a boundary

- Add an application only for an independently deployable runtime with distinct ownership.
- Add a package only when it represents a stable boundary or serves multiple workspaces.
- Add an API feature module for a cohesive product capability, not one module per technical class.
- Add a cross-cutting abstraction only after at least one concrete use makes its interface clear.
- Document the rationale before changing dependency direction, data ownership, authentication strategy, persistence technology, or the responsibility of a shared package. Durable architecture changes require an ADR under `docs/architecture/decisions`; update this overview in the same change when the system baseline or boundaries change.

## Enforcement roadmap

Declarative guardrails are converted into executable controls incrementally.

The Web application and UI package self-references now resolve `@workspace/ui` through package exports. The UI stylesheet explicitly scans only UI-owned source; Tailwind's Web build context scans application source. `apps/web/components.json` deliberately points to the UI stylesheet as shadcn monorepo generator metadata, not as a runtime import or permission to consume other package internals.

Workspace dependency enforcement is now executable. `pnpm boundaries:check` first validates that every non-root pnpm workspace is directly under `apps/` or `packages/`, has a local `turbo.json` with `"extends": ["//"]`, and carries exactly the tag required by its layer. It then runs Turbo Boundaries: `layer-app` workspace dependencies may target only `layer-package`, while `layer-package` workspace dependencies may not target `layer-app`. `pnpm verify` includes this check. CI enforcement is intentionally deferred by the current project decision.

| Concern                     | Declarative control now                   | Executable control / status                                                                                                                                                             |
| --------------------------- | ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Workspace dependency flow   | Architecture plus layered `AGENTS.md`     | Implemented: `pnpm boundaries:check` validates workspace layout/tags, allows `layer-app` dependencies only on `layer-package`, and prevents `layer-package` dependencies on `layer-app` |
| Framework-local conventions | Workspace `AGENTS.md`                     | Implemented: `pnpm verify` runs all available lint, typecheck, tests, and builds                                                                                                        |
| Formatting                  | Agent workflow                            | Implemented: `pnpm format:check`                                                                                                                                                        |
| API behavior                | API instructions and existing Jest suites | Implemented: root unit and uncached e2e tests through `pnpm verify`                                                                                                                     |
| Merge quality               | Local verification guidance               | Local gate implemented through `pnpm verify`; CI enforcement intentionally deferred                                                                                                     |

An architecture rule is not considered fully enforced merely because it is documented. Until its executable control is added, agents must report manual compliance explicitly.

## Changing this architecture

An intentional exception or architecture change must be visible. Update this document when system boundaries or baselines change, update affected `AGENTS.md` files only when execution rules change, and explain the tradeoff in the change handoff. Durable architecture changes require an Architecture Decision Record under `docs/architecture/decisions`. Do not silently route around a boundary to finish a feature.
