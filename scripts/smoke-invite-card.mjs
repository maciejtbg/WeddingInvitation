// Test end-to-end karty zaproszenia (QR + kod ręczny) i logowania gościa
// przez /kod - patrz src/lib/inviteCard.ts, src/app/kod/.
//
// Uruchomienie:
//   npm run build && npm run start -- -p 3100   (w jednym terminalu)
//   SMOKE_BASE_URL=http://localhost:3100 npm run smoke:invite-card

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

  const coupleCtx = await browser.newContext();
  const couple = await coupleCtx.newPage();

  const email = `test-invite-card-${Date.now()}@example.com`;
  await couple.goto(`${BASE}/admin/register`);
  await couple.fill('input[name="partner1Name"]', "Iga");
  await couple.fill('input[name="partner2Name"]', "Adam");
  await couple.fill('input[name="email"]', email);
  await couple.fill('input[name="password"]', "supertajnehaslo");
  await couple.check('input[name="privacyConsent"]');
  await couple.click('button[type="submit"]');
  await couple.waitForURL(/\/admin\?welcome=/);

  const weddingIdMatch = await couple
    .locator("a[href*='weddingId=']")
    .first()
    .getAttribute("href");
  const weddingId = new URL(BASE + weddingIdMatch).searchParams.get("weddingId");

  await couple.goto(`${BASE}/admin/guests?weddingId=${weddingId}`);
  await couple.fill('input[name="firstName"]', "Babcia");
  await couple.click('button:has-text("Dodaj gościa")');
  await couple.waitForSelector("text=Babcia");
  assert(true, "gość dodany");

  const codeText = await couple.locator('a[href*="invite-card"]').first().getAttribute("title");
  const shortCode = codeText.replace("Kod ręczny: ", "").trim();
  assert(/^[A-Z2-9]{4}-[A-Z2-9]{4}$/.test(shortCode), "wygenerowany kod ma poprawny format: " + shortCode);

  const cardUrl = await couple.locator('a[href*="invite-card"]').first().getAttribute("href");
  const cardResponse = await couple.request.get(BASE + new URL(BASE + cardUrl).pathname + new URL(BASE + cardUrl).search);
  assert(cardResponse.ok(), "endpoint karty zaproszenia zwraca 200");
  assert(
    cardResponse.headers()["content-type"] === "image/png",
    "karta zaproszenia to prawdziwy PNG"
  );
  const cardBody = await cardResponse.body();
  assert(cardBody.length > 10000, "obrazek karty ma sensowny rozmiar (nie jest pusty/uszkodzony)");

  // --- Wybór wariantu graficznego karty (klasyczna/nowoczesna/romantyczna) ---
  await couple.goto(`${BASE}/admin/invite-card?weddingId=${weddingId}`);
  await couple.waitForSelector("text=Klasyczna");
  assert(
    (await couple.locator("text=Aktualnie wybrana").count()) === 1,
    "domyślny wariant (Klasyczna) jest od razu oznaczony jako wybrany"
  );
  await couple
    .locator("form", { has: couple.locator('input[value="modern"]') })
    .locator('button:has-text("Wybierz ten wariant")')
    .click();
  await couple.waitForURL(/saved=1/);
  assert(
    (await couple.locator("text=Zapisano wybrany styl karty.").count()) === 1,
    "zapisanie wariantu pokazuje potwierdzenie"
  );
  assert(
    (await couple.locator("text=Aktualnie wybrana").count()) === 1,
    "po zapisaniu dokładnie jeden wariant (Nowoczesna) jest oznaczony jako wybrany"
  );

  // --- Logowanie kodem: normalizacja (małe litery, spacja zamiast myślnika) ---
  const guestCtx = await browser.newContext();
  const guest = await guestCtx.newPage();
  await guest.goto(`${BASE}/kod`);
  await guest.fill('input[name="code"]', shortCode.toLowerCase().replace("-", " "));
  await guest.click('button:has-text("Otwórz moje zaproszenie")');
  await guest.waitForURL(/\/(zgoda|moje-zaproszenie)/);
  if (guest.url().includes("/zgoda")) {
    await guest.check('input[name="consent"]');
    await guest.click('button[type="submit"]');
    await guest.waitForURL(/\/moje-zaproszenie/);
  }
  assert(
    (await guest.content()).includes("Cześć, Babcia"),
    "kod (małe litery, spacja) zalogował właściwego gościa mimo innego formatu"
  );

  // --- Zły kod: czytelny komunikat, bez crasha ---
  const badCtx = await browser.newContext();
  const badPage = await badCtx.newPage();
  await badPage.goto(`${BASE}/kod`);
  await badPage.fill('input[name="code"]', "0000-0000");
  await badPage.click('button:has-text("Otwórz moje zaproszenie")');
  await badPage.waitForURL(/error=invalid/);
  assert(
    (await badPage.content()).includes("Nie rozpoznajemy tego kodu"),
    "zły kod pokazuje czytelny komunikat zamiast błędu 500"
  );

  await browser.close();
  console.log("\nWSZYSTKIE TESTY KARTY ZAPROSZENIA PRZESZŁY POMYŚLNIE");
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
