// Test end-to-end trybów rozmieszczania gości (src/lib/seatingModes.ts):
// GUEST_SELF_SELECT (gość wybiera sam), GUEST_REQUEST (gość prosi, para
// akceptuje) i GROUP_CONSTRAINED (gość wybiera, ale tylko w obrębie stołów
// dozwolonych jego grupie). COUPLE_ONLY jest już pokryty przez
// scripts/smoke-tables.mjs (para przypisuje ręcznie w planerze).
//
// Uruchomienie:
//   npm run build && npm run start -- -p 3100   (w jednym terminalu)
//   SMOKE_BASE_URL=http://localhost:3100 npm run smoke:seating

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

async function setSeatingMode(couplePage, mode) {
  await couplePage.evaluate((m) => {
    const radio = document.querySelector(`input[name="seatingMode"][value="${m}"]`);
    radio.checked = true;
    radio.closest("form").requestSubmit();
  }, mode);
  await couplePage.waitForURL(/saved=1/);
}

(async () => {
  const browser = await chromium.launch(launchOptions);

  const coupleCtx = await browser.newContext();
  const couple = await coupleCtx.newPage();

  const email = `test-seating-${Date.now()}@example.com`;
  await couple.goto(`${BASE}/admin/register`);
  await couple.fill('input[name="partner1Name"]', "Ewa");
  await couple.fill('input[name="partner2Name"]', "Bartek");
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
  assert(!!weddingId, "znaleziono weddingId: " + weddingId);

  await couple.goto(`${BASE}/admin/guests?weddingId=${weddingId}`);
  await couple.fill('input[name="firstName"]', "Zosia");
  await couple.click('button:has-text("Dodaj gościa")');
  await couple.waitForSelector("text=Zosia");
  await couple.evaluate(() => {
    window.__copied = null;
    navigator.clipboard.writeText = async (text) => {
      window.__copied = text;
    };
  });
  await couple.click('button:has-text("Skopiuj link dla gościa")');
  const inviteUrl = await couple.evaluate(() => window.__copied);
  assert(!!inviteUrl, "przechwycono link zaproszenia gościa");

  await couple.goto(`${BASE}/admin/tables`);
  await couple.waitForSelector("canvas", { state: "visible", timeout: 15000 });
  await couple.click('button:has-text("+ Stół okrągły")');
  await couple.waitForSelector("text=Miejsca (8)");
  assert(true, "dodano Stół 1");

  // --- GUEST_SELF_SELECT ---
  await couple.goto(`${BASE}/admin`);
  await setSeatingMode(couple, "GUEST_SELF_SELECT");
  assert(true, "ustawiono tryb GUEST_SELF_SELECT");

  const guestCtx = await browser.newContext();
  // Wymuszamy polski, żeby test nie zależał od tego, z jakiego kraju
  // faktycznie łączy się maszyna uruchamiająca testy (patrz src/proxy.ts -
  // automatyczne wykrywanie języka po adresie IP przy pierwszym wejściu).
  await guestCtx.addCookies([{ name: "guest_locale", value: "pl", url: BASE }]);
  const guest = await guestCtx.newPage();
  await guest.goto(inviteUrl);
  await guest.waitForURL(/\/(zgoda|moje-zaproszenie)/);
  if (guest.url().includes("/zgoda")) {
    // RODO - tylko pierwsze wejście gościa wymaga potwierdzenia zgody,
    // kolejne odwiedziny inviteUrl w tym pliku lecą prosto do
    // /moje-zaproszenie (patrz src/app/[slug]/zgoda).
    await guest.check('input[name="consent"]');
    await guest.click('button[type="submit"]');
    await guest.waitForURL(/\/moje-zaproszenie/);
  }
  assert(
    (await guest.content()).includes("Potwierdź obecność"),
    "przed RSVP gość widzi prośbę o potwierdzenie zamiast wyboru miejsc"
  );

  await guest.click('label:has-text("Tak, będę!")');
  await guest.click('button:has-text("Zapisz odpowiedź")');
  await guest.waitForURL(/saved=1/);
  await guest.waitForSelector('input[name="seat"]');
  await guest.locator('input[name="seat"]').first().check({ force: true });
  await guest.click('button:has-text("Zapisz wybrane miejsce")');
  await guest.waitForURL(/seatSaved=1/);
  assert((await guest.content()).includes("· Ty"), "gość widzi własne miejsce oznaczone 'Ty'");

  await couple.goto(`${BASE}/admin/tables`);
  await couple.waitForSelector("canvas", { state: "visible", timeout: 15000 });
  await couple.locator("canvas").first().click({ position: { x: 120, y: 120 } });
  await couple.waitForSelector("text=Zosia");
  assert(true, "para widzi w planerze, że Zosia sama wybrała miejsce");

  // --- GUEST_REQUEST ---
  await couple.goto(`${BASE}/admin`);
  await setSeatingMode(couple, "GUEST_REQUEST");
  await guest.goto(inviteUrl);
  await guest.waitForURL(/\/moje-zaproszenie/);
  assert(
    (await guest.content()).includes("Twój stolik"),
    "w trybie GUEST_REQUEST gość znów widzi tylko odczyt własnego stolika"
  );
  await guest.fill('textarea[name="message"]', "Wolałabym być bliżej rodziców");
  await guest.click('button:has-text("Poproś o zmianę miejsca")');
  await guest.waitForURL(/requestSent=1/);
  assert(true, "prośba o zmianę miejsca wysłana");

  await couple.goto(`${BASE}/admin/seat-requests?weddingId=${weddingId}`);
  await couple.waitForSelector("text=Wolałabym być bliżej rodziców");
  await couple.click('button:has-text("Akceptuj")');
  await couple.waitForSelector("text=Zaakceptowana");
  assert(true, "para zaakceptowała prośbę");

  await guest.goto(inviteUrl);
  await guest.waitForURL(/\/moje-zaproszenie/);
  assert(
    (await guest.content()).includes("Zaakceptowana"),
    "gość widzi status swojej prośby jako zaakceptowany"
  );

  // --- GROUP_CONSTRAINED ---
  await couple.goto(`${BASE}/admin/tables`);
  await couple.waitForSelector("canvas", { state: "visible", timeout: 15000 });
  await couple.click('button:has-text("+ Stół okrągły")');
  await couple.waitForSelector("text=Stół 2");
  assert(true, "dodano Stół 2");

  await couple.goto(`${BASE}/admin/groups?weddingId=${weddingId}`);
  await couple.fill('input[name="name"]', "Rodzina");
  await couple.click('button:has-text("Dodaj")');
  await couple.waitForSelector("text=Rodzina");
  await couple.click('button:has-text("Stół 2")');
  await couple.waitForSelector('button:has-text("Stół 2").bg-zinc-900, button.bg-zinc-900:has-text("Stół 2")');
  assert(true, "grupa Rodzina ograniczona do Stołu 2");

  await couple.goto(`${BASE}/admin/guests?weddingId=${weddingId}`);
  await couple.evaluate(() => {
    const select = document.querySelector('select[name="groupId"]');
    const option = Array.from(select.options).find((o) => o.textContent.trim() === "Rodzina");
    select.value = option.value;
    select.closest("form").requestSubmit();
  });
  await couple.waitForLoadState("networkidle");

  await couple.goto(`${BASE}/admin`);
  await setSeatingMode(couple, "GROUP_CONSTRAINED");

  await guest.goto(inviteUrl);
  await guest.waitForURL(/\/moje-zaproszenie/);
  // Nagłówki stołów do wyboru renderują się WYŁĄCZNIE wewnątrz <form> (patrz
  // GuestSeatSection.tsx) - "Obecnie: Stół 1 (...)" (jej faktyczne bieżące
  // miejsce sprzed ograniczenia grupy) jest poza formularzem, więc scoping
  // do "form p" jednoznacznie odróżnia wybieralne opcje od tej linijki.
  assert(
    (await guest.locator('form p:has-text("Stół 2")').count()) === 1,
    "Zosia (grupa Rodzina) widzi dozwolony dla niej Stół 2 jako opcję wyboru"
  );
  assert(
    (await guest.locator('form p:has-text("Stół 1")').count()) === 0,
    "OGRANICZENIE: Zosia NIE ma Stołu 1 jako wybieralnej opcji - nie jest dozwolony jej grupie"
  );

  await browser.close();
  console.log("\nWSZYSTKIE TESTY TRYBÓW ROZMIESZCZANIA PRZESZŁY POMYŚLNIE");
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
