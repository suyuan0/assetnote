# AssetNote Architecture

- Status: baseline v1
- Last updated: 2026-08-19

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

## Shared contracts

`packages/contracts` is deliberately deferred until the first real Web/API feature needs a shared contract. When introduced, it will:

- contain framework-independent runtime schemas and types derived from them;
- describe transport payloads, not internal domain or persistence structures;
- be consumed through declared package exports by both applications;
- avoid imports from NestJS, Next.js, React, database libraries, or application source;
- require compatible API implementation and web consumption changes in the same pull request.

The schema library and versioning policy will be recorded when the package is introduced, based on actual requirements.

## When to add a boundary

- Add an application only for an independently deployable runtime with distinct ownership.
- Add a package only when it represents a stable boundary or serves multiple workspaces.
- Add an API feature module for a cohesive product capability, not one module per technical class.
- Add a cross-cutting abstraction only after at least one concrete use makes its interface clear.
- Document the rationale before changing dependency direction, data ownership, authentication strategy, persistence technology, or the responsibility of a shared package. Until the ADR mechanism exists, update this overview in the same change.

## Enforcement roadmap

Declarative guardrails are converted into executable controls incrementally.

Known baseline gaps scheduled for the remaining hardening steps are the Web TypeScript path mapping that resolves `@workspace/ui/*` directly to package source, the UI stylesheet's invalid outward Tailwind source path, and the absence of CI. Tailwind content scanning must remain an application responsibility; fixing the path must not create a package-to-application dependency.

| Concern                     | Declarative control now                   | Executable control / status                                                      |
| --------------------------- | ----------------------------------------- | -------------------------------------------------------------------------------- |
| Workspace dependency flow   | Architecture plus layered `AGENTS.md`     | Planned: Turbo Boundaries and/or ESLint import restrictions                      |
| Framework-local conventions | Workspace `AGENTS.md`                     | Implemented: `pnpm verify` runs all available lint, typecheck, tests, and builds |
| Formatting                  | Agent workflow                            | Implemented: `pnpm format:check`                                                 |
| API behavior                | API instructions and existing Jest suites | Implemented: root unit and uncached e2e tests through `pnpm verify`              |
| Merge quality               | Local verification guidance               | Partially implemented: local `pnpm verify`; CI enforcement planned               |

An architecture rule is not considered fully enforced merely because it is documented. Until its executable control is added, agents must report manual compliance explicitly.

## Changing this architecture

An intentional exception or architecture change must be visible. Update this document, update affected `AGENTS.md` files only when execution rules change, and explain the tradeoff in the change handoff. Once the ADR mechanism is introduced, durable architecture changes also require an Architecture Decision Record. Do not silently route around a boundary to finish a feature.
