# API Application Instructions

These rules apply to `apps/api` in addition to the repository instructions.

## Responsibilities

- The API owns product use cases, business invariants, authorization policy, persistence, and backend business integrations.
- `AppModule` composes feature modules and application-wide infrastructure. Each feature module wires its own providers and adapters; `main.ts` contains process/bootstrap concerns only.
- Organize real product capabilities by feature under `src/modules/<feature>`. Start with a cohesive Nest feature module and providers. Introduce presentation, application, domain, and infrastructure subdirectories only when those responsibilities are distinct; preserve their dependency direction as the feature grows.

## Feature dependency direction

Within a feature, dependencies point in this direction:

```text
presentation/transport -> application -> domain
infrastructure --------> application/domain ports
feature module --------> its providers and concrete adapters
AppModule -------------> feature modules and app-wide infrastructure
```

- Controllers handle transport concerns: validated input, authentication/context extraction, use-case invocation, and response mapping.
- Application providers orchestrate use cases and transaction boundaries.
- Domain code contains business rules and must not depend on NestJS, HTTP, an ORM, or infrastructure libraries.
- Infrastructure adapters implement ports owned by the application or domain layer. Do not call persistence or third-party SDKs directly from controllers.
- Cross-feature collaboration goes through exported providers or an explicit public facade, never deep imports into another feature's internals.

## Contracts and errors

- Validate every external input at runtime. Static TypeScript types alone are not input validation.
- Transport DTOs/contracts are not domain entities. Map explicitly at the boundary and never return ORM entities directly.
- When `@workspace/contracts` exists, use it only for transport schemas/types; keep Nest decorators, persistence models, and business behavior inside the API.
- Translate domain/application failures into HTTP responses at the transport boundary or a centralized exception filter.
- Keep the global prefix, CORS, validation, filters, and other bootstrap policy centralized rather than reconfigured per feature.

## Configuration and dependencies

- Centralize and validate new environment configuration. Do not add scattered `process.env` access.
- Never import from another application or `@workspace/ui`.
- Add backend/domain SDKs to `apps/api`. Browser or web-delivery SDKs belong in `apps/web`; neither placement moves authorization policy out of the API.

## External market data

- Stock-market provider networking belongs to the owning feature's infrastructure layer behind an application- or domain-owned port. Controllers, application providers, and domain code must not import `stock-sdk` or another concrete provider SDK directly.
- Convert vendor responses and errors to AssetNote-owned models and failures inside the adapter. Vendor types, raw payloads, provider URLs, and SDK errors must not cross the port or become HTTP contracts.
- Expose narrow use cases with runtime-validated symbols, markets, date ranges, and batch limits. Never expose an arbitrary upstream URL relay or generic SDK method proxy.
- Require bounded inputs, explicit timeouts, normalized errors, and safe provider observability. Retry, rate-limit, circuit-breaker, cache, request-coalescing, and fallback policy remain API-owned but are added only when a concrete reliability or scale requirement justifies them; do not treat SDK defaults as product policy.
- Do not persist external market data by default. Durable snapshots, historical ingestion, alerts, or audits require explicit provenance, retention, licensing, and query requirements.
- Keep deterministic tests independent of live providers through fakes, controlled fixtures, or an injected network implementation. Real-network smoke checks are opt-in and remain outside `pnpm verify`.
- When the first provider is integrated, add an executable restricted-import rule in the same change so only its owning infrastructure adapter may import the SDK.

## Verification

- Run `pnpm --filter api lint` and `pnpm --filter api typecheck` for code changes.
- Run `pnpm --filter api test` for business behavior changes.
- Run `pnpm --filter api test:e2e` for controllers, pipes, filters, bootstrap policy, or HTTP contract changes.
- Run `pnpm --filter api build` for module wiring, configuration, dependency, or compilation changes.
