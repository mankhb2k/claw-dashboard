/**
 * ESLint flat config — @claw-dashboard/api
 *
 *   0. Base presets     — @eslint/js + typescript-eslint type-checked + Prettier
 *   1. Product rules    — logic, import, TypeScript, Promise (error / warn)
 *   2. Architecture     — Nest layer boundaries (dto / lib / controller / core)
 *   3. Technical debt   — warn only — .agent/note.md
 *   4. Relaxations      — scripts / test — rule.md §7.9
 *
 * Policy: .agent/rule.md §7 · progress: .agent/note.md
 */

import importPlugin from 'eslint-plugin-import';
import eslint from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import tseslint from 'typescript-eslint';

// =============================================================================
// Constants
// =============================================================================

const FILES_TS = ['src/**/*.ts'];

/** Promise typed lint — skip scripts only; spec vẫn bật — rule.md §7.6 */
const TYPED_LINT_IGNORES = ['scripts/**'];

/** CLI scripts — nới product rules — rule.md §7.9 */
const RELAXED_ARTIFACT_FILES = ['scripts/**/*.{ts,tsx,mjs,js}'];

/** Spec — nới harness + boundary; giữ logic & Promise — rule.md §7.9 */
const TEST_FILES = ['**/*.spec.ts'];

/** Layer-boundary messages — rule.md §2.5, §3.B–§3.D, §1.13 */
const MSG = {
  dtoPure:
    'DTO is validation-only — no Nest injectables or Prisma (rule.md §3.B).',
  libPure:
    'lib/ should stay thin — prefer service boundary for Prisma (rule.md §3.B). Type-only imports OK.',
  libDatabaseEnum:
    'Prefer @claw-dashboard/shared for enums in lib/ — runtime @claw-dashboard/database is legacy (rule.md §3.F).',
  coreNoFeatures:
    'core/ must not import feature modules (rule.md §3.D).',
  cloudPackages:
    'Cloud packages belong in ../cloud — studio/apps is self-host only (rule.md §1.13).',
};

const PRISMA_IMPORT_PATTERNS = [
  {
    group: ['**/prisma.service', '**/database/prisma.service'],
    message: MSG.libPure,
    allowTypeImports: true,
  },
];

const DATABASE_RUNTIME_PATHS = [
  {
    name: '@claw-dashboard/database',
    message: MSG.libDatabaseEnum,
    allowTypeImports: true,
  },
];

// =============================================================================
// Rule sets
// =============================================================================

/** rule.md §7.4 — logic & an toàn */
const RULES_LOGIC = {
  eqeqeq: ['error', 'always', { null: 'ignore' }],
  'no-eval': 'error',
  'no-implied-eval': 'error',
  'no-new-func': 'error',
  'no-script-url': 'error',
  'no-throw-literal': 'error',
  'prefer-promise-reject-errors': ['error', { allowEmptyReject: true }],
  'array-callback-return': ['error', { allowImplicit: true }],
  'no-promise-executor-return': 'error',
  'no-return-assign': 'error',
  'no-self-assign': 'error',
  'no-unreachable-loop': 'error',
  'no-unsafe-optional-chaining': [
    'error',
    { disallowArithmeticOperators: true },
  ],
  'no-console': 'error',
  'no-param-reassign': [
    'error',
    {
      props: true,
      ignorePropertyModificationsFor: ['acc', 'accumulator', 'draft', 'state'],
    },
  ],
  'consistent-return': 'error',
  'default-case': 'error',
  'default-case-last': 'error',
  'prefer-template': 'error',
  /** Tránh for...in — dùng Object.keys/values/entries — rule.md §7.4 */
  'guard-for-in': 'error',
};

/** rule.md §7.5 — import hygiene */
const RULES_IMPORT = {
  'import/no-duplicates': 'error',
  'import/no-self-import': 'error',
  'import/no-useless-path-segments': ['error', { commonjs: true }],
  'import/first': 'error',
  'import/newline-after-import': 'error',
  'import/order': [
    'error',
    {
      groups: [
        'builtin',
        'external',
        ['internal', 'parent', 'sibling', 'index'],
        'type',
      ],
      pathGroups: [{ pattern: '@claw-dashboard/**', group: 'internal' }],
      pathGroupsExcludedImportTypes: ['builtin', 'type'],
      alphabetize: { order: 'asc', caseInsensitive: true },
      'newlines-between': 'always',
    },
  ],
};

/** rule.md §7.6 — TypeScript (policy §5.7) */
const RULES_TYPE = {
  '@typescript-eslint/no-explicit-any': 'error',
  '@typescript-eslint/ban-ts-comment': [
    'error',
    {
      'ts-ignore': true,
      'ts-nocheck': true,
      'ts-expect-error': 'allow-with-description',
    },
  ],
  '@typescript-eslint/consistent-type-imports': [
    'error',
    { prefer: 'type-imports', fixStyle: 'separate-type-imports' },
  ],
};

