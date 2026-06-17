import { chromium } from "playwright";

const BASE = process.env.WEB_BASE_URL ?? "http://localhost:8386";

async function login(page) {
  await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
  await page.fill('input[id="username"], input[name="username"]', "admin");
  await page.fill('input[id="password"], input[type="password"]', "admin123");
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/dashboard/);
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });

try {
  await login(page);
  await page.goto(`${BASE}/dashboard/skill/self-improving-agent`, {
    waitUntil: "networkidle",
  });
  await page.waitForSelector(".bn-editor");

  const closeBtn = page.locator('button[aria-label="Hide skill assistant"]');
  if (await closeBtn.count()) {
    await closeBtn.click();
    await page.waitForTimeout(400);
  }

  const tree = await page.evaluate(() => {
    const shell = document.querySelector('[class*="bnShell"]');
    const scrolls = [...document.querySelectorAll('[class*="editorScroll"]')].map(
      (el, i) => {
        const r = el.getBoundingClientRect();
        return {
          index: i,
          parent: el.parentElement?.className?.toString?.().slice(0, 80),
          inPortal: !!el.closest(".bn-root"),
          hasBnEditor: !!el.querySelector(".bn-editor"),
          scrollHeight: el.scrollHeight,
          clientHeight: el.clientHeight,
          scrollTop: el.scrollTop,
          pointerEvents: getComputedStyle(el).pointerEvents,
          rect: { top: r.top, h: r.height },
        };
      },
    );

    function describe(el, depth = 0) {
      if (!el || depth > 6) return null;
      const cn = el.className?.toString?.() ?? "";
      return {
        tag: el.tagName,
        id: el.id,
        className: cn.slice(0, 100),
        childCount: el.children.length,
        children: [...el.children].slice(0, 5).map((c) => describe(c, depth + 1)),
      };
    }

    return {
      scrolls,
      shellTree: shell ? describe(shell) : null,
      portalParent: document.querySelector(".bn-root")?.parentElement?.className,
    };
  });

  console.log(JSON.stringify(tree, null, 2));
} finally {
  await browser.close();
}
