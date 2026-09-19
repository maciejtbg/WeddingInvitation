// Test stanu DOMYŚLNEGO/produkcyjnego: PAYMENTS_ENABLED nieustawione (albo
// != "true") - cały obszar płatny ma być niewidoczny i nieaktywny, patrz
// isPaymentsEnabled w src/lib/photoPack.ts. Uzupełnienie smoke-payments.mjs,
// który zakłada odwrotnie (PAYMENTS_ENABLED=true) i testuje ścieżkę
// reaktywacji - te dwa skrypty świadomie NIE dają się uruchomić przeciwko
// tej samej instancji serwera (wyłącznik czyta się raz, przy starcie
// procesu), stąd osobny plik zamiast jednego, warunkowego testu.
//
// Uruchomienie (BEZ PAYMENTS_ENABLED w środowisku):
//   npm run build && npm run start -- -p 3100
//   SMOKE_BASE_URL=http://localhost:3100 npm run smoke:payments-disabled

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
  const couple = await (await browser.newContext()).newPage();

  const email = `test-paydisabled-${Date.now()}@example.com`;
  await couple.goto(`${BASE}/admin/register`);
  await couple.fill('input[name="partner1Name"]', "Nel");
  await couple.fill('input[name="partner2Name"]', "Igor");
  await couple.fill('input[name="email"]', email);
  await couple.fill('input[name="password"]', "supertajnehaslo");
  await couple.check('input[name="privacyConsent"]');
  await couple.click('button[type="submit"]');
  await couple.waitForURL(/\/admin\?welcome=/);

  const weddingIdMatch = await couple.locator("a[href*='weddingId=']").first().getAttribute("href");
  const weddingId = new URL(BASE + weddingIdMatch).searchParams.get("weddingId");
  assert(!!weddingId, "rejestracja pary OK, weddingId=" + weddingId);

  await couple.goto(`${BASE}/admin/gallery?weddingId=${weddingId}`);
  await couple.waitForSelector("text=Zdjęcia (0/10)");
  assert(true, "darmowy limit (10 zdjęć) działa niezależnie od wyłącznika płatności");

  assert(
    (await couple.locator('button:has-text("Kup pakiet")').count()) === 0,
    "WYŁĄCZNIK: przycisk zakupu pakietu jest CAŁKOWICIE niewidoczny"
  );
  assert(
    (await couple.locator('input[name="discountCode"]').count()) === 0,
    "WYŁĄCZNIK: pole na kod rabatowy jest niewidoczne"
  );
  await couple.waitForSelector("text=Dokupowanie dodatkowego miejsca będzie dostępne wkrótce");
  assert(true, "WYŁĄCZNIK: galeria pokazuje komunikat 'wkrótce dostępne' zamiast formularza");

  await browser.close();
  console.log("\nWSZYSTKIE TESTY WYŁĄCZONYCH PŁATNOŚCI PRZESZŁY POMYŚLNIE");
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
