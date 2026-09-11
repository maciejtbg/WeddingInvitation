// Test end-to-end automatycznego wykrywania języka gościa po kraju z
// adresu IP - patrz src/proxy.ts, src/lib/i18n/countryLocale.ts,
// src/components/PendingLocaleBanner.tsx i PendingTranslationBar.tsx.
//
// Adresy IP użyte niżej to prawdziwe, publiczne, znane bloki adresowe
// konkretnych krajów (nie z zakresów prywatnych) - fast-geoip potrzebuje
// realnego adresu, żeby cokolwiek zwrócić. Wysyłamy je przez nagłówek
// X-Real-IP, dokładnie tak, jak robi to nginx na serwerze produkcyjnym
// (patrz deploy/nginx.conf).
//
// Sprawdza: Polska -> polski od razu (bez baneru), kraj anglojęzyczny ->
// angielski od razu, kraj z językiem spoza czwórki ręcznie utrzymywanej
// (Francja -> francuski) -> angielska baza + baner + tłumaczenie w tle,
// które samo przełącza język po skończeniu, przycisk "Zostań przy
// angielskim" faktycznie anuluje przełączenie, kraj nierozpoznany w mapie
// -> angielski bez baneru, oraz że gość z już ustawionym ciasteczkiem NIE
// jest nadpisywany (wykrywanie działa tylko przy pierwszym wejściu).
//
// UWAGA - działa tylko lokalnie, BEZPOŚREDNIO na aplikacji (`next start`),
// NIE przez nginx na serwerze produkcyjnym: nginx świadomie NADPISUJE
// nagłówek X-Real-IP prawdziwym adresem łączącego się klienta
// ($remote_addr, patrz deploy/nginx.conf) - inaczej każdy odwiedzający
// mógłby sam sobie ustawić dowolny "kraj". To poprawne, zamierzone
// zachowanie nginx, nie błąd do naprawienia - spoofing nagłówka z tego
// testu przechodzi więc TYLKO wtedy, gdy nic po drodze go nie nadpisuje.
// Dlatego ten test pomijamy przy weryfikacji na żywym serwerze (patrz
// deploy/DEPLOY.md) - tam wystarcza ręczne sprawdzenie, że zwykłe wejście
// bez spoofingu dostaje jakiś sensowny język bez błędu 500.
//
// Uruchomienie:
//   npm run build && npm run start -- -p 3100   (w jednym terminalu)
//   SMOKE_BASE_URL=http://localhost:3100 npm run smoke:geo-i18n

import { chromium } from "playwright";

const BASE = process.env.SMOKE_BASE_URL || "http://localhost:3000";

function assert(cond, msg) {
  if (!cond) throw new Error("FAIL: " + msg);
  console.log("OK: " + msg);
}

function cookieVal(cookies, name) {
  return cookies.find((c) => c.name === name)?.value ?? null;
}

async function waitForPendingGone(context, timeoutMs = 20000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const cookies = await context.cookies();
    if (!cookieVal(cookies, "guest_locale_pending")) return cookies;
    await new Promise((r) => setTimeout(r, 300));
  }
  throw new Error("timeout waiting for guest_locale_pending to clear");
}

const launchOptions = { args: ["--no-sandbox"] };
if (process.env.PLAYWRIGHT_CHROMIUM) {
  launchOptions.executablePath = process.env.PLAYWRIGHT_CHROMIUM;
}

