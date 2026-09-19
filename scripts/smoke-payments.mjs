// Test end-to-end płatności: darmowy start galerii, panel operatora
// (/super-admin), generowanie kodów rabatowych i ich użycie przy zakupie
// pakietu zdjęć - patrz src/lib/photoPack.ts, src/lib/db/discountCodes.ts,
// src/lib/db/photoPackPurchases.ts, src/app/admin/gallery.
//
// Świadomie NIE testuje prawdziwej płatności kartą przez hostowany Stripe
// Checkout (wymaga prawdziwych kluczy API Stripe w środowisku testowym,
// których to uruchomienie nie ma) - pokrywa za to CAŁĄ resztę: darmowy
// limit, panel operatora, CRUD kodów, walidację (zły/wygasły/wyczerpany
// kod) i pełną ścieżkę zakupu przez kod ze 100% rabatem (ta ścieżka w ogóle
// nie dotyka Stripe, patrz buyPhotoPackAction - dokładnie to nam pozwala
// przetestować doliczanie limitu i zużycia kodu bez prawdziwych pieniędzy).
//
// Zakłada, że serwer wystartował z PAYMENTS_ENABLED=true (testuje ścieżkę
// reaktywacji po włączeniu wyłącznika) - stan DOMYŚLNY/produkcyjny (wyłączony)
// pokrywa osobny, dużo krótszy scripts/smoke-payments-disabled.mjs.
//
// Wymaga zmiennych środowiskowych ustawionych PRZY BUDOWANIU/URUCHAMIANIU
// serwera (patrz .env.example):
//   PAYMENTS_ENABLED=true
//   PLATFORM_ADMIN_EMAIL=test-admin@example.com
//   PLATFORM_ADMIN_PASSWORD_HASH=<node scripts/hash-password.mjs "supertajnehaslo">
//
// Uruchomienie:
//   npm run build && npm run start -- -p 3100   (w jednym terminalu, z ww. zmiennymi)
//   SMOKE_BASE_URL=http://localhost:3100 npm run smoke:payments

import { chromium } from "playwright";

const BASE = process.env.SMOKE_BASE_URL || "http://localhost:3000";
const ADMIN_EMAIL = process.env.PLATFORM_ADMIN_EMAIL || "test-admin@example.com";
const ADMIN_PASSWORD = process.env.PLATFORM_ADMIN_TEST_PASSWORD || "supertajnehaslo";

function assert(cond, msg) {
  if (!cond) throw new Error("FAIL: " + msg);
  console.log("OK: " + msg);
}

const launchOptions = { args: ["--no-sandbox"] };
if (process.env.PLAYWRIGHT_CHROMIUM) {
  launchOptions.executablePath = process.env.PLAYWRIGHT_CHROMIUM;
}

async function loginPlatformAdmin(page) {
  await page.goto(`${BASE}/super-admin/login`);
  await page.fill('input[name="email"]', ADMIN_EMAIL);
  await page.fill('input[name="password"]', ADMIN_PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/super-admin\/discount-codes/);
}

async function createDiscountCode(page, { code, discountType, discountValue, maxUses }) {
  await page.goto(`${BASE}/super-admin/discount-codes`);
  await page.fill('input[name="code"]', code);
  await page.selectOption('select[name="discountType"]', discountType);
  await page.fill('input[name="discountValue"]', String(discountValue));
  if (maxUses !== undefined) {
    await page.fill('input[name="maxUses"]', String(maxUses));
  }
  await page.click('button:has-text("Utwórz kod")');
  await page.waitForURL(/created=1/);
}

