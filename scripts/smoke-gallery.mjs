// Test end-to-end galerii zdjęć (placeholder do R2) - patrz
// src/lib/photoStorage.ts (limity, kompresja), src/lib/db/photos.ts.
//
// Sprawdza: upload przez parę (jedyny obecnie dostępny kanał - dodawanie
// przez gości to planowana funkcja premium, patrz komentarz niżej), że
// zdjęcie faktycznie jest skompresowane (dużo mniejsze niż oryginał), twardy
// limit MAX_PHOTOS_PER_WEDDING, i że usunięcie przez parę zwalnia miejsce.
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

  // --- Domyślny motyw (cream-gold) ma gotowe zdjęcie tła hero (patrz
  //     theme.defaultCoverPhoto w src/lib/themes.ts) - widoczne od razu,
  //     jeszcze zanim para cokolwiek wgra. Bez wymogu atrybucji (własny
  //     plik, nie CC BY), więc nie ma widocznego podpisu. ---
  await page.goto(`${BASE}/${slug}`);
  assert(
    (await page.locator("h1.text-white").count()) === 1,
    "świeże wesele (domyślny motyw) ma gotowe zdjęcie hero, zanim para cokolwiek wgra"
  );
  assert(
    (await page.locator("text=/Zdjęcie:.*CC BY/").count()) === 0,
    "domyślne zdjęcie cream-gold nie wymaga atrybucji - brak podpisu"
  );

  // --- burgundy-gold ma domyślne zdjęcie na licencji CC BY - MUSI mieć
  //     widoczną atrybucję (patrz public/demo-photos/CREDITS.md). ---
  await page.goto(`${BASE}/admin`);
  await page
    .locator("label")
    .filter({ has: page.locator('input[name="theme"][value="burgundy-gold"]') })
    .click();
  await page.locator('form:has(input[name="theme"]) button:has-text("Zapisz")').click();
  await page.waitForURL(/saved=1/);
  await page.goto(`${BASE}/${slug}`);
  assert(
    (await page.locator("text=/Zdjęcie:.*Pink Sherbet Photography.*CC BY 2.0/").count()) === 1,
    "domyślne zdjęcie burgundy-gold (CC BY) ma widoczną atrybucję"
  );

  // Wracamy do domyślnego motywu - reszta tego testu nie zależy od koloru
  // motywu, ale trzymajmy stan przewidywalny dla kolejnych kroków.
  await page.goto(`${BASE}/admin`);
  await page
    .locator("label")
    .filter({ has: page.locator('input[name="theme"][value="cream-gold"]') })
    .click();
  await page.locator('form:has(input[name="theme"]) button:has-text("Zapisz")').click();
  await page.waitForURL(/saved=1/);

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

  // --- Zdjęcie "powitalne" (tło hero na stronie głównej) ---
  await page.goto(`${BASE}/admin/gallery?weddingId=${weddingId}`);
  await page.click('button:has-text("Ustaw jako powitalne")');
  await page.waitForSelector("text=Powitalne");
  assert(true, "zdjęcie oznaczone jako powitalne (widoczna plakietka)");

  await page.goto(`${BASE}/${slug}`);
  assert(
    (await page.locator("h1.text-white").count()) === 1,
    "hero na stronie publicznej używa jasnego tekstu, gdy jest zdjęcie powitalne"
  );

  await page.goto(`${BASE}/admin/gallery?weddingId=${weddingId}`);
  await page.click('button:has-text("Usuń z powitalnych")');
  await page.waitForSelector('button:has-text("Ustaw jako powitalne")');
  assert(true, "cofnięcie zdjęcia powitalnego działa");

  // --- Gość NIE może dorzucić zdjęcia - dodawanie przez gości to planowana
  //     funkcja premium, na razie /moje-zaproszenie w ogóle nie pokazuje
  //     galerii (patrz src/app/[slug]/moje-zaproszenie/page.tsx). ---
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
  assert(
    (await page.locator('input[name="photo"]').count()) === 0,
    "gość nie widzi formularza dodawania zdjęć na /moje-zaproszenie (premium na potem)"
  );

  // --- Twardy limit: dobijamy do 10, sprawdzamy blokadę ---
  await page.goto(`${BASE}/admin/gallery?weddingId=${weddingId}`);
  for (let i = 0; i < 9; i++) {
    await page.setInputFiles('input[name="photo"]', SAMPLE_PHOTO);
    await page.click('button:has-text("Dodaj zdjęcie")');
    await page.waitForSelector(`text=Zdjęcia (${i + 2}/10)`);
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
