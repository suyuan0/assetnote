import { defineConfig, globalIgnores } from "eslint/config"
import expoConfig from "eslint-config-expo/flat.js"

export default defineConfig([
  expoConfig,
  globalIgnores([".expo/**", "dist/**"]),
  {
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@workspace/ui", "@workspace/ui/*"],
              message:
                "@workspace/ui is Web-only. Keep React Native UI inside apps/mobile.",
            },
            {
              group: ["stock-sdk", "stock-sdk/*"],
              message:
                "Market-data providers are API-owned backend integrations.",
            },
            {
              regex:
                "^(?:(?:\\.\\./)+(?:api|web)|(?:apps/)?(?:api|web))(?:/|$)",
              message:
                "Applications communicate through HTTP and must not import another application.",
            },
          ],
        },
      ],
    },
  },
])
