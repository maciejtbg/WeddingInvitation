// Test end-to-end planera stołów: rejestracja pary -> dodanie gościa ->
// planer -> dodanie stołu -> przypisanie gościa do miejsca -> weryfikacja,
// że gość na swojej stronie widzi WYŁĄCZNIE nazwę własnego stołu, nigdy
// planu całej sali.
//
// WAŻNE - NIE dodawaj `--disable-gpu` do launchOptions poniżej. W tym
// projekcie ta flaga wymusza w headless Chromium czyste software rendering
// (swiftshader), a Konva rysując pierwszy prawdziwy kształt na kanwie w tym
// trybie wpada w patologicznie wolną ścieżkę wykonania - strona zawiesza
// się na ~90-96% jednego rdzenia CPU bez żadnego błędu w konsoli. To nie
// jest bug w kodzie tej aplikacji, tylko interakcja Konva + headless
// Chromium bez GPU (potwierdzone empirycznie: podłączenie się CDP
// Debugger.pause do zawieszonej strony pokazało głęboką, powtarzającą się
// rekurencję wewnątrz skompilowanego kodu Konva). Zostaw tylko --no-sandbox,
// tak jak w scripts/smoke.mjs.
//
// Uruchomienie:
//   npm run build && npm run start -- -p 3100   (w jednym terminalu)
//   SMOKE_BASE_URL=http://localhost:3100 npm run smoke:tables

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

  // --- Para: rejestracja + gość ---
  const coupleCtx = await browser.newContext();
  const couple = await coupleCtx.newPage();

  const email = `test-tables-${Date.now()}@example.com`;
  await couple.goto(`${BASE}/admin/register`);
  await couple.fill('input[name="partner1Name"]', "Ola");
  await couple.fill('input[name="partner2Name"]', "Tomek");
  await couple.fill('input[name="email"]', email);
  await couple.fill('input[name="password"]', "supertajnehaslo");
  await couple.click('button[type="submit"]');
  await couple.waitForURL(/\/admin\?welcome=/);
  assert(true, "rejestracja pary przekierowała do /admin?welcome=...");

  const weddingIdMatch = await couple
    .locator("a[href*='weddingId=']")
    .first()
    .getAttribute("href");
  const weddingId = new URL(BASE + weddingIdMatch).searchParams.get("weddingId");
  assert(!!weddingId, "znaleziono weddingId: " + weddingId);

  await couple.goto(`${BASE}/admin/guests?weddingId=${weddingId}`);
  await couple.fill('input[name="firstName"]', "Zofia");
  await couple.fill('input[name="lastName"]', "Testowa");
  await couple.click('button:has-text("Dodaj gościa")');
  await couple.waitForSelector("text=Zofia Testowa");
  assert(true, "gość dodany i widoczny na liście");

  await couple.evaluate(() => {
    window.__copied = null;
    navigator.clipboard.writeText = async (text) => {
      window.__copied = text;
    };
  });
  await couple.click('button:has-text("Skopiuj link dla gościa")');
  const inviteUrl = await couple.evaluate(() => window.__copied);
  assert(!!inviteUrl && inviteUrl.includes("/z/"), "przechwycono link zaproszenia gościa");

  // --- Planer stołów ---
  await couple.goto(`${BASE}/admin/tables`);
  await couple.waitForSelector("canvas", { state: "visible", timeout: 15000 });
  assert(true, "planer stołów się załadował, kanwa widoczna");

  await couple.click('button:has-text("+ Stół okrągły")');
  await couple.waitForSelector("text=Miejsca (8)", { timeout: 10000 });
  assert(true, "dodano stół okrągły z 8 miejscami, panel boczny go pokazuje");

  const select = couple.locator("select").first();
  await select.selectOption({ label: "Zofia Testowa" });
  await couple.waitForSelector("text=Zofia Testowa");
  assert(true, "gość przypisany do miejsca przy stole");

  // --- Gość: widzi WYŁĄCZNIE własny stolik, nigdy plan sali ---
  const guestCtx = await browser.newContext();
  const guest = await guestCtx.newPage();
  await guest.goto(inviteUrl);
  await guest.waitForURL(/\/moje-zaproszenie/);

  const guestHtml = await guest.content();
  assert(guestHtml.includes("Twój stolik"), "gość widzi sekcję 'Twój stolik'");
  assert(guestHtml.includes("Stół 1"), "gość widzi nazwę swojego stołu");
  assert(
    !(await guest.locator("canvas").count()),
    "PRYWATNOŚĆ: strona gościa nie ładuje kanwy planera (widzi tylko tekstowy wpis o swoim stole)"
  );

  // --- Odłączenie gościa od stołu z panelu pary ---
  await couple.goto(`${BASE}/admin/tables`);
  await couple.waitForSelector("canvas", { state: "visible", timeout: 15000 });
  await couple.locator("canvas").first().click({ position: { x: 120, y: 120 } });
  await couple.waitForSelector("text=Miejsca (8)", { timeout: 10000 });
  // UWAGA: na stronie są DWA przyciski "Usuń" naraz, gdy stół jest wybrany -
  // ten w górnym pasku (usuwa cały stół, za oknem confirm()) i ten przy
  // zajętym miejscu (odłącza gościa). page.click() (stare API) klika po
  // cichu PIERWSZY pasujący element bez sprawdzania jednoznaczności - trzeba
  // więc jawnie wziąć .last(), bo wiersz miejsca w DOM jest zawsze PO pasku
  // narzędzi z akcjami stołu.
  await couple.locator('button:has-text("Usuń")').last().click();
  // Wszystkie 8 miejsc znowu bez przypisania = 8 widocznych <select> w panelu
  // bocznym. Nie sprawdzamy tekstu "— przypisz gościa —" przez waitForSelector,
  // bo to opcja wewnątrz <select> - Playwright nigdy nie uzna jej za "visible".
  await couple.waitForFunction(() => document.querySelectorAll("select").length === 8);
  assert(true, "odłączenie gościa od stołu zwolniło miejsce");

  await browser.close();
  console.log("\nWSZYSTKIE TESTY PLANERA STOŁÓW PRZESZŁY POMYŚLNIE");
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
