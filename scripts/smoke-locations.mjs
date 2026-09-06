// Test end-to-end miejsc na mapie OSM (ceremonia/przyjęcie/poprawiny) -
// patrz src/lib/db/locations.ts, src/components/LocationMapPicker.tsx,
// src/components/LocationsMap.tsx.
//
// Uruchomienie:
//   npm run build && npm run start -- -p 3100   (w jednym terminalu)
//   SMOKE_BASE_URL=http://localhost:3100 npm run smoke:locations

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

  const email = `test-locations-${Date.now()}@example.com`;
  await page.goto(`${BASE}/admin/register`);
  await page.fill('input[name="partner1Name"]', "Nina");
  await page.fill('input[name="partner2Name"]', "Filip");
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', "supertajnehaslo");
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/admin\?welcome=/);

  const weddingIdMatch = await page
    .locator("a[href*='weddingId=']")
    .first()
    .getAttribute("href");
  const weddingId = new URL(BASE + weddingIdMatch).searchParams.get("weddingId");
  const slugMatch = new URL(page.url()).searchParams.get("welcome");
  assert(!!slugMatch, "slug wesela: " + slugMatch);

  await page.goto(`${BASE}/admin/locations?weddingId=${weddingId}`);
  await page.waitForSelector(".leaflet-container", { state: "visible", timeout: 15000 });
  assert(true, "mapa wyboru miejsca się załadowała");

  await page.fill('input[name="label"]', "Kaplica w parku");
  // Klik na środek kanwy mapy zamiast wyszukiwarki - nie polegamy na
  // dostępności/limitach Nominatim w teście automatycznym.
  const mapBox = await page.locator(".leaflet-container").first().boundingBox();
  await page.mouse.click(mapBox.x + mapBox.width / 2, mapBox.y + mapBox.height / 2);

  const latValue = await page.locator('input[name="lat"]').inputValue();
  assert(latValue !== "" && !Number.isNaN(Number.parseFloat(latValue)), "kliknięcie na mapę ustawiło lat: " + latValue);

  await page.click('button:has-text("Dodaj miejsce")');
  await page.waitForSelector("text=Kaplica w parku");
  assert(true, "miejsce zapisane i widoczne na liście");

  // --- Strona publiczna: mapa + linki do nawigacji ---
  await page.goto(`${BASE}/w/${slugMatch}`);
  await page.waitForSelector(".leaflet-container", { state: "visible", timeout: 15000 });
  assert((await page.content()).includes("Jak do nas trafić"), "sekcja mapy widoczna na stronie publicznej");
  assert((await page.content()).includes("Kaplica w parku"), "legenda pod mapą wymienia dodane miejsce");

  await page.waitForSelector(".leaflet-marker-icon", { timeout: 10000 });
  const markerCount = await page.locator(".leaflet-marker-icon").count();
  assert(markerCount === 1, "dokładnie jedna pinezka na mapie (jedno dodane miejsce)");

  await page.locator(".leaflet-marker-icon").first().click();
  await page.waitForSelector(".leaflet-popup-content");
  const popupLinks = await page.locator(".leaflet-popup-content a").allTextContents();
  assert(
    popupLinks.includes("Google Maps") && popupLinks.includes("Apple Maps"),
    "popup pinezki ma linki do Google Maps i Apple Maps"
  );

  // --- Usunięcie miejsca ---
  await page.goto(`${BASE}/admin/locations?weddingId=${weddingId}`);
  await page.click('button:has-text("Usuń")');
  await page.waitForSelector("text=Nie dodaliście jeszcze żadnego miejsca");
  assert(true, "usunięcie miejsca działa");

  await browser.close();
  console.log("\nWSZYSTKIE TESTY MIEJSC/MAPY PRZESZŁY POMYŚLNIE");
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
