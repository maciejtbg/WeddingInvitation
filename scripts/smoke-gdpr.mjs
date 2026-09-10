// Test end-to-end zgodności z RODO/GDPR - patrz src/lib/db/consents.ts,
// src/lib/dataRetention.ts, src/app/[slug]/zgoda, src/app/[slug]/usun-dane,
// src/app/admin/privacy.
//
// Sprawdza: rejestrację BEZ zaznaczonej zgody (odrzucona), politykę
// prywatności (publiczna, bez sesji), bramę zgody dla nowego gościa (nie da
// się pominąć), że zwracający gość z ważną zgodą NIE widzi bramy drugi raz,
// samodzielne usunięcie danych przez gościa (znika z panelu pary), oraz
// usunięcie całego konta pary (kaskada + zdjęcia z dysku, strona wesela
// przestaje istnieć).
//
// Uruchomienie:
//   npm run build && npm run start -- -p 3100   (w jednym terminalu)
//   SMOKE_BASE_URL=http://localhost:3100 npm run smoke:gdpr

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

async function registerCouple(page, { email, partner1, partner2, skipConsent = false }) {
  await page.goto(`${BASE}/admin/register`);
  await page.fill('input[name="partner1Name"]', partner1);
  await page.fill('input[name="partner2Name"]', partner2);
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', "supertajnehaslo");
  if (!skipConsent) {
    await page.check('input[name="privacyConsent"]');
  }
  await page.click('button[type="submit"]');
}

