# AssetNote Mobile

AssetNote's iOS and Android application, built with Expo SDK 57, React Native,
and Expo Router.

## Development

Install dependencies once from the repository root:

```bash
pnpm install
```

Start Metro from the repository root:

```bash
pnpm --filter mobile dev
```

Then open the project in an iOS simulator or Android emulator. SDK 57 may
require a matching Expo Go client rather than the public app-store build during
Expo's SDK transition period.

## Structure as features appear

- `src/app`: Expo Router route and layout files only.
- `src/features`: product behavior when a feature is introduced.
- `src/components`: application-local Native UI.
- `src/lib`: API, configuration, authentication, and other technical adapters.

These directories are conventions, not empty scaffolding requirements. See
[`AGENTS.md`](./AGENTS.md) and
[`docs/architecture/overview.md`](../../docs/architecture/overview.md) before
adding a feature.

## Verification

```bash
pnpm --filter mobile lint --max-warnings=0
pnpm --filter mobile typecheck
pnpm --filter mobile build
pnpm dlx expo-doctor@latest apps/mobile
```
