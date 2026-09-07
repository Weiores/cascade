const fs = require("fs");
const os = require("os");
const path = require("path");
const puppeteer = require("puppeteer-core");

const edgeCandidates = [
  process.env.EDGE_PATH,
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
].filter(Boolean);

const executablePath = edgeCandidates.find((candidate) => fs.existsSync(candidate));
if (!executablePath) {
  throw new Error("Microsoft Edge executable not found. Set EDGE_PATH to your browser executable.");
}

const outDir = process.env.SHOT_DIR || path.join(os.tmpdir(), "capo-shots");
fs.mkdirSync(outDir, { recursive: true });

(async () => {
  const browser = await puppeteer.launch({
    executablePath,
    headless: "new",
    args: ["--disable-gpu"],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto("http://localhost:5173/", { waitUntil: "networkidle0" });
  await new Promise((r) => setTimeout(r, 1200));

  const info = await page.evaluate(() => {
    const section = [...document.querySelectorAll("section")].find((s) => s.style.height === "320vh");
    if (!section) return null;
    return { top: section.offsetTop, height: section.offsetHeight, vh: window.innerHeight };
  });
  if (!info) throw new Error("section not found");

  await page.evaluate((y) => window.scrollTo(0, y), info.top + (info.height - info.vh) * 0.5);
  await new Promise((r) => setTimeout(r, 400));
  await page.screenshot({ path: path.join(outDir, "rail_mid.png") });

  await page.evaluate((y) => window.scrollTo(0, y), info.top + (info.height - info.vh) * 0.98);
  await new Promise((r) => setTimeout(r, 400));
  await page.screenshot({ path: path.join(outDir, "rail_end.png") });

  await browser.close();
  console.log(`ok: screenshots saved to ${outDir}`);
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
