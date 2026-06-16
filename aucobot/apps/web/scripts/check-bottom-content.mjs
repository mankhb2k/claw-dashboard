import { chromium } from "playwright";

const BASE = process.env.WEB_BASE_URL ?? "http://localhost:8386";
const USER = process.env.SELF_HOST_USER_USERNAME ?? "admin";
const PASS = process.env.SELF_HOST_USER_PASSWORD ?? "admin123";

async function login(page) {
  await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
  await page.fill('input[id="username"], input[name="username"]', USER);
  await page.fill('input[id="password"], input[type="password"]', PASS);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/dashboard/, { timeout: 30_000 });
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

  const result = await page.evaluate(() => {
    const editorScroll = document.querySelector('[class*="editorScroll"]');
    const bnEditor = document.querySelector(".bn-editor");
    const portal = document.querySelector(".bn-root");
    const documentArea = document.querySelector('[class*="documentArea"]');
    const editorBody = document.querySelector('[class*="editorBody"]');
    const bnShell = document.querySelector('[class*="bnShell"]');

    if (!editorScroll || !bnEditor) return { error: "missing elements" };

    editorScroll.scrollTop = editorScroll.scrollHeight;
    const es = editorScroll.getBoundingClientRect();
    const be = bnEditor.getBoundingClientRect();
    const lastBlock = bnEditor.lastElementChild;
    const lb = lastBlock?.getBoundingClientRect();

    const portalChildren = portal
      ? [...portal.children].map((c) => {
          const r = c.getBoundingClientRect();
          return {
            tag: c.tagName,
            className: c.className.slice(0, 100),
            top: Math.round(r.top),
            bottom: Math.round(r.bottom),
            height: Math.round(r.height),
            pointerEvents: getComputedStyle(c).pointerEvents,
            bg: getComputedStyle(c).backgroundColor,
          };
        })
      : [];

    const elementsAtBottom = document.elementsFromPoint(
      es.left + es.width / 2,
      es.bottom - 2,
    );

    return {
      scrollTop: editorScroll.scrollTop,
      maxScroll: editorScroll.scrollHeight - editorScroll.clientHeight,
      editorScroll: {
        top: es.top,
        bottom: es.bottom,
        clientHeight: editorScroll.clientHeight,
      },
      bnEditor: {
        top: be.top,
        bottom: be.bottom,
        height: be.height,
      },
      lastBlock: lb
        ? {
            top: lb.top,
            bottom: lb.bottom,
            visibleBottom: lb.bottom <= es.bottom + 1,
            gapToScrollBottom: es.bottom - lb.bottom,
            clipped: lb.bottom > es.bottom + 1,
          }
        : null,
      documentAreaBottom: documentArea?.getBoundingClientRect().bottom,
      editorBodyBottom: editorBody?.getBoundingClientRect().bottom,
      bnShellBottom: bnShell?.getBoundingClientRect().bottom,
      portal: portal
        ? {
            rect: portal.getBoundingClientRect(),
            position: getComputedStyle(portal).position,
            zIndex: getComputedStyle(portal).zIndex,
          }
        : null,
      portalChildren,
      elementsAtBottom: elementsAtBottom.slice(0, 6).map((el) => ({
        tag: el.tagName,
        className: (el.className?.toString?.() ?? "").slice(0, 80),
      })),
    };
  });

  console.log(JSON.stringify(result, null, 2));
} finally {
  await browser.close();
}
