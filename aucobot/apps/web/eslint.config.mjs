// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
import storybook from "eslint-plugin-storybook";

import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// Thông điệp dùng chung cho các luật ranh giới tầng (rule .agent/rule.md §2.1, §3, §4)
const NO_RAW_HTTP_UI =
  "Không gọi fetch/axios thô trong UI — đi qua lib/api/* (đã có Zod parse). Xem .agent/rule.md §4.1.";
const NO_RAW_HTTP_HOOK =
  "Hook không gọi fetch/axios thô — đi qua lib/api/* hoặc lib/<domain>/. Xem .agent/rule.md §3.D.";
const UTILS_PURE =
  "utils/ phải thuần: không React, không gọi API/WS, không import hooks/UI. Xem .agent/rule.md §3.E.";
const LIBAPI_BOUNDARY =
  "lib/api/ chỉ phụ thuộc lib/http/axios + schemas — không React/hook/UI/app/store/server-api. Xem .agent/rule.md §3.F.";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  ...storybook.configs["flat/recommended"],

  // ──────────────────────────────────────────────────────────────
  // Luật chung: an toàn type (rule §1.3, §5)
  // ──────────────────────────────────────────────────────────────
  {
    files: ["**/*.{ts,tsx}"],
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/ban-ts-comment": [
        "error",
        { "ts-ignore": true, "ts-nocheck": true, "ts-expect-error": "allow-with-description" },
      ],
    },
  },

  // ──────────────────────────────────────────────────────────────
  // JSX text: chỉ cấm ký tự thật sự gây lỗi/nhập nhằng parse (`>`, `}`).
  // Cho phép `'` và `"` vì render bình thường — KHÔNG ép `&apos;`/`&quot;`.
  // Xem .agent/rule.md §7.4.
  // ──────────────────────────────────────────────────────────────
  {
    files: ["**/*.tsx"],
    rules: {
      "react/no-unescaped-entities": ["error", { forbid: [">", "}"] }],
    },
  },

  // ──────────────────────────────────────────────────────────────
  // utils/ — helper thuần (rule §2.1, §3.E)
  // ──────────────────────────────────────────────────────────────
  {
    files: ["utils/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-globals": ["error", { name: "fetch", message: UTILS_PURE }],
      "@typescript-eslint/no-restricted-imports": [
        "error",
        {
          paths: [{ name: "axios", message: UTILS_PURE }],
          patterns: [
            // React: cấm cả type (utils không được dính tới React)
            { group: ["react", "react-dom"], message: UTILS_PURE },
            // Hook/UI/app/store: cấm import value; cho import type (vô hại runtime)
            {
              group: ["@/hooks", "@/hooks/*", "@/components/*", "@/app/*", "@/stores/*"],
              message: UTILS_PURE,
              allowTypeImports: true,
            },
            // HTTP transport + API/WS client: cấm gọi runtime; cho import type.
            // Lưu ý: KHÔNG cấm @/lib/http/api-base-url (hàm thuần trả URL string).
            {
              group: ["@/lib/http/axios", "@/lib/http/server-api", "@/lib/api/*", "@/lib/chat/*"],
              message: UTILS_PURE,
              allowTypeImports: true,
            },
          ],
        },
      ],
    },
  },

  // ──────────────────────────────────────────────────────────────
  // lib/api/ — REST client + Zod (rule §3.F, §4.2)
  // ──────────────────────────────────────────────────────────────
  {
    files: ["lib/api/**/*.{ts,tsx}"],
    rules: {
      "@typescript-eslint/no-restricted-imports": [
        "error",
        {
          patterns: [
            { group: ["@/lib/http/server-api"], message: LIBAPI_BOUNDARY },
            {
              group: ["react", "react-dom", "@/hooks", "@/hooks/*", "@/components/*", "@/app/*", "@/stores/*"],
              message: LIBAPI_BOUNDARY,
              allowTypeImports: true,
            },
          ],
        },
      ],
    },
  },

  // ──────────────────────────────────────────────────────────────
  // hooks/ — React hook theo domain (rule §3.D)
  // ──────────────────────────────────────────────────────────────
  {
    files: ["hooks/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-globals": ["error", { name: "fetch", message: NO_RAW_HTTP_HOOK }],
      "@typescript-eslint/no-restricted-imports": [
        "error",
        {
          paths: [{ name: "axios", message: NO_RAW_HTTP_HOOK }],
          patterns: [
            { group: ["@/components/*", "@/app/*"], message: "Hook không import UI/app — đảo phụ thuộc. Xem .agent/rule.md §3.D.", allowTypeImports: true },
          ],
        },
      ],
    },
  },

  // ──────────────────────────────────────────────────────────────
  // UI (components/ + app/) — cấm HTTP thô, được dùng lib/api (rule §4.1, §4.5)
  // ──────────────────────────────────────────────────────────────
  {
    files: ["components/**/*.{ts,tsx}", "app/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-globals": ["error", { name: "fetch", message: NO_RAW_HTTP_UI }],
      "@typescript-eslint/no-restricted-imports": [
        "error",
        { paths: [{ name: "axios", message: NO_RAW_HTTP_UI }] },
      ],
    },
  },

  // ──────────────────────────────────────────────────────────────
  // Export: named-only (rule §3.M.2). Default chỉ cho page.tsx/layout.tsx
  // (Next bắt buộc) và *.stories.tsx (`export default meta` — nới ở block cuối).
  // ──────────────────────────────────────────────────────────────
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
        {
          selector: "ExportDefaultDeclaration",
          message:
            "Dùng named export cho component/hook/util/schema (§3.M.2). Default chỉ cho page.tsx/layout.tsx (Next ép) và *.stories.tsx.",
        },
      ],
    },
  },

  // ──────────────────────────────────────────────────────────────
  // NỢ KỸ THUẬT (warn) — luật có sẵn vi phạm diện rộng, chưa chặn CI.
  // Quy ước: code MỚI không thêm vi phạm; đụng file nào dọn dần file đó.
  // Xem .agent/rule.md §7 (bảng nợ kỹ thuật).
  // ──────────────────────────────────────────────────────────────
  {
    files: ["**/*.{ts,tsx}"],
    rules: {
      // React Compiler (mới ở Next 16) — ~65 chỗ, refactor lớn
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/refs": "warn",
      "react-hooks/preserve-manual-memoization": "warn",
      "react-hooks/incompatible-library": "warn",
      "react-hooks/static-components": "warn",
      // Lỗi cũ lặt vặt — đúng nhưng ngoài scope task boundaries
      "@typescript-eslint/no-empty-object-type": "warn",
    },
  },
  {
    files: ["**/*.stories.{ts,tsx}"],
    rules: {
      // Story import @storybook/react thay vì framework package
      "storybook/no-renderer-packages": "warn",
    },
  },

  // ──────────────────────────────────────────────────────────────
  // Nới luật cho story / test / script (không phải code sản phẩm)
  // ──────────────────────────────────────────────────────────────
  {
    files: [
      "**/*.stories.{ts,tsx}",
      "**/*.spec.ts",
      "**/*.story-controls.ts",
      "**/*.decorators.{ts,tsx}",
      "scripts/**/*.{ts,tsx}",
    ],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "no-restricted-globals": "off",
      "@typescript-eslint/no-restricted-imports": "off",
      "no-restricted-syntax": "off",
    },
  },
]);

export default eslintConfig;
