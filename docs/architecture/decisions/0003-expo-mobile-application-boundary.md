# ADR 0003: Expo mobile application boundary

- Status: Accepted
- Implementation: Implemented
- Date: 2026-08-28

## Context

AssetNote plans to add an iOS and Android client alongside the existing Next.js Web application. The Mobile client is an independently delivered runtime with native navigation, device integration, release tooling, and credential-storage concerns that differ from the browser.

The repository already enforces one-way workspace dependencies and protocol-based communication between applications. Its current `@workspace/ui` package is implemented with React DOM, Base UI, Tailwind CSS, and browser-oriented theming, so treating it as a universal React Native component library would obscure a real platform boundary.

The existing authentication surface is also intentionally browser-specific: it transports an opaque session credential in a protected cookie and applies exact-origin controls. Introducing a Mobile client must not silently weaken those controls or assume that browser credential transport works unchanged on a native device.

## Decision

- The Mobile client will be introduced as the independently deployable `apps/mobile` workspace with package name `mobile`. Expo is its framework; `mobile` describes the product runtime and remains the workspace name if framework details change.
- The application will use Expo Router. Route and layout files belong in `src/app`; product features, non-route components, hooks, configuration, and adapters remain outside the route tree.
- Product-specific Mobile code remains in `apps/mobile`. As responsibilities appear, they follow this layout without creating empty directories:

  ```text
  src/
    app/          Expo Router routes and layouts only
    features/     product-specific Mobile behavior and presentation
    components/   application-local native components
    lib/
      api/        centralized AssetNote HTTP client boundary
      auth/       Mobile credential transport and storage adapter
      config/     validated public runtime configuration
  ```

- `apps/mobile` communicates with `apps/api` through HTTP. It must not import application source, persistence code, API framework objects, or backend integrations.
- `@workspace/ui` remains a Web-only package and is not a dependency of `apps/mobile`. Native components remain application-local until a stable boundary or a second native consumer justifies extraction. Shared design tokens may be considered separately; Web CSS and DOM components are not portable design tokens.
- `packages/contracts` will be introduced with the first real client/API transport contract, not with an empty Mobile scaffold. It will contain framework-independent runtime schemas and inferred transport types. API clients, navigation, credential storage, and view models remain application-specific.
- This decision amends only ADR 0002's Web-specific trigger for creating `packages/contracts`: the first real transport boundary may now be introduced by either Web or Mobile consuming the API. ADR 0002's authentication, authorization, and session decisions remain unchanged.
- Mobile code must not call stock-market providers or their networking SDKs directly. It consumes normalized AssetNote API operations.
- The workspace uses the repository's pnpm and Turborepo setup. It must define a local `turbo.json` extending the root configuration with the application layer tag and expose non-interactive lint, typecheck, and build tasks to the root verification graph.
- Expo and React Native dependency versions follow the selected Expo SDK and are installed with Expo-compatible tooling. The Web application's React version is not forced onto Mobile merely for repository-wide version uniformity.
- Expo's supported monorepo defaults are used before adding custom Metro resolution. Native project directories or custom development builds are introduced only when a required native capability makes them necessary.
- Only non-secret client configuration may use `EXPO_PUBLIC_` variables. Mobile credentials, provider secrets, and privileged configuration must never be embedded in the application bundle.
- Adding protected Mobile features requires a separate accepted credential-transport decision. The implementation must preserve the existing Web cookie/origin/CSRF protections and must not introduce JWT, Bearer credentials, refresh tokens, or relaxed origin checks as an incidental scaffolding change.
- When the workspace is created, the same change must add `apps/mobile/AGENTS.md`, update the repository's current-state documentation, and add proportionate Mobile checks to `pnpm verify` through workspace scripts.

## Consequences

AssetNote will have two presentation implementations rather than forcing Web and Native UI through one abstraction. This duplication is intentional where platform interaction differs; transport contracts and proven platform-independent logic remain the available reuse boundaries.

The Mobile application can evolve and ship independently while the API remains the authority for business rules, authorization, persistence, and external data integration. Local development gains an additional Metro/Expo process and native dependency graph, so dependency alignment and Expo diagnostics become part of Mobile dependency changes.

Mobile authentication remains blocked until its credential transport is reviewed. An unauthenticated shell or public API feature may be implemented first, but an agent must not bypass the browser-oriented guards to make login appear functional.

## Deferred decisions

- Mobile session credential transport, storage, expiration, revocation, and device-session behavior
- EAS project ownership, signing, store submission, deployment environments, and update channels
- Bundle identifiers, deep-link scheme, universal/app links, and push notification policy
- Offline data policy, client cache persistence, background tasks, and synchronization
- Native end-to-end test tooling
- Shared design-token or Native UI packages
- Any native module or custom development-build requirement

## References

- [Expo monorepos](https://docs.expo.dev/guides/monorepos/)
- [Expo Router core concepts](https://docs.expo.dev/router/basics/core-concepts/)
- [Expo environment variables](https://docs.expo.dev/guides/environment-variables/)
