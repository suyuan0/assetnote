# ADR 0004: Stock market data provider boundary

- Status: Accepted
- Implementation: Planned
- Date: 2026-08-28

## Context

AssetNote plans to add market-data capabilities using the third-party `stock-sdk` package, which aggregates public upstream interfaces including Tencent Finance, East Money, and Sina Finance. The exact product operations remain deferred until the first feature is defined.

Although `stock-sdk` supports browser and Node.js runtimes, the upstream interfaces have different cross-origin behavior, availability, field shapes, and freshness. React Native is not an explicitly supported runtime. Allowing every client to call those providers would duplicate traffic policy, expose provider details to product surfaces, and couple transport contracts to a replaceable third-party library.

The API already owns business invariants and backend integrations. The integration therefore needs an anti-corruption boundary that keeps provider-specific types, errors, availability, and data-quality behavior outside application and transport models.

## Decision

- `stock-sdk` will be added as an exact-version runtime dependency of `apps/api` only. It will not be copied into the repository, installed at the repository root, added as a Git submodule, or wrapped in a workspace package for its first and only backend consumer.
- The integration belongs to a cohesive `market-data` feature under `apps/api/src/modules`. The feature starts with only the responsibility directories it needs; it must not create empty layers to satisfy a template.
- The application layer owns a provider port and AssetNote market-data models. A `stock-sdk` adapter in the feature's infrastructure layer implements that port. Only that owning infrastructure adapter may import the SDK's networking surface.
- Controllers and use cases do not call `stock-sdk` directly. They expose narrow product operations with explicit input limits rather than a generic SDK method proxy or arbitrary upstream URL relay.
- SDK response types, provider payloads, and `SdkError` values remain infrastructure details. The adapter maps them to AssetNote-owned values and failures before they cross the port. HTTP contracts likewise remain provider-neutral.
- Transport responses that represent external market data make source and freshness semantics explicit where the upstream supports them. The product must not present delayed public data as an exchange-grade real-time feed or as execution-grade trading data.
- The first adapter requires validated symbols and markets, bounded date ranges and batches, explicit timeouts, normalized errors, and safe observability. Retry, provider rate-limit, circuit-breaker, cache, request-coalescing, and fallback policies remain API-owned but are added only when concrete reliability or scale requirements justify them. SDK defaults do not silently become product policy.
- Market data is not persisted in PostgreSQL by default. A product requirement for durable snapshots, historical ingestion, alerts, or auditability must define retention, provenance, licensing, and query requirements before adding persistence.
- Unit and use-case tests replace the provider port with deterministic fakes. Adapter tests use controlled fixtures or an injected fetch implementation. Tests that call real upstream services are opt-in smoke checks and must not be part of the deterministic `pnpm verify` gate.
- SDK upgrades are deliberate: review the upstream release and provider behavior, update the exact version, run adapter tests, and execute an explicit live smoke check when network access is authorized.
- Web and Mobile applications consume the AssetNote HTTP API and never depend on the SDK's networking entrypoint. They must not expose provider credentials, raw provider URLs, or vendor-specific response types.

## Production readiness gates

- Review the terms, attribution requirements, caching limits, display rights, and redistribution rights of every upstream data source. The SDK's source-code license does not grant rights to third-party market data.
- Define acceptable freshness, outage behavior, provider fallback, user-facing delay disclosure, and observability before relying on the integration in production.
- Confirm that the selected provider model is appropriate for the product's jurisdictions and intended commercial use. Replace the adapter with a licensed provider when required without changing client contracts.
- Apply API-level abuse controls so clients cannot turn AssetNote into an unrestricted public proxy for upstream services.

## Consequences

Clients incur an extra API hop, but provider instability, compatibility work, rate limits, caching, and compliance policy are centralized. AssetNote owns a stable contract and can replace `stock-sdk` or individual data providers without requiring Web and Mobile to adopt vendor types or APIs.

The API becomes responsible for an external availability boundary. It must distinguish invalid requests, upstream unavailability, timeouts, and stale or delayed data rather than returning ambiguous empty success responses.

Avoiding immediate persistence keeps the first integration small and prevents PostgreSQL from becoming an accidental market-data cache. Durable historical data remains a separate product and data-model decision.

## Deferred decisions

- Initial market-data endpoints and their authorization requirements
- Cache implementation, TTLs, invalidation, and multi-replica coordination
- Licensed production provider and contractual service level
- Persistent quote snapshots, historical ingestion, or time-series storage
- Streaming subscriptions, WebSockets, and background refresh
- Provider fallback order and reconciliation across conflicting sources

## References

- [`stock-sdk` repository](https://github.com/chengzuopeng/stock-sdk)
- [`stock-sdk` browser guidance](https://stock-sdk.linkdiary.cn/guide/browser)
- [`stock-sdk` request governance](https://stock-sdk.linkdiary.cn/guide/request-governance)
- [`stock-sdk` ISC license](https://github.com/chengzuopeng/stock-sdk/blob/master/LICENSE)
