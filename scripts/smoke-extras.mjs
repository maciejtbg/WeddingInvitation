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

// UWAGA: celowo NIE toISOString() - ono liczy w UTC, a data ślubu (jak z
// natywnego <input type="date">, i jak liczy ją daysUntilWedding w
// src/lib/weddingCountdown.ts) to zawsze data w lokalnej strefie czasowej.
// W okolicach północy w strefie przed UTC (np. Polska, UTC+1/+2) te dwa
// się rozjeżdżają o dzień - złapane empirycznie: test uruchomiony 01:12
// czasu lokalnego (23:12 UTC dnia poprzedniego) liczył "+5 dni" od
// niewłaściwego dnia i odliczanie na stronie pokazywało o jeden dzień mniej.
function isoDatePlusDays(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
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
  await page.check('input[name="privacyConsent"]');
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
  await page.goto(`${BASE}/${slug}`);
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

  // --- Ta sama treść (odliczanie/harmonogram/FAQ) na spersonalizowanej
  //     stronie gościa /moje-zaproszenie, nie tylko na stronie publicznej ---
  await page.goto(`${BASE}/admin/guests?weddingId=${weddingId}`);
  await page.fill('input[name="firstName"]', "Nela");
  await page.click('button:has-text("Dodaj gościa")');
  await page.waitForSelector("text=Nela");
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
  await page.waitForSelector("text=Zostało 5 dni do ślubu!");
  assert(true, "gość na /moje-zaproszenie widzi odliczanie do ślubu");

  const guestPageText = await page.locator("body").innerText();
  assert(
    guestPageText.indexOf("Ceremonia") < guestPageText.indexOf("Przyjęcie"),
    "gość na /moje-zaproszenie widzi harmonogram we właściwej kolejności"
  );
  assert(
    (await page.locator("summary", { hasText: "Czy jest parking?" }).count()) === 1,
    "gość na /moje-zaproszenie widzi FAQ"
  );

  // --- Kalendarz: prawidłowy plik .ics z poprawną datą ---
  const icsResponse = await page.request.get(`${BASE}/${slug}/calendar`);
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
