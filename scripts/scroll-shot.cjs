const puppeteer = require("puppeteer-core");

(async () => {
  const browser = await puppeteer.launch({
    executablePath: "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
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

  // mid-rail
  await page.evaluate((y) => window.scrollTo(0, y), info.top + (info.height - info.vh) * 0.5);
  await new Promise((r) => setTimeout(r, 400));
  await page.screenshot({ path: "C:/Users/aaore/AppData/Local/Temp/capo-shots/rail_mid.png" });

  // end of rail
  await page.evaluate((y) => window.scrollTo(0, y), info.top + (info.height - info.vh) * 0.98);
  await new Promise((r) => setTimeout(r, 400));
  await page.screenshot({ path: "C:/Users/aaore/AppData/Local/Temp/capo-shots/rail_end.png" });

  await browser.close();
  console.log("ok");
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
