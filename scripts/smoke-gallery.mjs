// Test end-to-end galerii zdjęć (placeholder do R2) - patrz
// src/lib/photoStorage.ts (limity, kompresja), src/lib/db/photos.ts.
//
// Sprawdza: upload przez gościa i przez parę, że zdjęcie faktycznie jest
// skompresowane (dużo mniejsze niż oryginał), twardy limit
// MAX_PHOTOS_PER_WEDDING, i że usunięcie przez parę zwalnia miejsce w limicie.
//
// Uruchomienie:
//   npm run build && npm run start -- -p 3100   (w jednym terminalu)
//   SMOKE_BASE_URL=http://localhost:3100 npm run smoke:gallery

import { chromium } from "playwright";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE = process.env.SMOKE_BASE_URL || "http://localhost:3000";
const SAMPLE_PHOTO = path.join(__dirname, "..", "public", "demo-photos", "burgundy-gold-rose.jpg");

function assert(cond, msg) {
  if (!cond) throw new Error("FAIL: " + msg);
  console.log("OK: " + msg);
}

const launchOptions = { args: ["--no-sandbox"] };
if (process.env.PLAYWRIGHT_CHROMIUM) {
  launchOptions.executablePath = process.env.PLAYWRIGHT_CHROMIUM;
}

(async () => {
  assert(fs.existsSync(SAMPLE_PHOTO), "przykładowe zdjęcie do testu istnieje: " + SAMPLE_PHOTO);
  const originalSize = fs.statSync(SAMPLE_PHOTO).size;

  const browser = await chromium.launch(launchOptions);
  const context = await browser.newContext();
  const page = await context.newPage();

  const email = `test-gallery-${Date.now()}@example.com`;
  await page.goto(`${BASE}/admin/register`);
  await page.fill('input[name="partner1Name"]', "Wera");
  await page.fill('input[name="partner2Name"]', "Damian");
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', "supertajnehaslo");
  await page.check('input[name="privacyConsent"]');
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/admin\?welcome=/);
  const slug = new URL(page.url()).searchParams.get("welcome");

  const weddingIdMatch = await page
    .locator("a[href*='weddingId=']")
    .first()
    .getAttribute("href");
  const weddingId = new URL(BASE + weddingIdMatch).searchParams.get("weddingId");

  // --- Para wgrywa zdjęcie z panelu ---
  await page.goto(`${BASE}/admin/gallery?weddingId=${weddingId}`);
  await page.setInputFiles('input[name="photo"]', SAMPLE_PHOTO);
  await page.click('button:has-text("Dodaj zdjęcie")');
  await page.waitForSelector("text=Zdjęcia (1/10)");
  assert(true, "para wgrała zdjęcie, licznik pokazuje 1/10");

  // --- Kompresja: pobrane zdjęcie jest wyraźnie mniejsze od oryginału ---
  const imgSrc = await page.locator('img[src*="/uploads/"]').first().getAttribute("src");
  const imgResponse = await page.request.get(BASE + imgSrc);
  assert(imgResponse.ok(), "wgrane zdjęcie jest dostępne pod swoim URL-em");
  const compressedBody = await imgResponse.body();
  assert(
    compressedBody.length < originalSize,
    `skompresowane zdjęcie (${compressedBody.length} B) jest mniejsze niż oryginał (${originalSize} B)`
  );
  assert(
    imgResponse.headers()["content-type"] === "image/jpeg",
    "skompresowane zdjęcie to JPEG niezależnie od formatu wejściowego"
  );

  // --- Widoczne na stronie publicznej ---
  await page.goto(`${BASE}/${slug}`);
  await page.waitForSelector('img[src*="/uploads/"]');
  assert(true, "zdjęcie widoczne na publicznej stronie wesela");

  // --- Gość też może dorzucić zdjęcie ---
  await page.goto(`${BASE}/admin/guests?weddingId=${weddingId}`);
  await page.fill('input[name="firstName"]', "Kuba");
  await page.click('button:has-text("Dodaj gościa")');
  await page.waitForSelector("text=Kuba");
  await page.evaluate(() => {
    window.__copied = null;
    navigator.clipboard.writeText = async (text) => {
      window.__copied = text;
    };
  });
  await page.click('button:has-text("Skopiuj link dla gościa")');
  const inviteUrl = await page.evaluate(() => window.__copied);

  await page.goto(inviteUrl);
  await page.waitForURL(/\/(zgoda|moje-zaproszenie)/);
  if (page.url().includes("/zgoda")) {
    await page.check('input[name="consent"]');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/moje-zaproszenie/);
  }
  await page.setInputFiles('input[name="photo"]', SAMPLE_PHOTO);
  await page.click('button:has-text("Dodaj zdjęcie")');
  await page.waitForURL(/photoSaved=1/);
  assert(true, "gość wgrał własne zdjęcie do wspólnej galerii");

  // --- Twardy limit: dobijamy do 10, sprawdzamy blokadę ---
  await page.goto(`${BASE}/admin/gallery?weddingId=${weddingId}`);
  for (let i = 0; i < 8; i++) {
    await page.setInputFiles('input[name="photo"]', SAMPLE_PHOTO);
    await page.click('button:has-text("Dodaj zdjęcie")');
    await page.waitForSelector(`text=Zdjęcia (${i + 3}/10)`);
  }
  assert(true, "galeria doszła do 10/10");
  assert(
    (await page.locator('input[name="photo"]').count()) === 0,
    "formularz dodawania znika, gdy galeria jest pełna"
  );
  assert(
    (await page.locator("text=Galeria jest pełna").count()) === 1,
    "widoczny komunikat o pełnej galerii"
  );

  // --- Usunięcie zdjęcia zwalnia miejsce ---
  await page.click('button[aria-label="Usuń zdjęcie"]');
  await page.waitForSelector("text=Zdjęcia (9/10)");
  assert(
    (await page.locator('input[name="photo"]').count()) === 1,
    "formularz dodawania wraca po usunięciu jednego zdjęcia"
  );

  await browser.close();
  console.log("\nWSZYSTKIE TESTY GALERII ZDJĘĆ PRZESZŁY POMYŚLNIE");
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
