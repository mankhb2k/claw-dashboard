/**
 * Apply ESLint --fix cho import/order trên toàn bộ web app.
 * Usage: node scripts/fix-import-order.mjs
 */
import { ESLint } from "eslint";

const cwd = new URL("..", import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1");
const eslint = new ESLint({ cwd, fix: true });

for (let pass = 1; pass <= 3; pass += 1) {
  const results = await eslint.lintFiles(["**/*.{ts,tsx}"]);
  const fixable = results.filter((r) => r.output);
  if (fixable.length === 0) {
    console.log(`Pass ${pass}: nothing to fix`);
    break;
  }
  await ESLint.outputFixes(fixable);
  console.log(`Pass ${pass}: fixed ${fixable.length} file(s)`);
}

const verify = new ESLint({ cwd });
const after = await verify.lintFiles(["**/*.{ts,tsx}"]);
let remaining = 0;
let files = 0;
for (const r of after) {
  const n = r.messages.filter((m) => m.ruleId === "import/order").length;
  if (n > 0) {
    remaining += n;
    files += 1;
  }
}
console.log(`Remaining import/order: ${remaining} warning(s) in ${files} file(s)`);
