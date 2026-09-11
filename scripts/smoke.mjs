// Podstawowy test end-to-end całej ścieżki: rejestracja pary -> dodanie
// gościa -> link zaproszenia -> RSVP gościa -> czat w obie strony ->
// sprawdzenie izolacji (gość nie widzi cudzych danych ani panelu admina).
//
// Uruchomienie:
//   1) npm run build && npm run start   (w jednym terminalu, domyślnie port 3000)
//   2) node scripts/smoke.mjs           (w drugim terminalu)
//
// Zmienne środowiskowe:
//   SMOKE_BASE_URL      - adres działającej aplikacji (domyślnie http://localhost:3000)
//   PLAYWRIGHT_CHROMIUM - ścieżka do binarki chromium, jeśli Playwright
//                         nie znajdzie jej sam (rzadko potrzebne)

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

  // --- Para (couple) ---
  const coupleCtx = await browser.newContext();
  const couple = await coupleCtx.newPage();

  const email = `test-${Date.now()}@example.com`;
  await couple.goto(`${BASE}/admin/register`);
  await couple.fill('input[name="partner1Name"]', "Ania");
  await couple.fill('input[name="partner2Name"]', "Kacper");
  await couple.fill('input[name="email"]', email);
  await couple.fill('input[name="password"]', "supertajnehaslo");
  await couple.check('input[name="privacyConsent"]');
  await couple.click('button[type="submit"]');
  await couple.waitForURL(/\/admin\?welcome=/);
  assert(true, "rejestracja pary przekierowała do /admin?welcome=...");

  const url = new URL(couple.url());
  const slug = url.searchParams.get("welcome");
  assert(!!slug, "slug wesela obecny w URL: " + slug);

  const weddingIdMatch = await couple
    .locator("a[href*='weddingId=']")
    .first()
    .getAttribute("href");
  const weddingId = new URL(BASE + weddingIdMatch).searchParams.get("weddingId");
  assert(!!weddingId, "znaleziono weddingId: " + weddingId);

  await couple.goto(`${BASE}/admin/guests?weddingId=${weddingId}`);
  await couple.fill('input[name="firstName"]', "Marek");
  await couple.fill('input[name="lastName"]', "Testowy");
  await couple.fill('input[name="groupLabel"]', "Rodzina Pana Młodego (tajne)");
  await couple.fill('input[name="phone"]', "600100200");
  await couple.fill('input[name="email"]', "marek.testowy@example.com");
  await couple.click('button:has-text("Dodaj gościa")');
  await couple.waitForSelector("text=Marek Testowy");
  assert(true, "gość dodany i widoczny na liście");

  // --- Raport dla pary (liczniki) i przyciski wysyłki (dane kontaktowe) ---
  await couple.waitForSelector("text=jeszcze nie otworzył(a) zaproszenia");
  assert(true, "gość, który jeszcze nie kliknął linku, ma widoczny status w raporcie");
  await couple.waitForSelector('button:has-text("Wyślij mailem")');
  await couple.waitForSelector('button:has-text("Wyślij SMS-em")');
  assert(true, "przyciski wysyłki (mailto:/sms:) widoczne, bo gość ma telefon i e-mail");

  const reportTiles = await couple.locator(".grid.grid-cols-2 p.text-lg").allInnerTexts();
  assert(reportTiles[0] === "1", `raport: liczba gości = ${reportTiles[0]}`);
  assert(reportTiles[2] === "0", `raport: liczba potwierdzeń = ${reportTiles[2]}`);

  // Link kopiowany jest przez JS do schowka - przechwytujemy zamiast
  // klikać "prawdziwy" schowek systemowy (niedostępny w CI/headless).
  await couple.evaluate(() => {
    window.__copied = null;
    navigator.clipboard.writeText = async (text) => {
      window.__copied = text;
    };
  });
  await couple.click('button:has-text("Skopiuj link dla gościa")');
  const inviteUrl = await couple.evaluate(() => window.__copied);
  assert(!!inviteUrl && inviteUrl.includes("/z/"), "przechwycono link zaproszenia");

  await couple.goto(`${BASE}/admin`);
  const publishBtn = couple.locator('button:has-text("Opublikuj stronę")');
  if (await publishBtn.count()) {
    await publishBtn.click();
    await couple.waitForURL(/published=1/);
    assert(true, "strona opublikowana");
  }

  // --- Gość (osobny kontekst = osobne ciasteczka, jak inna przeglądarka) ---
  const guestCtx = await browser.newContext();
  // Wymuszamy polski, żeby test nie zależał od tego, z jakiego kraju
  // faktycznie łączy się maszyna uruchamiająca testy (patrz src/proxy.ts -
  // automatyczne wykrywanie języka po adresie IP przy pierwszym wejściu).
  await guestCtx.addCookies([{ name: "guest_locale", value: "pl", url: BASE }]);
  const guest = await guestCtx.newPage();

  await guest.goto(inviteUrl);
  await guest.waitForURL(/\/(zgoda|moje-zaproszenie)/);
  if (guest.url().includes("/zgoda")) {
    // RODO - pierwsze wejście gościa wymaga potwierdzenia zgody na
    // przetwarzanie danych, zanim zobaczy /moje-zaproszenie - patrz
    // src/app/[slug]/zgoda.
    await guest.check('input[name="consent"]');
    await guest.click('button[type="submit"]');
    await guest.waitForURL(/\/moje-zaproszenie/);
  }
  assert(true, "link zaproszenia przekierował do /moje-zaproszenie (po zgodzie RODO)");

  const guestHtml = await guest.content();
  // Nie wymagamy już, żeby "Marek" był dokładnie w osobnym węźle tekstowym
  // (">Marek<") - odkąd powitanie przechodzi przez i18n (src/lib/i18n),
  // {name} jest podstawiane w jeden połączony string przed renderem, więc
  // w HTML-u sąsiaduje bezpośrednio z resztą zdania, nie z tagiem.
  assert(guestHtml.includes("Cześć") && guestHtml.includes("Marek"), "strona gościa wita go po imieniu");
  assert(
    !guestHtml.includes("Rodzina Pana Młodego"),
    "PRYWATNOŚĆ: gość NIE widzi prywatnej notatki groupLabel pary"
  );

  await guest.click('label:has-text("Tak, będę!")');
  await guest.fill('input[name="dietaryNotes"]', "bez laktozy");
  await guest.click('button:has-text("Zapisz odpowiedź")');
  await guest.waitForURL(/saved=1/);
  assert(true, "RSVP zapisane");

  await guest.fill('input[name="body"]', "Czy mogę przyjechać dzień wcześniej?");
  await guest.click('form:has(input[name="body"]) button:has-text("Wyślij")');
  await guest.waitForSelector("text=Czy mogę przyjechać dzień wcześniej?");
  assert(true, "wiadomość gościa widoczna w jego czacie");

  // --- Weryfikacja z perspektywy pary: RSVP + wiadomość widoczne w panelu ---
  await couple.goto(`${BASE}/admin/guests?weddingId=${weddingId}`);
  const adminGuestsHtml = await couple.content();
  assert(adminGuestsHtml.includes("Przyjdzie"), "panel pary pokazuje status RSVP 'Przyjdzie'");
  assert(
    adminGuestsHtml.includes("otworzył(a) zaproszenie"),
    "raport: gość, który wszedł w link, ma teraz status 'otworzył(a) zaproszenie'"
  );

  const chatLink = await couple.locator("a:has-text('Czat')").first().getAttribute("href");
  await couple.goto(BASE + chatLink);
  await couple.waitForSelector("text=Czy mogę przyjechać dzień wcześniej?");
  assert(true, "para widzi wiadomość gościa w panelu");

  await couple.fill('input[name="body"]', "Jasne, zapraszamy!");
  await couple.click('button:has-text("Wyślij")');
  await couple.waitForSelector("text=Jasne, zapraszamy!");
  assert(true, "odpowiedź pary wysłana");

  await guest.reload();
  const guestHtml2 = await guest.content();
  assert(guestHtml2.includes("Jasne, zapraszamy!"), "gość widzi odpowiedź pary na swoim czacie");

  // --- Testy izolacji ---
  await guest.goto(`${BASE}/admin/guests?weddingId=${weddingId}`);
  await guest.waitForURL(/\/admin\/login/);
  assert(true, "IZOLACJA: sesja gościa nie daje dostępu do panelu admina");

  const fakeCtx = await browser.newContext();
  const fakePage = await fakeCtx.newPage();
  await fakePage.goto(`${BASE}/z/000000000000000000000000000000nieprawidlowy`);
  await fakePage.waitForURL(/error=invalid-invite/);
  assert(true, "IZOLACJA: nieprawidłowy token zaproszenia nie tworzy sesji gościa");

  await browser.close();
  console.log("\nWSZYSTKIE TESTY PRZESZŁY POMYŚLNIE");
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