(async () => {
  const browser = await chromium.launch(launchOptions);

  // --- Polityka prywatności jest publiczna, bez żadnej sesji ---
  const anonCtx = await browser.newContext();
  const anon = await anonCtx.newPage();
  await anon.goto(`${BASE}/polityka-prywatnosci`);
  const policyText = await anon.locator("body").innerText();
  assert(
    policyText.includes("Administrator danych") || policyText.includes("Twoje prawa"),
    "polityka prywatności jest publicznie dostępna i zawiera oczekiwane sekcje"
  );

  // --- Rejestracja BEZ zaznaczonej zgody jest odrzucona ---
  const rejectCtx = await browser.newContext();
  const rejectPage = await rejectCtx.newPage();
  await registerCouple(rejectPage, {
    email: `test-gdpr-noconsent-${Date.now()}@example.com`,
    partner1: "Bez",
    partner2: "Zgody",
    skipConsent: true,
  });
  await rejectPage.waitForURL(/error=consent/);
  assert(true, "rejestracja bez zaznaczonej zgody na politykę prywatności jest odrzucona");

  // --- Właściwa para ---
  const coupleCtx = await browser.newContext();
  const couple = await coupleCtx.newPage();
  const email = `test-gdpr-${Date.now()}@example.com`;
  await registerCouple(couple, { email, partner1: "Nika", partner2: "Olek" });
  await couple.waitForURL(/\/admin\?welcome=/);
  const slug = new URL(couple.url()).searchParams.get("welcome");
  assert(!!slug, "rejestracja z zaznaczoną zgodą się powiodła: " + slug);

  const weddingIdMatch = await couple
    .locator("a[href*='weddingId=']")
    .first()
    .getAttribute("href");
  const weddingId = new URL(BASE + weddingIdMatch).searchParams.get("weddingId");

  await couple.goto(`${BASE}/admin/guests?weddingId=${weddingId}`);
  await couple.fill('input[name="firstName"]', "Gość");
  await couple.fill('input[name="lastName"]', "Testowy");
  await couple.click('button:has-text("Dodaj gościa")');
  await couple.waitForSelector("text=Gość Testowy");

  await couple.evaluate(() => {
    window.__copied = null;
    navigator.clipboard.writeText = async (text) => {
      window.__copied = text;
    };
  });
  await couple.click('button:has-text("Skopiuj link dla gościa")');
  const inviteUrl = await couple.evaluate(() => window.__copied);
  assert(!!inviteUrl, "przechwycono link zaproszenia gościa");

  // --- Pierwsze wejście gościa: brama zgody, nie da się jej pominąć ---
  const guestCtx = await browser.newContext();
  const guest = await guestCtx.newPage();
  await guest.goto(inviteUrl);
  await guest.waitForURL(/\/zgoda/);
  assert(true, "nowy gość trafia na bramę zgody RODO zamiast prosto na /moje-zaproszenie");

  // Próba wysłania formularza bez zaznaczenia checkboxa - musi wrócić na /zgoda.
  await guest.click('button[type="submit"]');
  await guest.waitForURL(/\/zgoda\?error=required/);
  assert(true, "próba przejścia dalej bez zaznaczenia zgody jest odrzucona");

  // Bezpośrednie wejście na /moje-zaproszenie bez zgody (np. wpisane ręcznie
  // z adresu paska, z pominięciem bramy) MUSI zawrócić na /zgoda - sama
  // sesja gościa (którą route handler /z/[token] tworzy PRZED sprawdzeniem
  // zgody) nie może wystarczać do zobaczenia formularzy z danymi.
  await guest.goto(`${BASE}/${slug}/moje-zaproszenie`);
  await guest.waitForURL(/\/zgoda/);
  assert(true, "OMIJANIE BRAMY: bezpośrednie wejście na /moje-zaproszenie bez zgody zawraca na /zgoda");

  await guest.goto(inviteUrl);
  await guest.waitForURL(/\/zgoda/);
  await guest.check('input[name="consent"]');
  await guest.click('button[type="submit"]');
  await guest.waitForURL(/\/moje-zaproszenie/);
  assert(true, "po zaznaczeniu zgody gość przechodzi do /moje-zaproszenie");

  // --- Zwracający gość z ważną zgodą NIE widzi bramy drugi raz ---
  await guest.goto(inviteUrl);
  await guest.waitForURL(/\/moje-zaproszenie/);
  assert(true, "zwracający gość z ważną zgodą trafia prosto na /moje-zaproszenie");

  // --- Link do polityki i "Usuń moje dane" widoczne na stronie gościa ---
  const guestPageText = await guest.locator("body").innerText();
  assert(guestPageText.includes("Usuń moje dane"), "link 'Usuń moje dane' widoczny dla gościa");

  // --- Samodzielne usunięcie danych przez gościa ---
  await guest.click("text=Usuń moje dane");
  await guest.waitForURL(/\/usun-dane/);
  await guest.click('button:has-text("Tak, usuń moje dane")');
  await guest.waitForURL(/deleted=1/);
  assert(true, "gość usunął swoje dane i wrócił na stronę publiczną z potwierdzeniem");

  await couple.goto(`${BASE}/admin/guests?weddingId=${weddingId}`);
  const guestsHtml = await couple.content();
  assert(
    !guestsHtml.includes("Gość Testowy") && !guestsHtml.includes("Testowy"),
    "PRAWO DO USUNIĘCIA: gość zniknął z listy gości pary po samodzielnym usunięciu danych"
  );

  // Ponowne wejście tym samym (już nieważnym) linkiem nie tworzy z powrotem gościa.
  const staleCtx = await browser.newContext();
  const stalePage = await staleCtx.newPage();
  await stalePage.goto(inviteUrl);
  await stalePage.waitForURL(/error=invalid-invite/);
  assert(true, "link zaproszenia usuniętego gościa przestał działać");

  // --- Retencja: ręczne wyzwolenie czyszczenia z panelu pary ---
  await couple.goto(`${BASE}/admin/guests?weddingId=${weddingId}`);
  await couple.fill('input[name="firstName"]', "DoWyczyszczenia");
  await couple.click('button:has-text("Dodaj gościa")');
  await couple.waitForSelector("text=DoWyczyszczenia");

  await couple.goto(`${BASE}/admin/privacy`);
  await couple.click('button:has-text("Wyczyść teraz dane wszystkich gości")');
  await couple.waitForURL(/purged=1/);
  assert(true, "ręczne czyszczenie retencyjne z panelu pary zakończone");

  await couple.goto(`${BASE}/admin/guests?weddingId=${weddingId}`);
  const afterPurgeHtml = await couple.content();
  assert(
    !afterPurgeHtml.includes("DoWyczyszczenia"),
    "RETENCJA: po ręcznym czyszczeniu lista gości jest pusta"
  );

  // --- Usunięcie całego konta pary ---
  await couple.goto(`${BASE}/admin/privacy`);
  await couple.click('a:has-text("Usuń konto i wszystkie dane")');
  await couple.waitForURL(/confirmDelete=1/);
  await couple.click('button:has-text("Tak, usuń trwale wszystko")');
  await couple.waitForURL(`${BASE}/?accountDeleted=1`);
  assert(true, "konto pary usunięte, przekierowanie na stronę główną");

  const publicCtx = await browser.newContext();
  const publicPage = await publicCtx.newPage();
  const publicResponse = await publicPage.goto(`${BASE}/${slug}`);
  assert(publicResponse.status() === 404, "PRAWO DO USUNIĘCIA: strona usuniętego wesela znika (404)");

  await couple.goto(`${BASE}/admin`);
  await couple.waitForURL(/\/admin\/login/);
  assert(true, "sesja usuniętej pary nie daje już dostępu do panelu");

  await browser.close();
  console.log("\nWSZYSTKIE TESTY RODO/GDPR PRZESZŁY POMYŚLNIE");
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
