/**
 * ESLint flat config — @claw-dashboard/web
 *
 * Structure (equivalent to extends + rules in legacy .eslintrc):
 *   0. Base presets     — Next.js core-web-vitals + TypeScript + Storybook
 *   1. Product rules    — logic, import, React, Promise (error)
 *   2. Architecture     — layer boundaries: utils / lib/api / hooks / UI
 *   3. Storybook        — storybook/no-renderer-packages (warn)
 *   4. Relaxations      — story / script / mock / test (§7.3)
 *
 * Policy: .agent/rule.md §9 · Config: eslint.config.mjs
 */

import storybook from "eslint-plugin-storybook";
import reactWebApi from "eslint-plugin-react-web-api";

import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// =============================================================================
// Constants
// =============================================================================

const FILES_ALL = ["**/*.{js,jsx,ts,tsx}"];
const FILES_TS = ["**/*.{ts,tsx}"];
const FILES_TSX = ["**/*.tsx"];

/** Skip typed lint (Promise rules) — §7.3. Test specs still use typed lint. */
const TYPED_LINT_IGNORES = [
  "**/*.stories.{ts,tsx}",
  "**/*.story-controls.ts",
  "**/*.decorators.{ts,tsx}",
  "scripts/**",
  "lib/api/mocks/**",
  ".storybook/**",
];

/** Story / script / mock — relaxed product rules — §7.3 */
const RELAXED_ARTIFACT_FILES = [
  "**/*.stories.{ts,tsx}",
  "**/*.story-controls.ts",
  "**/*.decorators.{ts,tsx}",
  "scripts/**/*.{ts,tsx,mjs,js}",
  "lib/api/mocks/**/*.{ts,tsx}",
];

/** Test — relax layer boundaries / harness only */
const TEST_FILES = ["**/*.spec.ts", "**/*.test.{ts,tsx}"];

// Layer-boundary messages — .agent/rule.md §2.1, §3, §4
const MSG = {
  noRawHttpUi:
    "Do not call raw fetch/axios in UI — use lib/api/* (with Zod parse). See .agent/rule.md §4.1.",
  noRawHttpHook:
    "Hooks must not call raw fetch/axios — use lib/api/* or lib/<domain>/. See .agent/rule.md §3.D.",
  utilsPure:
    "utils/ must be pure: no React, no API/WS calls, no hooks/UI imports. See .agent/rule.md §3.E.",
  libApiBoundary:
    "lib/api/ may only depend on lib/http/axios + schemas — no React/hooks/UI/app/store/server-api. See .agent/rule.md §3.F.",
  namedExportOnly:
    "Use named exports for components/hooks/utils/schemas (§3.M.2). Default export only for page.tsx/layout.tsx (Next.js requirement) and *.stories.tsx.",
  hookNoUi:
    "Hooks must not import UI/app — inverted dependency. See .agent/rule.md §3.D.",
};

// =============================================================================
// Rule sets (≈ "rules" block in .eslintrc)
// =============================================================================

/** Next.js — upgraded from warn (recommended). no-typos stays warn — App Router, §7.2.G */
const RULES_NEXT_OVERRIDES = {
  "@next/next/no-img-element": "error",
};

/** §7.2.B Batch 1 — security & bug-prone (ESLint core) */
const RULES_LOGIC = {
  eqeqeq: ["error", "always", { null: "ignore" }],
  "no-eval": "error",
  "no-implied-eval": "error",
  "no-new-func": "error",
  "no-script-url": "error",
  "no-throw-literal": "error",
  "array-callback-return": ["error", { allowImplicit: true }],
  "no-promise-executor-return": "error",
  "no-return-assign": "error",
  "no-self-assign": "error",
  "no-unreachable-loop": "error",
  "no-unsafe-optional-chaining": [
    "error",
    { disallowArithmeticOperators: true },
  ],
  "no-console": "error",
  "no-param-reassign": [
    "error",
    {
      props: true,
      ignorePropertyModificationsFor: ["acc", "accumulator", "draft", "state"],
    },
  ],
  "consistent-return": "error",
  "default-case": "error",
  "prefer-template": "error",
};

