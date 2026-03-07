import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import simpleImportSort from "eslint-plugin-simple-import-sort";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,

  // ── Import ordering (matches CODEX rule 9) ─────────────────────────────────
  {
    plugins: { "simple-import-sort": simpleImportSort },
    rules: {
      "simple-import-sort/imports": [
        "warn",
        {
          groups: [
            // 1. React
            ["^react$", "^react/", "^react-dom"],
            // 2. Next.js
            ["^next(/|$)"],
            // 3. Third-party packages
            ["^@?\\w"],
            // 4. shadcn UI components
            ["^@/components/ui(/|$)"],
            // 5. Local components (features + shared components)
            ["^@/features/", "^@/shared/components/", "^@/components/"],
            // 6. Lib, hooks, state, queries
            ["^@/shared/lib/", "^@/shared/hooks/", "^@/shared/state/", "^@/server/"],
            // 7. Data and types
            ["^@/data/", "^@/types/"],
            // 8. Relative imports
            ["^\\."],
          ],
        },
      ],
      "simple-import-sort/exports": "warn",
    },
  },

  // ── Ignore build artifacts and generated code ──────────────────────────────
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "dist/**",
    "electron/**",
    "prisma/**",
    "src/generated/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
