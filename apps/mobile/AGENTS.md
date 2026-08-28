# AssetNote Mobile Instructions

## Scope

- These instructions apply to `apps/mobile`.
- Read the repository `AGENTS.md`, `docs/architecture/overview.md`, and ADR 0003
  before changing this workspace.
- `apps/mobile` is the independently delivered Expo/React Native client for iOS
  and Android. It is not a shared package or an extension of `apps/web`.

## Boundaries

- Never import `apps/web`, `apps/api`, another application's source, or
  `@workspace/ui`.
- Communicate with `apps/api` only through explicit HTTP contracts. Do not read
  PostgreSQL, Prisma code, NestJS objects, or backend configuration directly.
- Do not import `stock-sdk` or call market-data providers from Mobile. Provider
  networking is owned by the API.
- Consume shared workspaces only through declared public package entrypoints.
- Keep product-specific Native code in this application. Do not create a shared
  package until a stable boundary or demonstrated second consumer exists.

## Expo Router and source layout

- `src/app` contains route, layout, and Expo Router special files only. Every
  ordinary route file has a default-exported React component.
- Put product behavior under `src/features`, application-local Native UI under
  `src/components`, and technical adapters under `src/lib` as those
  responsibilities actually appear. Do not create empty architecture folders.
- Prefer kebab-case filenames. Use function declarations for named and exported
  React components; use arrow functions for callbacks and inline factories.
- Keep route components focused on screen composition. Centralize API base URL,
  request policy, response validation, and normalized errors in one Mobile API
  client boundary when the first API feature is added.

## Native engineering rules

- Install Expo and React Native libraries with the Expo CLI so versions stay
  compatible: `pnpm --filter mobile exec expo install <package>`.
- Keep the SDK-selected React and React Native versions. Do not align them with
  Web dependencies unless Expo's compatibility matrix requires it.
- Use Expo's automatic monorepo Metro configuration. Add `metro.config.js`,
  generated `ios/` or `android/` directories, or a custom development build only
  for a concrete native requirement and document that requirement.
- Start with Expo Go or the matching simulator client for supported features.
  Validate on a development/release build before shipping native-only behavior.
- Only non-secret values may use `EXPO_PUBLIC_` variables. Read them through a
  validated configuration boundary; never embed API secrets or provider keys.
- Protected Mobile features are blocked until a separate authentication ADR is
  accepted. Do not store or transport credentials or weaken the Web cookie,
  origin, CORS, or CSRF controls as a workaround.
- Use React Native primitives and platform APIs. Account for safe areas,
  accessibility labels/roles, text scaling, dark mode, loading/error/empty
  states, keyboard behavior, and both supported platforms when relevant.

## Verification

- For Mobile changes, run:

  ```bash
  pnpm --filter mobile lint --max-warnings=0
  pnpm --filter mobile typecheck
  pnpm --filter mobile build
  ```

- Run `pnpm dlx expo-doctor@latest apps/mobile` after dependency or Expo
  configuration changes.
- Add focused tests with the first behavior that has meaningful outcomes. Do not
  add a pass-with-no-tests script merely to make the root test graph appear green.
- Before handing off code changes, run the root `pnpm verify` gate.
