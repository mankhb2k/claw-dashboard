import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, "../.tmp/skill-editor-check");
const BASE = process.env.WEB_BASE_URL ?? "http://localhost:8386";
const USER = process.env.SELF_HOST_USER_USERNAME ?? "admin";
const PASS = process.env.SELF_HOST_USER_PASSWORD ?? "admin123";
const SKILL_URL = `${BASE}/dashboard/skill/self-improving-agent`;

const SCROLL_SELECTOR = '[class*="editorScroll"]';

async function login(page) {
  await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
  await page.fill('input[id="username"], input[name="username"]', USER);
  await page.fill('input[id="password"], input[type="password"]', PASS);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/dashboard/, { timeout: 30_000 });
}

async function measureScroll(page) {
  return page.evaluate((scrollSelector) => {
    const editorScroll = document.querySelector(scrollSelector);
    const docHeader = document.querySelector('[class*="docHeader"]');
    const bnContainer = document.querySelector(".bn-container");
    const bnEditor = document.querySelector(".bn-editor");
    const root = document.querySelector(
      '[class*="SkillEditPanel"][class*="root"]',
    );

    if (!editorScroll) {
      return { error: "editorScroll not found" };
    }

    const es = editorScroll.getBoundingClientRect();
    const dh = docHeader?.getBoundingClientRect();
    const bc = bnContainer?.getBoundingClientRect();
    const be = bnEditor?.getBoundingClientRect();
    const rr = root?.getBoundingClientRect();

    const firstTable = editorScroll.querySelector(".tableWrapper");
    const ft = firstTable?.getBoundingClientRect();

    return {
      root: rr
        ? {
            height: rr.height,
            computedAlign: getComputedStyle(root).alignItems,
          }
        : null,
      editorScroll: {
        clientHeight: editorScroll.clientHeight,
        scrollHeight: editorScroll.scrollHeight,
        canScroll: editorScroll.scrollHeight > editorScroll.clientHeight,
        overflowY: getComputedStyle(editorScroll).overflowY,
        top: es.top,
        height: es.height,
      },
      bnContainer: bc
        ? {
            height: bc.height,
            overflow: getComputedStyle(bnContainer).overflow,
          }
        : null,
      docHeader: dh
        ? { bottom: dh.bottom, height: dh.height, top: dh.top }
        : null,
      bnEditor: be ? { top: be.top, height: be.height } : null,
      firstTable: ft
        ? {
            top: ft.top,
            gapBelowHeader: dh ? ft.top - dh.bottom : null,
            overlapsHeader: dh ? ft.top < dh.bottom : null,
          }
        : null,
    };
  }, SCROLL_SELECTOR);
}

async function testScroll(page) {
  return page.evaluate((scrollSelector) => {
    const editorScroll = document.querySelector(scrollSelector);
    if (!editorScroll) return { error: "no scroll pane" };
    const before = editorScroll.scrollTop;
    editorScroll.scrollTop = 400;
    const after = editorScroll.scrollTop;
    return {
      scrollTopBefore: before,
      scrollTopAfter: after,
      scrollWorked: after > before,
    };
  }, SCROLL_SELECTOR);
}

async function testTableNearTop(page) {
  return page.evaluate((scrollSelector) => {
    const editorScroll = document.querySelector(scrollSelector);
    const docHeader = document.querySelector('[class*="docHeader"]');
    const firstTable = editorScroll?.querySelector(".tableWrapper");

    if (!editorScroll || !firstTable || !docHeader) {
      return { skipped: true, reason: "missing elements" };
    }

    const scrollRect = editorScroll.getBoundingClientRect();
    const tableRect = firstTable.getBoundingClientRect();
    const headerRect = docHeader.getBoundingClientRect();

    const tableOffsetInScroll =
      tableRect.top - scrollRect.top + editorScroll.scrollTop;
    editorScroll.scrollTop = Math.max(0, tableOffsetInScroll - 8);

    const tableAfter = firstTable.getBoundingClientRect();
    const gapBelowHeader = tableAfter.top - headerRect.bottom;

    return {
      scrollTop: editorScroll.scrollTop,
      tableTop: tableAfter.top,
      headerBottom: headerRect.bottom,
      gapBelowHeader,
      overlapsHeader: tableAfter.top < headerRect.bottom,
    };
  }, SCROLL_SELECTOR);
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1400, height: 900 },
  });
  const page = await context.newPage();

  try {
    await login(page);
    await page.goto(SKILL_URL, { waitUntil: "networkidle", timeout: 60_000 });
    await page.waitForSelector(".bn-editor", { timeout: 60_000 });

    const closeBtn = page.locator('button[aria-label="Hide skill assistant"]');
    if (await closeBtn.count()) {
      await closeBtn.click();
      await page.waitForTimeout(400);
    }

    const before = await measureScroll(page);
    const scroll = await testScroll(page);
    const after = await measureScroll(page);
    const tableAtTop = await testTableNearTop(page);

    await page.screenshot({
      path: path.join(OUT_DIR, "skill-editor-expanded-top.png"),
      fullPage: false,
    });

    await page.evaluate((scrollSelector) => {
      const el = document.querySelector(scrollSelector);
      if (el) el.scrollTop = el.scrollHeight;
    }, SCROLL_SELECTOR);
    await page.waitForTimeout(300);

    await page.screenshot({
      path: path.join(OUT_DIR, "skill-editor-scrolled.png"),
      fullPage: false,
    });

    const scrolled = await measureScroll(page);

    const report = { before, scroll, after, tableAtTop, scrolled };
    console.log(JSON.stringify(report, null, 2));

    const bnContainerClipped =
      before.bnContainer?.overflow === "hidden" &&
      (before.bnContainer?.height ?? 0) <=
        (before.editorScroll?.height ?? 0) + 4;

    const ok =
      before.editorScroll?.canScroll &&
      scroll.scrollWorked &&
      !tableAtTop.overlapsHeader &&
      (tableAtTop.skipped || (tableAtTop.gapBelowHeader ?? -1) >= -4) &&
      bnContainerClipped;

    if (!ok) {
      process.exitCode = 1;
      console.error("Skill editor scroll/layout check FAILED");
    } else {
      console.log("Skill editor scroll/layout check PASSED");
    }
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