(async () => {
  const browser = await chromium.launch(launchOptions);

  // --- Zarejestruj testowe wesele, żeby mieć slug do testowania stron gościa ---
  const setupContext = await browser.newContext();
  const setupPage = await setupContext.newPage();
  const email = `test-geo-i18n-${Date.now()}@example.com`;
  await setupPage.goto(`${BASE}/admin/register`);
  await setupPage.fill('input[name="partner1Name"]', "Geo");
  await setupPage.fill('input[name="partner2Name"]', "Test");
  await setupPage.fill('input[name="email"]', email);
  await setupPage.fill('input[name="password"]', "supertajnehaslo");
  await setupPage.check('input[name="privacyConsent"]');
  await setupPage.click('button[type="submit"]');
  await setupPage.waitForURL(/\/admin\?welcome=/);
  const slug = new URL(setupPage.url()).searchParams.get("welcome");
  assert(!!slug, "utworzono testowe wesele: " + slug);
  await setupContext.close();

  // --- Polska (83.238.0.1) -> polski od razu, bez baneru ---
  {
    const ctx = await browser.newContext({ extraHTTPHeaders: { "X-Real-IP": "83.238.0.1" } });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/${slug}`);
    const cookies = await ctx.cookies();
    assert(cookieVal(cookies, "guest_locale") === "pl", "PL IP -> guest_locale=pl");
    assert(!cookieVal(cookies, "guest_locale_pending"), "PL IP -> brak pending");
    assert((await page.locator("text=Dostaliście od nas link").count()) > 0, "PL IP -> treść po polsku");
    await ctx.close();
  }

  // --- Wielka Brytania (81.2.69.142) -> angielski od razu (kraj anglojęzyczny) ---
  {
    const ctx = await browser.newContext({ extraHTTPHeaders: { "X-Real-IP": "81.2.69.142" } });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/${slug}`);
    const cookies = await ctx.cookies();
    assert(cookieVal(cookies, "guest_locale") === "en", "GB IP -> guest_locale=en");
    assert(!cookieVal(cookies, "guest_locale_pending"), "GB IP -> brak pending");
    assert(
      (await page.locator("text=Did you get a personal invite link").count()) > 0,
      "GB IP -> treść po angielsku"
    );
    await ctx.close();
  }

  // --- Francja (212.27.48.10) -> angielska baza + pending=fr + baner, potem
  //     przełącza się samo na francuski po przetłumaczeniu w tle ---
  {
    const ctx = await browser.newContext({ extraHTTPHeaders: { "X-Real-IP": "212.27.48.10" } });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/${slug}`);
    const initialCookies = await ctx.cookies();
    assert(cookieVal(initialCookies, "guest_locale") === "en", "FR IP -> baza to angielski");
    assert(cookieVal(initialCookies, "guest_locale_pending") === "fr", "FR IP -> pending=fr");
    assert(
      (await page.locator("text=Fetching your language").count()) > 0,
      "FR IP -> widoczny baner tłumaczenia w tle"
    );

    const finalCookies = await waitForPendingGone(ctx);
    assert(!cookieVal(finalCookies, "guest_locale_pending"), "FR IP -> pending zniknęło");
    assert(
      cookieVal(finalCookies, "guest_locale") === "fr",
      "FR IP -> guest_locale przełączyło się na francuski"
    );
    await ctx.close();
  }

  // --- Francja + "Zostań przy angielskim" -> anuluje przełączenie ---
  {
    const ctx = await browser.newContext({ extraHTTPHeaders: { "X-Real-IP": "212.27.48.10" } });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/${slug}`);
    const before = await ctx.cookies();
    assert(cookieVal(before, "guest_locale_pending") === "fr", "FR IP (anuluj) -> pending=fr zanim klikniemy");
    await page.click("text=Stay in English");
    await page.waitForTimeout(1000);
    const after = await ctx.cookies();
    assert(!cookieVal(after, "guest_locale_pending"), "Anuluj -> pending zniknęło");
    assert(cookieVal(after, "guest_locale") === "en", "Anuluj -> guest_locale zostało na angielski");
    await ctx.close();
  }

  // --- Islandia (194.144.166.100) -> kraj nierozpoznany w mapie -> angielski, bez baneru ---
  {
    const ctx = await browser.newContext({ extraHTTPHeaders: { "X-Real-IP": "194.144.166.100" } });
    const page = await ctx.newPage();
    await page.goto(`${BASE}/${slug}`);
    const cookies = await ctx.cookies();
    assert(cookieVal(cookies, "guest_locale") === "en", "IS IP (niezmapowany kraj) -> guest_locale=en");
    assert(!cookieVal(cookies, "guest_locale_pending"), "IS IP -> brak pending (nie ma go do przetłumaczenia)");
    await ctx.close();
  }

  // --- Gość z już ustawionym ciasteczkiem -> proxy NIE nadpisuje wyboru,
  //     wykrywanie po IP działa wyłącznie przy pierwszym wejściu ---
  {
    const ctx = await browser.newContext({ extraHTTPHeaders: { "X-Real-IP": "81.2.69.142" } });
    await ctx.addCookies([{ name: "guest_locale", value: "pl", url: BASE }]);
    const page = await ctx.newPage();
    await page.goto(`${BASE}/${slug}`);
    const cookies = await ctx.cookies();
    assert(
      cookieVal(cookies, "guest_locale") === "pl",
      "Istniejące ciasteczko -> proxy nie nadpisuje (zostaje polski mimo IP z UK)"
    );
    await ctx.close();
  }

  await browser.close();
  console.log("\nWSZYSTKIE TESTY AUTOMATYCZNEGO WYKRYWANIA JĘZYKA PRZESZŁY POMYŚLNIE");
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
