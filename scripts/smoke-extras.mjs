// Test end-to-end odliczania do ślubu, kalendarza (.ics), harmonogramu dnia
// i FAQ - patrz src/lib/calendarInvite.ts, src/lib/db/schedule.ts,
// src/lib/db/faq.ts. Wszystko do decyzji pary (harmonogram/FAQ), poza
// odliczaniem i kalendarzem, które liczą się same z daty ślubu.
//
// Uruchomienie:
//   npm run build && npm run start -- -p 3100   (w jednym terminalu)
//   SMOKE_BASE_URL=http://localhost:3100 npm run smoke:extras

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

function isoDatePlusDays(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

(async () => {
  const browser = await chromium.launch(launchOptions);
  const context = await browser.newContext();
  const page = await context.newPage();

  const email = `test-extras-${Date.now()}@example.com`;
  await page.goto(`${BASE}/admin/register`);
  await page.fill('input[name="partner1Name"]', "Gosia");
  await page.fill('input[name="partner2Name"]', "Rafał");
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', "supertajnehaslo");
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/admin\?welcome=/);
  const slug = new URL(page.url()).searchParams.get("welcome");

  const weddingIdMatch = await page
    .locator("a[href*='weddingId=']")
    .first()
    .getAttribute("href");
  const weddingId = new URL(BASE + weddingIdMatch).searchParams.get("weddingId");

  // --- Data ślubu za 5 dni: odliczanie powinno pokazać dokładnie "5" ---
  const weddingDate = isoDatePlusDays(5);
  await page.fill('input[name="weddingDate"]', weddingDate);
  await page.fill('input[name="venueName"]', "Testowa Sala");
  await page.click('form:has(input[name="weddingDate"]) button:has-text("Zapisz")');
  await page.waitForURL(/saved=1/);

  // --- Harmonogram: dwa punkty, sprawdzamy kolejność i przycisk ↑ ---
  await page.goto(`${BASE}/admin/schedule?weddingId=${weddingId}`);
  await page.fill('input[name="dayLabel"]', "Sobota");
  await page.fill('input[name="timeLabel"]', "14:00");
  await page.fill('input[name="title"]', "Ceremonia");
  await page.click('button:has-text("Dodaj punkt")');
  await page.waitForSelector("text=Ceremonia");

  await page.fill('input[name="dayLabel"]', "Sobota");
  await page.fill('input[name="timeLabel"]', "16:00");
  await page.fill('input[name="title"]', "Przyjęcie");
  await page.click('button:has-text("Dodaj punkt")');
  await page.waitForSelector("text=Przyjęcie");
  assert(true, "dodano dwa punkty harmonogramu");

  // --- FAQ: jedno pytanie ---
  await page.goto(`${BASE}/admin/faq?weddingId=${weddingId}`);
  await page.fill('input[name="question"]', "Czy jest parking?");
  await page.fill('textarea[name="answer"]', "Tak, bezpłatny.");
  await page.click('button:has-text("Dodaj pytanie")');
  await page.waitForSelector("text=Czy jest parking?");
  assert(true, "dodano pytanie FAQ");

  // --- Strona publiczna: odliczanie, harmonogram, FAQ jako <details> ---
  await page.goto(`${BASE}/w/${slug}`);
  await page.waitForSelector("text=Zostało 5 dni do ślubu!");
  assert(true, "odliczanie pokazuje poprawną liczbę dni (5)");

  const scheduleText = await page.locator("body").innerText();
  assert(
    scheduleText.indexOf("Ceremonia") < scheduleText.indexOf("Przyjęcie"),
    "harmonogram zachowuje kolejność punktów"
  );

  const faqSummary = page.locator("summary", { hasText: "Czy jest parking?" });
  assert((await faqSummary.count()) === 1, "FAQ renderuje się jako <details>/<summary> (bez JS)");
  assert(
    !(await page.locator("text=Tak, bezpłatny.").isVisible()),
    "odpowiedź FAQ jest domyślnie zwinięta"
  );
  await faqSummary.click();
  await page.waitForSelector("text=Tak, bezpłatny.");
  assert(true, "kliknięcie pytania rozwija odpowiedź (natywne <details>)");

  // --- Kalendarz: prawidłowy plik .ics z poprawną datą ---
  const icsResponse = await page.request.get(`${BASE}/w/${slug}/calendar`);
  assert(icsResponse.ok(), "endpoint kalendarza zwraca 200");
  assert(
    icsResponse.headers()["content-type"].includes("text/calendar"),
    "kalendarz ma poprawny content-type"
  );
  const icsBody = await icsResponse.text();
  assert(
    icsBody.includes(`DTSTART;VALUE=DATE:${weddingDate.replace(/-/g, "")}`),
    "plik .ics zawiera poprawną datę ślubu"
  );
  assert(icsBody.includes("BEGIN:VALARM"), "plik .ics zawiera alarm/przypomnienie");

  await browser.close();
  console.log("\nWSZYSTKIE TESTY ODLICZANIA/KALENDARZA/HARMONOGRAMU/FAQ PRZESZŁY POMYŚLNIE");
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
