// Pomocniczy skrypt deweloperski do wizualnej weryfikacji motywów
// graficznych - przechodzi prawdziwym przepływem UI (rejestracja -> wybór
// motywu w /admin -> podgląd publicznej strony) i zapisuje zrzuty ekranu.
// Uruchomienie (po `npm run build && npm run start`):
//   SMOKE_BASE_URL=http://localhost:3000 PLAYWRIGHT_CHROMIUM=/opt/pw-browsers/chromium \
//     node scripts/screenshot-themes.mjs
// Zrzuty lądują w OUT_DIR (domyślnie /tmp/screenshots).

import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const BASE = process.env.SMOKE_BASE_URL || "http://localhost:3000";
const OUT_DIR = process.env.OUT_DIR || "/tmp/screenshots";
const rand = Math.random().toString(36).slice(2, 8);

mkdirSync(OUT_DIR, { recursive: true });

const browser = await chromium.launch({
  executablePath: process.env.PLAYWRIGHT_CHROMIUM,
  args: ["--no-sandbox"],
});
const page = await browser.newPage({ viewport: { width: 900, height: 750 } });

await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
await page.screenshot({ path: `${OUT_DIR}/home.png`, fullPage: true });

await page.goto(`${BASE}/admin/register`, { waitUntil: "networkidle" });
await page.fill('input[name="email"]', `demo-${rand}@example.com`);
await page.fill('input[name="password"]', "supersecret123");
await page.fill('input[name="partner1Name"]', "Ala");
await page.fill('input[name="partner2Name"]', "Kuba");
await page.check('input[name="privacyConsent"]');
// UWAGA: waitForURL musi dopasowywać dokładnie stan PO przekierowaniu
// (?welcome=...), inaczej dopasuje się już do bieżącego /admin/register
// (bo /\/admin/ pasuje też do niego) i wyścignie się z nawigacją.
await Promise.all([page.waitForURL(/\/admin\?welcome=/), page.click('button[type="submit"]')]);

const slug = new URL(page.url()).searchParams.get("welcome");
if (!slug) throw new Error("Rejestracja nie powiodła się - brak parametru ?welcome= w URL-u.");

// Publikujemy stronę, żeby zniknął baner "wersja robocza" na zrzutach.
const publishBtn = page.locator('button:has-text("Opublikuj stronę")');
if (await publishBtn.count()) {
  await Promise.all([page.waitForURL(/\/admin/), publishBtn.click()]);
}

for (const theme of ["cream-gold", "blush-black", "burgundy-gold"]) {
  await page.goto(`${BASE}/admin`, { waitUntil: "networkidle" });
  await page.locator(`input[name="theme"][value="${theme}"]`).click({ force: true });
  await Promise.all([
    page.waitForURL(/\/admin\?saved=1/),
    page.locator('button:has-text("Zapisz")').click(),
  ]);
  await page.goto(`${BASE}/w/${slug}`, { waitUntil: "networkidle" });
  await page.screenshot({ path: `${OUT_DIR}/wedding-${theme}.png`, fullPage: true });
}

await browser.close();
console.log(`Zrzuty zapisane w ${OUT_DIR}/ dla wesela: ${slug}`);