(async () => {
  const browser = await chromium.launch(launchOptions);

  // =========================================================================
  // 0. Izolacja: panel operatora niedostępny bez sesji, sesja pary nie
  //    wystarcza, sesja operatora nie daje dostępu do panelu pary.
  // =========================================================================
  const anonCtx = await browser.newContext();
  const anon = await anonCtx.newPage();
  await anon.goto(`${BASE}/super-admin/discount-codes`);
  await anon.waitForURL(/\/super-admin\/login/);
  assert(true, "IZOLACJA: /super-admin/discount-codes bez sesji przekierowuje na login operatora");

  await anon.fill('input[name="email"]', "zla@example.com");
  await anon.fill('input[name="password"]', "zlehaslo");
  await anon.click('button[type="submit"]');
  await anon.waitForURL(/error=invalid/);
  assert(true, "IZOLACJA: złe dane logowania operatora są odrzucone");

  const admin = await (await browser.newContext()).newPage();
  await loginPlatformAdmin(admin);
  assert(true, "logowanie operatora (super-admin) powiodło się");

  await admin.goto(`${BASE}/admin`);
  await admin.waitForURL(/\/admin\/login/);
  assert(true, "IZOLACJA: sesja operatora NIE daje dostępu do panelu pary (/admin)");

  // =========================================================================
  // 1. Rejestracja pary + darmowy start galerii
  // =========================================================================
  const coupleCtx = await browser.newContext();
  const couple = await coupleCtx.newPage();

  const email = `test-payments-${Date.now()}@example.com`;
  await couple.goto(`${BASE}/admin/register`);
  await couple.fill('input[name="partner1Name"]', "Lena");
  await couple.fill('input[name="partner2Name"]', "Adam");
  await couple.fill('input[name="email"]', email);
  await couple.fill('input[name="password"]', "supertajnehaslo");
  await couple.check('input[name="privacyConsent"]');
  await couple.click('button[type="submit"]');
  await couple.waitForURL(/\/admin\?welcome=/);

  const weddingIdMatch = await couple.locator("a[href*='weddingId=']").first().getAttribute("href");
  const weddingId = new URL(BASE + weddingIdMatch).searchParams.get("weddingId");
  assert(!!weddingId, "rejestracja pary OK (konto darmowe, bez żadnej płatności), weddingId=" + weddingId);

  await couple.goto(`${BASE}/admin/gallery?weddingId=${weddingId}`);
  await couple.waitForSelector("text=Zdjęcia (0/10)");
  assert(true, "DARMOWY START: świeże konto ma limit 10 zdjęć bez żadnej płatności");

  // =========================================================================
  // 2. Kod rabatowy: zły/nieistniejący kod jest odrzucany
  // =========================================================================
  await couple.fill('input[name="discountCode"]', "NIEISTNIEJACY");
  await couple.click('button:has-text("Kup pakiet")');
  await couple.waitForURL(/error=/);
  assert(
    (await couple.content()).includes("Nieprawidłowy lub nieaktywny kod"),
    "nieistniejący kod rabatowy jest odrzucany z czytelnym błędem"
  );

  // Kody rabatowe są globalne (nie per-wesele) - stąd znacznik czasu w
  // nazwie, żeby powtórzone uruchomienie tego testu na tej samej bazie
  // (np. lokalnie bez czyszczenia danych między próbami) nie zderzyło się
  // z UNIQUE(code) po kodzie zostawionym przez poprzedni przebieg.
  // Kody mają twardy limit 20 znaków (patrz walidacja w
  // super-admin/discount-codes/actions.ts) - starcza 6 ostatnich cyfr
  // znacznika czasu na unikalność w obrębie jednego przebiegu testów.
  const runId = String(Date.now()).slice(-6);
  const FREE_CODE = `FREE${runId}`;
  const EXPIRED_CODE = `OLD${runId}`;

  // =========================================================================
  // 3. Operator generuje kod ze 100% rabatem, ograniczony do JEDNEGO użycia
  // =========================================================================
  await createDiscountCode(admin, {
    code: FREE_CODE,
    discountType: "PERCENT",
    discountValue: 100,
    maxUses: 1,
  });
  await admin.waitForSelector(`text=${FREE_CODE}`);
  assert(true, `operator utworzył kod ${FREE_CODE} (100% rabatu, limit 1 użycie)`);
  assert((await admin.content()).includes("Aktywny"), "nowy kod pokazuje się jako Aktywny w panelu");

  // =========================================================================
  // 4. Para używa kodu 100% - pakiet przyznany BEZ Stripe, limit rośnie
  // =========================================================================
  await couple.goto(`${BASE}/admin/gallery?weddingId=${weddingId}`);
  await couple.fill('input[name="discountCode"]', FREE_CODE.toLowerCase()); // małe litery - normalizacja
  await couple.click('button:has-text("Kup pakiet")');
  await couple.waitForURL(/purchase=free/);
  assert(true, "zakup kodem ze 100% rabatem przeszedł bez żadnej sesji Stripe");
  await couple.waitForSelector("text=Zdjęcia (0/60)");
  assert(true, "LIMIT: po zakupie pakietu +50 limit galerii wzrósł z 10 do 60");

  await admin.goto(`${BASE}/super-admin/discount-codes`);
  assert(
    (await admin.content()).includes("użyto 1 / 1"),
    "zużycie kodu doliczone w panelu operatora (1/1)"
  );
  // Wiersz kodu - scope po dokładnym zestawie klas z page.tsx (p-4, nie p-6
  // jak formularz tworzenia kodu wyżej), żeby nie złapać przypadkiem
  // szerszego kontenera listy zawierającego wiele wierszy naraz.
  const freeCodeRow = admin.locator(".p-4.rounded-lg.border-zinc-200", { hasText: FREE_CODE });
  assert((await freeCodeRow.locator("text=Nieaktywny").count()) > 0, "kod wyczerpany limitem użyć pokazuje się teraz jako Nieaktywny");

  // =========================================================================
  // 5. Wyczerpany kod (limit użyć osiągnięty) jest odrzucany przy kolejnej próbie
  // =========================================================================
  await couple.goto(`${BASE}/admin/gallery?weddingId=${weddingId}`);
  await couple.fill('input[name="discountCode"]', FREE_CODE);
  await couple.click('button:has-text("Kup pakiet")');
  await couple.waitForURL(/error=/);
  assert(
    (await couple.content()).includes("Nieprawidłowy lub nieaktywny kod"),
    "wyczerpany kod (limit użyć) jest odrzucany przy kolejnej próbie"
  );

  // =========================================================================
  // 6. Kod rabatowy z przeszłą datą ważności też jest odrzucany
  // =========================================================================
  await admin.goto(`${BASE}/super-admin/discount-codes`);
  await admin.fill('input[name="code"]', EXPIRED_CODE);
  await admin.selectOption('select[name="discountType"]', "PERCENT");
  await admin.fill('input[name="discountValue"]', "50");
  await admin.fill('input[name="validUntil"]', "2020-01-01");
  await admin.click('button:has-text("Utwórz kod")');
  await admin.waitForURL(/created=1/);

  await couple.goto(`${BASE}/admin/gallery?weddingId=${weddingId}`);
  await couple.fill('input[name="discountCode"]', EXPIRED_CODE);
  await couple.click('button:has-text("Kup pakiet")');
  await couple.waitForURL(/error=/);
  assert(
    (await couple.content()).includes("Nieprawidłowy lub nieaktywny kod"),
    "kod z przeszłą datą ważności jest odrzucany"
  );

  // =========================================================================
  // 7. Operator usuwa kod
  // =========================================================================
  await admin.goto(`${BASE}/super-admin/discount-codes`);
  const expiredCodeRow = admin.locator(".p-4.rounded-lg.border-zinc-200", { hasText: EXPIRED_CODE });
  await expiredCodeRow.locator('button:has-text("Usuń")').click();
  await admin.waitForLoadState("networkidle");
  // Świeże odwiedziny strony (nie poleganie na tym, co zostało po
  // przekierowaniu Server Action) - Next.js potrafi na chwilę pokazać
  // wersję strony sprzed rewalidacji zaraz po kliknięciu (client-side
  // router cache), mimo że dane po stronie serwera są już poprawne -
  // dokładnie tak zobaczyłby to realny użytkownik po odświeżeniu.
  await admin.goto(`${BASE}/super-admin/discount-codes`);
  assert(!(await admin.content()).includes(EXPIRED_CODE), "operator usunął kod - znika z listy po odświeżeniu");

  await browser.close();
  console.log("\nWSZYSTKIE TESTY PŁATNOŚCI PRZESZŁY POMYŚLNIE");
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
