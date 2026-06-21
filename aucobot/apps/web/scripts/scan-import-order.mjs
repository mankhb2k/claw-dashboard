/**
 * One-off scan: import/order violation counts by config profile.
 * Usage: node scripts/scan-import-order.mjs
 */
import importPlugin from "eslint-plugin-import";
import { ESLint } from "eslint";
import nextTs from "eslint-config-next/typescript";

const PROFILES = {
  airbnb: {
    name: "Airbnb (clone imports.js L149)",
    rule: [
      "warn",
      {
        groups: [["builtin", "external", "internal"]],
      },
    ],
  },
  airbnbAlphabetize: {
    name: "Airbnb + alphabetize (không có trong Airbnb gốc — thử mức vừa)",
    rule: [
      "warn",
      {
        groups: [["builtin", "external", "internal"]],
        alphabetize: { order: "asc", caseInsensitive: true },
      },
    ],
  },
  aucobotLight: {
    name: "AucoBot đề xuất — warn, nhóm rõ, không alphabetize",
    rule: [
      "warn",
      {
        groups: [
          "builtin",
          "external",
          "internal",
          ["parent", "sibling", "index"],
        ],
        pathGroups: [
          { pattern: "react", group: "external", position: "before" },
          { pattern: "react-dom", group: "external", position: "before" },
          { pattern: "next", group: "external", position: "before" },
          { pattern: "next/**", group: "external", position: "before" },
          { pattern: "@/**", group: "internal", position: "before" },
        ],
        pathGroupsExcludedImportTypes: ["builtin"],
        "newlines-between": "always",
        distinctGroup: false,
      },
    ],
  },
  aucobotStrict: {
    name: "AucoBot strict — + alphabetize + type last",
    rule: [
      "warn",
      {
        groups: [
          "builtin",
          "external",
          "internal",
          ["parent", "sibling", "index"],
          "type",
        ],
        pathGroups: [
          { pattern: "react", group: "external", position: "before" },
          { pattern: "react-dom", group: "external", position: "before" },
          { pattern: "next", group: "external", position: "before" },
          { pattern: "next/**", group: "external", position: "before" },
          { pattern: "@/**", group: "internal", position: "before" },
        ],
        pathGroupsExcludedImportTypes: ["builtin", "type"],
        alphabetize: { order: "asc", caseInsensitive: true },
        "newlines-between": "always",
        distinctGroup: false,
      },
    ],
  },
};

async function scanProfile(key, profile) {
  const eslint = new ESLint({
    cwd: new URL("..", import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1"),
    overrideConfigFile: true,
    overrideConfig: [
      ...nextTs,
      {
        files: ["**/*.{ts,tsx}"],
        plugins: { import: importPlugin },
        rules: {
          "import/order": profile.rule,
        },
      },
      {
        files: [
          "**/*.stories.{ts,tsx}",
          "**/*.spec.ts",
          "**/*.test.{ts,tsx}",
          "scripts/**",
        ],
        rules: { "import/order": "off" },
      },
    ],
  });

  const results = await eslint.lintFiles(["**/*.{ts,tsx}"]);
  let warnings = 0;
  const byFile = new Map();

  for (const result of results) {
    const hits = result.messages.filter((m) => m.ruleId === "import/order");
    if (hits.length > 0) {
      byFile.set(result.filePath, hits.length);
      warnings += hits.length;
    }
  }

  const topFiles = [...byFile.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  return { key, name: profile.name, warnings, files: byFile.size, topFiles };
}

console.log("Scanning @aucobot/web import/order profiles...\n");

for (const [key, profile] of Object.entries(PROFILES)) {
  const r = await scanProfile(key, profile);
  console.log(`=== ${r.name} ===`);
  console.log(`Warnings: ${r.warnings} across ${r.files} files`);
  if (r.topFiles.length > 0) {
    console.log("Top files:");
    for (const [file, count] of r.topFiles) {
      const rel = file.replace(/.*\\apps\\web\\/, "");
      console.log(`  ${count}\t${rel}`);
    }
  }
  console.log("");
}
