// Zakłada (albo, jeśli już istnieje, tylko odczytuje i wypisuje dane do)
// TRWAŁE konto demo pary + kilku gości, w tym jednego "gościa demo" -
// żeby dało się testować appkę bez rejestrowania się na nowo za każdym
// razem. Bezpieczne do wielokrotnego odpalenia: przy drugim i kolejnym
// uruchomieniu loguje się na już istniejące konto zamiast rejestrować
// nowe, a gości/stoły/znaczniki dodaje TYLKO jeśli konto jest jeszcze puste
// (nie duplikuje przy ponownym odpaleniu).
//
// Uruchomienie:
//   npm run build && npm run start -- -p 3100   (w jednym terminalu)
//   SMOKE_BASE_URL=http://localhost:3100 node scripts/seed-demo.mjs
//
// Na koniec wypisuje dane logowania pary i link/kod dostępu gościa demo -
// zapisz je sobie, to jedyny moment, kiedy kod gościa demo jest widoczny
// (potem trzeba by zajrzeć do panelu pary po niego ponownie).

import { chromium } from "playwright";

const BASE = process.env.SMOKE_BASE_URL || "http://localhost:3000";

const DEMO_EMAIL = "demo@example.com";
const DEMO_PASSWORD = "DemoDemo123!";
const DEMO_PARTNER1 = "Zosia";
const DEMO_PARTNER2 = "Marek";

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

  // --- Rejestracja, a jeśli konto już istnieje - logowanie ---
  await couple.goto(`${BASE}/admin/register`);
  await couple.fill('input[name="partner1Name"]', DEMO_PARTNER1);
  await couple.fill('input[name="partner2Name"]', DEMO_PARTNER2);
  await couple.fill('input[name="email"]', DEMO_EMAIL);
  await couple.fill('input[name="password"]', DEMO_PASSWORD);
  await couple.check('input[name="privacyConsent"]');
  await couple.click('button[type="submit"]');
  await couple.waitForURL(/\/admin(\?welcome=|\/register\?error=exists)/);

  let isNewAccount = couple.url().includes("welcome=");
  if (!isNewAccount) {
    await couple.goto(`${BASE}/admin/login`);
    await couple.fill('input[name="email"]', DEMO_EMAIL);
    await couple.fill('input[name="password"]', DEMO_PASSWORD);
    await couple.click('button[type="submit"]');
    await couple.waitForURL(/\/admin$/);
    assert(true, "konto demo już istniało - zalogowano zamiast rejestrować");
  } else {
    assert(true, "utworzono nowe konto demo");
  }

  const weddingIdMatch = await couple
    .locator("a[href*='weddingId=']")
    .first()
    .getAttribute("href");
  const weddingId = new URL(BASE + weddingIdMatch).searchParams.get("weddingId");
  assert(!!weddingId, "weddingId: " + weddingId);

  // --- Szczegóły wesela (bezpieczne do powtórzenia - zawsze te same wartości) ---
  await couple.goto(`${BASE}/admin`);
  await couple.fill('input[name="weddingDate"]', "2027-06-12");
  await couple.fill('input[name="venueName"]', "Sala Bankietowa Różana");
  await couple.fill('input[name="venueAddress"]', "ul. Kwiatowa 5, Kraków");
  await couple.fill(
    'textarea[name="story"]',
    "Poznaliśmy się przypadkiem na weselu wspólnych znajomych - i tak zaczęła się nasza historia. Nie możemy się doczekać, żeby świętować z Wami ten dzień!"
  );
  await couple.fill(
    'textarea[name="giftNote"]',
    "Zamiast kwiatów wolimy dobre wino 🍷, a najbardziej ucieszy nas koperta!"
  );
  await couple.click('button:has-text("Zapisz")');
  await couple.waitForURL(/saved=1/);
  assert(true, "zapisano szczegóły wesela demo");

  const publishBtn = couple.locator('button:has-text("Opublikuj stronę")');
  if (await publishBtn.count()) {
    await publishBtn.click();
    await couple.waitForURL(/published=1/);
    assert(true, "strona demo opublikowana");
  } else {
    assert(true, "strona demo już była opublikowana");
  }

  // --- Goście, grupy, stoły - TYLKO jeśli konto jeszcze puste (nie duplikować) ---
  await couple.goto(`${BASE}/admin/guests?weddingId=${weddingId}`);
  const alreadyHasGuests = !(await couple
    .locator("text=Nie dodaliście jeszcze żadnego gościa")
    .count());

  let demoGuestInviteUrl = null;
  let demoGuestShortCode = null;

  if (alreadyHasGuests) {
    assert(true, "konto demo ma już gości - pomijam ponowne dodawanie (bez duplikatów)");
  } else {
    const guestsToAdd = [
      { firstName: "Ala", lastName: "Kowalska", plusOne: true },
      { firstName: "Bartek", lastName: "Nowak", plusOne: false },
      { firstName: "Celina", lastName: "Wiśniewska", plusOne: false },
      { firstName: "Darek", lastName: "Zieliński", plusOne: false },
      { firstName: "Ewa", lastName: "Mazur (gość demo)", plusOne: false },
    ];
    for (const g of guestsToAdd) {
      await couple.goto(`${BASE}/admin/guests?weddingId=${weddingId}`);
      await couple.fill('input[name="firstName"]', g.firstName);
      await couple.fill('input[name="lastName"]', g.lastName);
      if (g.plusOne) await couple.check('input[name="allowPlusOne"]');
      await couple.click('button:has-text("Dodaj gościa")');
      await couple.waitForSelector(`text=${g.firstName} ${g.lastName}`);
    }
    assert(true, `dodano ${guestsToAdd.length} gości demo`);

    // --- Grupa "Rodzina" z dwoma członkami ---
    await couple.goto(`${BASE}/admin/groups?weddingId=${weddingId}`);
    await couple.fill('input[name="name"]', "Rodzina");
    await couple.click('button:has-text("Dodaj")');
    await couple.waitForSelector("text=Rodzina");
    assert(true, "dodano grupę 'Rodzina'");

    await couple.goto(`${BASE}/admin/guests?weddingId=${weddingId}`);
    for (const name of ["Ala Kowalska", "Bartek Nowak"]) {
      const row = couple.locator("div.rounded-lg.border-zinc-200").filter({ hasText: name });
      await row.locator('select[name="groupId"]').selectOption({ label: "Rodzina" });
      await row.locator('button:has-text("Zapisz")').click();
      await couple.waitForLoadState("networkidle");
    }
    assert(true, "przypisano Ala i Bartek do grupy 'Rodzina'");

    // --- Planer: dwa stoły, przypisanie kilku gości, znacznik + ściana ---
    await couple.goto(`${BASE}/admin/tables`);
    await couple.waitForSelector("canvas", { state: "visible", timeout: 15000 });

    await couple.click('button:has-text("+ Stół okrągły")');
    await couple.waitForSelector("text=Miejsca (8)", { timeout: 10000 });
    await couple.locator("select").first().selectOption({ label: "Ala Kowalska" });
    await couple.waitForSelector("text=Ala Kowalska");

    await couple.click('button:has-text("+ Stół prostokątny")');
    await couple.waitForSelector("text=Miejsca (6)", { timeout: 10000 });
    const rectSelect = couple.locator("select").first();
    await rectSelect.selectOption({ label: "Bartek Nowak" });
    await couple.waitForSelector("text=Bartek Nowak");
    assert(true, "dodano 2 stoły demo z przypisanymi gośćmi");

    couple.once("dialog", (dialog) => dialog.accept("DJ"));
    await couple.click('button:has-text("+ Oznaczenie")');
    await couple.waitForTimeout(500);
    await couple.click('button:has-text("+ Ściana")');
    await couple.waitForSelector("text=Długość (160)", { timeout: 10000 });
    assert(true, "dodano znacznik 'DJ' i ścianę demo");

    // --- Ograniczenie grupy "Rodzina" do stołu okrągłego (GROUP_CONSTRAINED - domyślny tryb) ---
    await couple.goto(`${BASE}/admin/groups?weddingId=${weddingId}`);
    await couple.click('button:has-text("Stół 1")');
    await couple.waitForLoadState("networkidle");
    assert(true, "ograniczono grupę 'Rodzina' do Stołu 1 (na razie kosmetycznie, do zademonstrowania)");
  }

  // --- Namiary na gościa demo (Ewa Mazur) - kod ręczny + link ---
  await couple.goto(`${BASE}/admin/guests?weddingId=${weddingId}`);
  const demoRow = couple
    .locator("div.rounded-lg.border-zinc-200")
    .filter({ hasText: "Ewa Mazur" });
  const codeTitle = await demoRow
    .locator('a[href*="invite-card"]')
    .getAttribute("title")
    .catch(() => null);
  demoGuestShortCode = codeTitle ? codeTitle.replace("Kod ręczny: ", "").trim() : null;

  await demoRow.evaluate(() => {
    window.__copied = null;
    navigator.clipboard.writeText = async (text) => {
      window.__copied = text;
    };
  });
  await demoRow.locator('button:has-text("Skopiuj link dla gościa")').click();
  demoGuestInviteUrl = await couple.evaluate(() => window.__copied);

  await couple.goto(`${BASE}/admin`);
  const wedding = await couple.locator("p.font-mono").first().innerText();

  await browser.close();

  console.log("\n================ KONTO DEMO GOTOWE ================");
  console.log(`Panel pary:      ${BASE}/admin/login`);
  console.log(`  email:         ${DEMO_EMAIL}`);
  console.log(`  hasło:         ${DEMO_PASSWORD}`);
  console.log(`Strona wesela:   ${BASE}${wedding.startsWith("/") ? wedding : "/" + wedding}`);
  console.log(`\nGość demo (Ewa Mazur):`);
  console.log(`  link:          ${demoGuestInviteUrl ?? "(nie przechwycono - zajrzyj do panelu Goście)"}`);
  console.log(`  kod ręczny:    ${demoGuestShortCode ?? "(nie przechwycono)"} (wpisz na ${BASE}/kod)`);
  console.log(
    "\nOtwórz oba linki RAZ w swojej przeglądarce (najlepiej gościa w oknie prywatnym/innej"
  );
  console.log(
    "przeglądarce niż panel pary) - sesje trzymają się potem 30 dni (para) / rok (gość),"
  );
  console.log("więc nie trzeba się logować ponownie przy każdej wizycie.");
  console.log(
    "Przy PIERWSZYM wejściu gość zobaczy bramę zgody RODO (/zgoda) - zaznacz zgodę i kliknij"
  );
  console.log('"Zgadzam się, przejdź dalej", to jednorazowe.');
  console.log("=====================================================\n");
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
