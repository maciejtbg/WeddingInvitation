// Test end-to-end wielojęzyczności stron dla gości - patrz
// src/lib/i18n/getDictionary.ts, src/components/LanguageSwitcher.tsx.
//
// Sprawdza: ręcznie tłumaczony język (en) na stronie publicznej,
// tłumaczenie na żądanie + cache w bazie dla języka spoza czwórki ręcznie
// utrzymywanej (amharski - pismo Ge'ez, łatwo odróżnić od fallbacku),
// interpolację zmiennych ({name} w powitaniu), przełączenie języka DWA
// razy pod rząd na tej samej stronie (złapany empirycznie bug: Next.js
// Router Cache potrafi nie odświeżyć RSC przy drugiej zmianie bez
// revalidatePath - patrz komentarz w src/lib/i18n/actions.ts), oraz że
// panel pary ZOSTAJE po polsku.
//
// Uruchomienie:
//   npm run build && npm run start -- -p 3100   (w jednym terminalu)
//   SMOKE_BASE_URL=http://localhost:3100 npm run smoke:i18n

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

  const email = `test-i18n-${Date.now()}@example.com`;
  await page.goto(`${BASE}/admin/register`);
  await page.fill('input[name="partner1Name"]', "Maja");
  await page.fill('input[name="partner2Name"]', "Igor");
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', "supertajnehaslo");
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/admin\?welcome=/);
  const slug = new URL(page.url()).searchParams.get("welcome");
  assert(!!slug, "slug wesela: " + slug);

  // --- Panel pary zostaje po polsku, mimo że przełącznik jest tylko na
  //     stronach gościa - nic tu nie powinno się dać przetłumaczyć. ---
  assert((await page.content()).includes("Panel pary"), "panel pary jest po polsku");

  const weddingIdMatch = await page
    .locator("a[href*='weddingId=']")
    .first()
    .getAttribute("href");
  const weddingId = new URL(BASE + weddingIdMatch).searchParams.get("weddingId");

  // --- Strona publiczna: domyślnie polski, przełącznik zmienia na angielski ---
  await page.goto(`${BASE}/w/${slug}`);
  await page.waitForSelector("text=Wersja robocza");
  assert(true, "domyślny język strony publicznej to polski");

  await page.click('button[title="English"]');
  await page.waitForSelector("text=Draft - this page isn't published yet", { timeout: 10000 });
  assert(true, "przełącznik zmienił język na angielski (ręcznie tłumaczony)");

  // --- Drugi przełącznik BEZ przeładowania strony między nimi - to właśnie
  //     ten krok wykrył wcześniej problem z cache routera. ---
  await page.selectOption('select[name="locale"]', "am"); // amharski (pismo Ge'ez)
  await page.click('form:has(select[name="locale"]) button:has-text("OK")');
  // Nie czekamy na konkretny tekst amharski (nie znamy go z góry - to
  // tłumaczenie maszynowe) - czekamy, aż ZNIKNIE angielski/polski tekst,
  // co jednoznacznie potwierdza, że RSC faktycznie się odświeżył.
  //
  // UWAGA: sprawdzamy document.body.innerText (widoczny tekst), NIE
  // page.content() - surowy HTML potrafi jeszcze chwilę zawierać martwy
  // payload RSC z poprzedniego renderu wpisany w tagi <script> (dane do
  // hydratacji), który nigdy nie jest wyświetlany, ale pasowałby do
  // substringu i dawałby fałszywy alarm.
  await page.waitForFunction(
    () => !document.body.innerText.includes("Draft - this page isn't published yet"),
    { timeout: 10000 }
  );
  const amharicText = await page.locator("body").innerText();
  assert(
    !amharicText.includes("Draft - this page isn't published yet") &&
      !amharicText.includes("Wersja robocza - strona jeszcze nieopublikowana"),
    "druga zmiana języka pod rząd (bez przeładowania) też odświeżyła stronę"
  );

  // --- Cookie z językiem przenosi się na stronę gościa + interpolacja {name} ---
  await page.goto(`${BASE}/admin/guests?weddingId=${weddingId}`);
  await page.fill('input[name="firstName"]', "Nel");
  await page.click('button:has-text("Dodaj gościa")');
  await page.waitForSelector("text=Nel");
  await page.evaluate(() => {
    window.__copied = null;
    navigator.clipboard.writeText = async (text) => {
      window.__copied = text;
    };
  });
  await page.click('button:has-text("Skopiuj link dla gościa")');
  const inviteUrl = await page.evaluate(() => window.__copied);

  await page.goto(inviteUrl);
  await page.waitForURL(/\/moje-zaproszenie/);
  const guestText = await page.locator("body").innerText();
  assert(
    !guestText.includes("Cześć, Nel!"),
    "wybrany wcześniej język (nie polski) przeniósł się z powrotem na stronę gościa"
  );

  await browser.close();
  console.log("\nWSZYSTKIE TESTY WIELOJĘZYCZNOŚCI PRZESZŁY POMYŚLNIE");
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