/** §7.2.C Batch 2 — import hygiene */
const RULES_IMPORT = {
  "import/no-duplicates": "error",
  "import/no-self-import": "error",
  "import/no-useless-path-segments": ["error", { commonjs: true }],
  "import/first": "error",
  "import/newline-after-import": "error",
  "import/order": [
    "warn",
    {
      groups: [
        "builtin",
        "external",
        ["internal", "parent", "sibling", "index"],
        "type",
      ],
      pathGroups: [{ pattern: "@/**", group: "internal" }],
      pathGroupsExcludedImportTypes: ["builtin", "type"],
      alphabetize: { order: "asc", caseInsensitive: true },
      "newlines-between": "always",
    },
  ],
};

/** §7.2.A — type safety */
const RULES_TYPE = {
  "@typescript-eslint/no-explicit-any": "error",
  "@typescript-eslint/no-empty-object-type": "error",
  "@typescript-eslint/no-unused-vars": [
    "error",
    {
      args: "after-used",
      argsIgnorePattern: "^_",
      varsIgnorePattern: "^_",
      caughtErrorsIgnorePattern: "^_",
      destructuredArrayIgnorePattern: "^_",
      ignoreRestSiblings: true,
    },
  ],
  "@typescript-eslint/ban-ts-comment": [
    "error",
    {
      "ts-ignore": true,
      "ts-nocheck": true,
      "ts-expect-error": "allow-with-description",
    },
  ],
};

/** §7.2.D Batch 3 — React */
const RULES_REACT = {
  "react/no-array-index-key": "warn",
  "react/jsx-no-useless-fragment": "error",
  "react/no-unstable-nested-components": "error",
  "react/no-danger": "warn",
  "react-hooks/rules-of-hooks": "error",
  "react-hooks/set-state-in-effect": "error",
  "react-hooks/exhaustive-deps": "error",
  "react-hooks/refs": "error",
  "react-hooks/preserve-manual-memoization": "warn",
  "react-hooks/static-components": "warn",
  "react-hooks/incompatible-library": "warn",
  "react-web-api/no-leaked-timeout": "error",
  "react-web-api/no-leaked-interval": "error",
};

/** §7.2.F Batch 5 — Promise typed lint */
const RULES_PROMISE = {
  "@typescript-eslint/no-floating-promises": "error",
  "@typescript-eslint/no-misused-promises": [
    "error",
    {
      checksVoidReturn: { attributes: false },
    },
  ],
};

/** §7.3 — off for non-deploy artifacts */
const RULES_RELAXED_ARTIFACTS = {
  "@typescript-eslint/no-explicit-any": "off",
  "no-restricted-globals": "off",
  "@typescript-eslint/no-restricted-imports": "off",
  "no-restricted-syntax": "off",
  "import/first": "off",
  "react/no-array-index-key": "off",
  "no-console": "off",
  "no-param-reassign": "off",
  "@typescript-eslint/no-floating-promises": "off",
  "@typescript-eslint/no-misused-promises": "off",
};

/** §7.3 — test: relax layer boundaries / harness only */
const RULES_RELAXED_TEST = {
  "no-restricted-globals": "off",
  "@typescript-eslint/no-restricted-imports": "off",
  "no-restricted-syntax": "off",
  "import/first": "off",
  "react/no-array-index-key": "off",
};

// =============================================================================
// Config assembly
// =============================================================================

