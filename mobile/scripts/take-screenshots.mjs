import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

import { chromium } from "playwright";

const VIEWPORT = { width: 1260, height: 2736 };
const DEFAULT_BASE_URL = "http://localhost:8081";
const WAIT_FOR_APP_MS = 45_000;

// Deterministic list from `app/_layout.tsx` Stack.Screen declarations.
// Skip dynamic routes (e.g. analysis/[id]) unless you want to provide params.
const ROUTES = [
  "/",
  "/auth/login",
  "/auth/signup",
  "/home",
  "/profile",
  "/signals",
  "/analysis",
  "/documents",
  "/events",
  "/tips",
  "/help",
  "/notifications",
  "/notification-preferences",
  "/terms",
  "/privacy",
  "/about",
  "/faq",
];

function routeToFilename(route) {
  if (route === "/") return "index.png";
  return `${route.replace(/^\//, "").replaceAll("/", "__")}.png`;
}

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

async function waitForServer(baseUrl) {
  // Avoid extra deps: simple fetch loop.
  const timeoutMs = 60_000;
  const start = Date.now();

  // Node 18+ has global fetch; if not present, this will throw quickly.
  // This repo is on modern Expo tooling, so that's fine.
  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      const res = await fetch(baseUrl, { method: "GET" });
      if (res.ok) return;
    } catch {
      // ignore
    }

    if (Date.now() - start > timeoutMs) {
      throw new Error(
        `Expo web server not reachable at ${baseUrl} after ${Math.round(
          timeoutMs / 1000
        )}s. Start it with: (cd mobile && npx expo start --web)`
      );
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
}

async function waitForAppToRender(page) {
  // Expo web will mount into #root (React) when the bundle is ready.
  // We wait for either:
  // - #root has some content, or
  // - any visible text appears, or
  // - network goes idle (best-effort)
  const start = Date.now();
  while (Date.now() - start < WAIT_FOR_APP_MS) {
    try {
      const root = page.locator("#root");
      if ((await root.count()) > 0) {
        const html = (await root.innerHTML()).trim();
        if (html.length > 0) return;
      }
    } catch {
      // ignore transient evaluation errors during navigation
    }

    try {
      const bodyText = (await page.locator("body").innerText()).trim();
      if (bodyText.length > 0) return;
    } catch {
      // ignore
    }

    await page.waitForTimeout(250);
  }

  // If we got here, it's likely a runtime crash or blank render.
  // eslint-disable-next-line no-console
  console.warn("Timed out waiting for app content to render.");
}

async function main() {
  const baseUrl = process.env.EXPO_BASE_URL || DEFAULT_BASE_URL;
  const outDir = path.resolve(process.cwd(), "screenshots");

  await ensureDir(outDir);
  await waitForServer(baseUrl);

  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: 1,
    isMobile: true,
    hasTouch: true,
  });

  const page = await context.newPage();

  for (const route of ROUTES) {
    const url = new URL(route, baseUrl).toString();
    const filePath = path.join(outDir, routeToFilename(route));

    // Load route
    await page.goto(url, { waitUntil: "domcontentloaded" });

    // Wait for the JS bundle to mount content.
    await waitForAppToRender(page);

    // Give Expo Router time to settle (fonts, async effects, etc.)
    await page.waitForTimeout(1500);

    await page.screenshot({
      path: filePath,
      type: "png",
      fullPage: false,
      animations: "disabled",
    });

    // eslint-disable-next-line no-console
    console.log(`Saved ${path.relative(process.cwd(), filePath)} ← ${url}`);
  }

  await browser.close();
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});

