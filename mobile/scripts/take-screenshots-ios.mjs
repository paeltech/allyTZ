import { execFileSync } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

import sharp from "sharp";

const TARGET = { width: 1260, height: 2736 };
const DEFAULT_EXP_URL = "exp://127.0.0.1:8081";

// Keep in sync with `scripts/take-screenshots.mjs`
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

function simctl(args) {
  return execFileSync("xcrun", ["simctl", ...args], { encoding: "utf8" }).trim();
}

function ensureBootedSimulator() {
  const out = simctl(["list", "devices", "booted"]);
  // If any booted device exists, we're good.
  if (!out.includes("(Booted)")) {
    throw new Error(
      "No booted iOS Simulator found. Boot one first (Xcode → Open Developer Tool → Simulator), then re-run screenshots:ios."
    );
  }
}

async function main() {
  const expBase = process.env.EXPO_EXP_URL || DEFAULT_EXP_URL;
  const outDir = path.resolve(process.cwd(), "screenshots");
  const tmpDir = path.resolve(outDir, ".tmp");

  await fs.mkdir(tmpDir, { recursive: true });
  await fs.mkdir(outDir, { recursive: true });

  ensureBootedSimulator();

  for (const route of ROUTES) {
    const url = `${expBase}/--${route === "/" ? "" : route}`;
    const tmpPath = path.join(tmpDir, routeToFilename(route));
    const outPath = path.join(outDir, routeToFilename(route));

    // Navigate app (Expo Go / dev client) via deep link
    simctl(["openurl", "booted", url]);

    // Give the screen time to render
    await new Promise((r) => setTimeout(r, 2500));

    // Capture raw simulator screenshot
    simctl(["io", "booted", "screenshot", tmpPath]);

    // Resize to exact requested dimensions
    await sharp(tmpPath)
      .resize(TARGET.width, TARGET.height, { fit: "cover", position: "centre" })
      .png()
      .toFile(outPath);

    // eslint-disable-next-line no-console
    console.log(`Saved screenshots/${path.basename(outPath)} ← ${url}`);
  }
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});

