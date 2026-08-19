# Shared UI Package Instructions

These rules apply to `packages/ui` in addition to the repository instructions.

## Package purpose

- This package contains reusable, product-agnostic React primitives, styling foundations, and small UI hooks.
- It must not contain AssetNote business workflows, API calls, authentication policy, persistence logic, or feature-specific state.
- Keep a component server-compatible by default. Add `"use client"` only when its own implementation requires client capabilities.

## Public API and dependencies

- Consumers import only declared `@workspace/ui` exports. Keep `package.json` exports aligned with public files.
- Never depend on an application or import application source. Avoid depending on transport contracts or product-domain packages.
- Keep dependencies minimal and UI-focused. Do not introduce data-fetching or application-state libraries here.
- Prefer composable props and slots over hard-coded product text, routes, analytics, or domain assumptions.

## Component quality

- Preserve semantic HTML, accessible names, keyboard behavior, focus visibility, disabled states, and ref forwarding where applicable.
- Follow the existing styling and variant conventions. Reuse shared utilities instead of duplicating class-merging logic.
- A public API change must update every in-repository consumer in the same change.

## Verification

- Run `pnpm --filter @workspace/ui lint` and `pnpm --filter @workspace/ui typecheck` for code changes.
- Run the consuming web application's checks when changing component behavior, exports, styles, or package dependencies.
