// Test end-to-end listy życzeń muzycznych - patrz src/lib/musicSearch.ts
// (darmowe iTunes Search API, bez klucza) i src/lib/db/songRequests.ts.
//
// Uruchomienie:
//   npm run build && npm run start -- -p 3100   (w jednym terminalu)
//   SMOKE_BASE_URL=http://localhost:3100 npm run smoke:music

import { chromium } from "playwright";

const BASE = process.env.SMOKE_BASE_URL || "http://localhost:3000";

function assert(cond, msg) {
  if (!cond) throw new Error("FAIL: " + msg);
  console.log("OK: " + msg);
}

const launchOptions = { args: ["--no-sandbox"] };
if (process.env.PLAYWRIGHT_CHROMIUM) {
  launchOptions.executablePath = process.env.PLAYWRIGHT_CHROMIUM;
}

(async () => {
  const browser = await chromium.launch(launchOptions);
  const context = await browser.newContext();
  const page = await context.newPage();

  const email = `test-music-${Date.now()}@example.com`;
  await page.goto(`${BASE}/admin/register`);
  await page.fill('input[name="partner1Name"]', "Julia");
  await page.fill('input[name="partner2Name"]', "Kamil");
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', "supertajnehaslo");
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/admin\?welcome=/);

  const weddingIdMatch = await page
    .locator("a[href*='weddingId=']")
    .first()
    .getAttribute("href");
  const weddingId = new URL(BASE + weddingIdMatch).searchParams.get("weddingId");

  await page.goto(`${BASE}/admin/guests?weddingId=${weddingId}`);
  await page.fill('input[name="firstName"]', "Ola");
  await page.click('button:has-text("Dodaj gościa")');
  await page.waitForSelector("text=Ola");
  await page.evaluate(() => {
    window.__copied = null;
    navigator.clipboard.writeText = async (text) => {
      window.__copied = text;
    };
  });
  await page.click('button:has-text("Skopiuj link dla gościa")');
  const inviteUrl = await page.evaluate(() => window.__copied);

  // --- Gość szuka utworu (bez potwierdzonego RSVP - to celowo działa
  //     zawsze, "nawet w trakcie ślubu") ---
  await page.goto(inviteUrl);
  await page.waitForURL(/\/moje-zaproszenie/);
  await page.click("text=Poproś o piosenkę");
  await page.waitForURL(/\/muzyka/);

  await page.fill('input[name="q"]', "perfect ed sheeran");
  await page.click('button:has-text("Szukaj")');
  await page.waitForSelector('button:has-text("Dodaj")', { timeout: 10000 });
  const resultCount = await page.locator('button:has-text("Dodaj")').count();
  assert(resultCount > 0, `wyszukiwarka zwróciła wyniki (${resultCount})`);

  const firstResultImg = await page.locator('img[alt=""]').first().getAttribute("src");
  assert(!!firstResultImg && firstResultImg.startsWith("http"), "wynik wyszukiwania ma okładkę");

  await page.locator('button:has-text("Dodaj")').first().click();
  await page.waitForURL(/added=1/);
  assert(true, "gość dodał piosenkę do listy");

  const wishlistText = await page.locator("body").innerText();
  assert(wishlistText.includes("Zgłoszone piosenki"), "sekcja wspólnej listy jest widoczna");
  assert(wishlistText.includes("Perfect") || wishlistText.includes("perfect"), "dodana piosenka jest na wspólnej liście");

  assert((await page.locator("audio").count()) > 0, "piosenka na liście ma odtwarzacz podglądu (natywny <audio>)");

  // --- Para widzi zgłoszenie w panelu i może je usunąć ---
  await page.goto(`${BASE}/admin/music?weddingId=${weddingId}`);
  await page.waitForSelector("text=Ed Sheeran");
  assert(true, "para widzi zgłoszenie w panelu moderacji");

  await page.click('button:has-text("Usuń")');
  await page.waitForSelector("text=Nikt jeszcze nie poprosił o piosenkę");
  assert(true, "para usunęła zgłoszenie");

  await browser.close();
  console.log("\nWSZYSTKIE TESTY LISTY MUZYCZNEJ PRZESZŁY POMYŚLNIE");
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