export default defineConfig([
  // ── 0. Base presets (≈ extends) ───────────────────────────────────────────
  // nextVitals = Next base + @next/next/recommended + core-web-vitals
  ...nextVitals,
  ...nextTs,
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),
  ...storybook.configs["flat/recommended"],

  // ── 1. Product rules (error) ──────────────────────────────────────────────

  { files: FILES_ALL, rules: RULES_NEXT_OVERRIDES },

  {
    files: FILES_TS,
    plugins: {
      "react-web-api": reactWebApi,
    },
    rules: {
      ...RULES_LOGIC,
      ...RULES_TYPE,
      ...RULES_REACT,
      ...RULES_IMPORT,
    },
  },

  {
    files: FILES_TSX,
    rules: {
      // Forbid only `>` and `}` — allow `'` and `"` in JSX text (rule.md §9.3)
      "react/no-unescaped-entities": ["error", { forbid: [">", "}"] }],
    },
  },

  {
    files: FILES_TS,
    ignores: TYPED_LINT_IGNORES,
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: RULES_PROMISE,
  },

  // ── 2. Architecture — layer boundaries ────────────────────────────────────

  {
    files: ["utils/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-globals": [
        "error",
        { name: "fetch", message: MSG.utilsPure },
      ],
      "@typescript-eslint/no-restricted-imports": [
        "error",
        {
          paths: [{ name: "axios", message: MSG.utilsPure }],
          patterns: [
            { group: ["react", "react-dom"], message: MSG.utilsPure },
            {
              group: [
                "@/hooks",
                "@/hooks/*",
                "@/components/*",
                "@/app/*",
                "@/stores/*",
              ],
              message: MSG.utilsPure,
              allowTypeImports: true,
            },
            {
              group: [
                "@/lib/http/axios",
                "@/lib/http/server-api",
                "@/lib/api/*",
                "@/lib/chat/*",
              ],
              message: MSG.utilsPure,
              allowTypeImports: true,
            },
          ],
        },
      ],
    },
  },

  {
    files: ["lib/api/**/*.{ts,tsx}"],
    rules: {
      "@typescript-eslint/no-restricted-imports": [
        "error",
        {
          patterns: [
            { group: ["@/lib/http/server-api"], message: MSG.libApiBoundary },
            {
              group: [
                "react",
                "react-dom",
                "@/hooks",
                "@/hooks/*",
                "@/components/*",
                "@/app/*",
                "@/stores/*",
              ],
              message: MSG.libApiBoundary,
              allowTypeImports: true,
            },
          ],
        },
      ],
    },
  },

  {
    files: ["hooks/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-globals": [
        "error",
        { name: "fetch", message: MSG.noRawHttpHook },
      ],
      "@typescript-eslint/no-restricted-imports": [
        "error",
        {
          paths: [{ name: "axios", message: MSG.noRawHttpHook }],
          patterns: [
            {
              group: ["@/components/*", "@/app/*"],
              message: MSG.hookNoUi,
              allowTypeImports: true,
            },
          ],
        },
      ],
    },
  },

  {
    files: ["components/**/*.{ts,tsx}", "app/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-globals": [
        "error",
        { name: "fetch", message: MSG.noRawHttpUi },
      ],
      "@typescript-eslint/no-restricted-imports": [
        "error",
        { paths: [{ name: "axios", message: MSG.noRawHttpUi }] },
      ],
    },
  },

  {
    files: [
      "components/**/*.{ts,tsx}",
      "app/**/_components/**/*.{ts,tsx}",
      "hooks/**/*.{ts,tsx}",
      "utils/**/*.{ts,tsx}",
      "lib/**/*.{ts,tsx}",
      "stores/**/*.{ts,tsx}",
      "schemas/**/*.{ts,tsx}",
    ],
    rules: {
      "no-restricted-syntax": [
        "error",
        { selector: "ExportDefaultDeclaration", message: MSG.namedExportOnly },
      ],
    },
  },

  // ── 3. Storybook debt (warn) ────────────────────────────────────────────────

  {
    files: ["**/*.stories.{ts,tsx}"],
    rules: { "storybook/no-renderer-packages": "warn" },
  },

  // ── 4. Relaxations §7.3 ───────────────────────────────────────────────────

  { files: RELAXED_ARTIFACT_FILES, rules: RULES_RELAXED_ARTIFACTS },
  { files: TEST_FILES, rules: RULES_RELAXED_TEST },
]);