/** rule.md §7.6 — Promise typed lint */
const RULES_PROMISE = {
  '@typescript-eslint/no-floating-promises': 'error',
  '@typescript-eslint/no-misused-promises': 'error',
};

/** rule.md §7.6 — typed lint (error) */
const RULES_TYPED = {
  '@typescript-eslint/no-unsafe-argument': 'error',
  '@typescript-eslint/no-unsafe-return': 'error',
  '@typescript-eslint/no-unsafe-call': 'error',
  '@typescript-eslint/no-base-to-string': 'error',
  '@typescript-eslint/no-require-imports': 'error',
  'no-unused-vars': 'off',
  '@typescript-eslint/no-unused-vars': [
    'error',
    {
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_',
      caughtErrorsIgnorePattern: '^_',
    },
  ],
};

/** rule.md §7.8 — nợ kỹ thuật (warn, không chặn CI) */
const RULES_TECH_DEBT = {
  '@typescript-eslint/no-unsafe-assignment': 'warn',
  '@typescript-eslint/no-unsafe-member-access': 'warn',
  'require-await': 'off',
  '@typescript-eslint/require-await': 'warn',
  '@typescript-eslint/restrict-template-expressions': 'warn',
};

/** rule.md §7.9 — off cho scripts */
const RULES_RELAXED_ARTIFACTS = {
  '@typescript-eslint/no-explicit-any': 'off',
  'import/first': 'off',
  'no-console': 'off',
  'no-param-reassign': 'off',
  '@typescript-eslint/no-floating-promises': 'off',
  '@typescript-eslint/no-misused-promises': 'off',
};

/** rule.md §7.9 — spec: harness + mock; giữ logic & Promise */
const RULES_RELAXED_TEST = {
  'import/first': 'off',
  '@typescript-eslint/no-unsafe-argument': 'off',
  '@typescript-eslint/no-unsafe-assignment': 'off',
  '@typescript-eslint/no-unsafe-member-access': 'off',
  '@typescript-eslint/no-unsafe-return': 'off',
  '@typescript-eslint/no-unsafe-call': 'off',
  '@typescript-eslint/no-restricted-imports': 'off',
};

// =============================================================================
// Config
// =============================================================================

export default tseslint.config(
  {
    ignores: ['eslint.config.mjs', 'dist/**', 'coverage/**'],
  },

  // ── 0. Base presets ───────────────────────────────────────────────────────
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  eslintPluginPrettierRecommended,

  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      sourceType: 'commonjs',
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },

  // ── 1. Product rules ──────────────────────────────────────────────────────

  {
    files: FILES_TS,
    rules: {
      ...RULES_LOGIC,
      ...RULES_TYPE,
      ...RULES_TYPED,
      ...RULES_TECH_DEBT,
      '@typescript-eslint/no-restricted-imports': 'off',
      'prettier/prettier': ['error', { endOfLine: 'auto' }],
    },
  },

  {
    files: FILES_TS,
    plugins: { import: importPlugin },
    rules: RULES_IMPORT,
  },

  {
    files: FILES_TS,
    ignores: TYPED_LINT_IGNORES,
    rules: RULES_PROMISE,
  },

  // ── 2. Architecture — rule.md §7.7 ────────────────────────────────────────

  {
    files: ['**/dto/**/*.ts'],
    rules: {
      '@typescript-eslint/no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@nestjs/common',
              importNames: ['Injectable'],
              message: MSG.dtoPure,
            },
          ],
          patterns: [...PRISMA_IMPORT_PATTERNS],
        },
      ],
    },
  },

  {
    files: ['**/lib/**/*.ts'],
    rules: {
      '@typescript-eslint/no-restricted-imports': [
        'error',
        {
          paths: DATABASE_RUNTIME_PATHS,
          patterns: [...PRISMA_IMPORT_PATTERNS],
        },
      ],
    },
  },

  {
    files: ['**/*.controller.ts'],
    ignores: ['src/features/internal/**'],
    rules: {
      '@typescript-eslint/no-restricted-imports': [
        'error',
        {
          paths: DATABASE_RUNTIME_PATHS,
          patterns: [...PRISMA_IMPORT_PATTERNS],
        },
      ],
    },
  },

  {
    files: ['src/core/**/*.ts'],
    ignores: ['src/core/database/**'],
    rules: {
      '@typescript-eslint/no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/features/**'],
              message: MSG.coreNoFeatures,
              allowTypeImports: true,
            },
          ],
        },
      ],
    },
  },

  // ── 4. Relaxations — rule.md §7.9 ─────────────────────────────────────────

  { files: RELAXED_ARTIFACT_FILES, rules: RULES_RELAXED_ARTIFACTS },
  { files: TEST_FILES, rules: RULES_RELAXED_TEST },
);
