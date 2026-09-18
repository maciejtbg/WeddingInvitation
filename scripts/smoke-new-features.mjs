// Test end-to-end czterech funkcji dodanych naraz w jednej turze:
//  1. Zaproszenia grupowe (wspólny link, selektywne RSVP, usadzanie grupy)
//     - patrz src/app/zg/[token]/route.ts, src/app/[slug]/grupa.
//  2. Ręczne przypomnienia dla gości (mailto:/sms:, jak SendInviteButtons)
//     - patrz src/components/RemindGuestButtons.tsx.
//  3. Menu wesela z alergenami - patrz src/app/admin/menu, src/lib/allergens.ts.
//  4. Konfigurowalny raport dla pary - patrz src/app/admin/report.
//
// Uruchomienie:
//   npm run build && npm run start -- -p 3100   (w jednym terminalu)
//   SMOKE_BASE_URL=http://localhost:3100 npm run smoke:new-features

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

  const coupleCtx = await browser.newContext();
  const couple = await coupleCtx.newPage();

  const email = `test-newfeat-${Date.now()}@example.com`;
  await couple.goto(`${BASE}/admin/register`);
  await couple.fill('input[name="partner1Name"]', "Kasia");
  await couple.fill('input[name="partner2Name"]', "Bartek");
  await couple.fill('input[name="email"]', email);
  await couple.fill('input[name="password"]', "supertajnehaslo");
  await couple.check('input[name="privacyConsent"]');
  await couple.click('button[type="submit"]');
  await couple.waitForURL(/\/admin\?welcome=/);

  const weddingIdMatch = await couple.locator("a[href*='weddingId=']").first().getAttribute("href");
  const weddingId = new URL(BASE + weddingIdMatch).searchParams.get("weddingId");
  const slug = new URL(couple.url()).searchParams.get("welcome");
  assert(!!weddingId && !!slug, "rejestracja pary OK, weddingId=" + weddingId);

  // =========================================================================
  // 1a. Grupa: dwóch gości + wspólny link zaproszenia grupowego
  // =========================================================================
  await couple.goto(`${BASE}/admin/groups?weddingId=${weddingId}`);
  await couple.fill('input[placeholder="np. Rodzina Pana Młodego"]', "Rodzina Kasi");
  await couple.click('button:has-text("Dodaj")');
  // Nazwa grupy renderuje się jako WARTOŚĆ inputa (formularz zmiany nazwy),
  // nie jako zwykły tekst - "text=" selektor Playwright by tego nie złapał.
  await couple.waitForSelector('input[value="Rodzina Kasi"]');
  assert(true, "grupa 'Rodzina Kasi' utworzona");

  await couple.goto(`${BASE}/admin/guests?weddingId=${weddingId}`);
  await couple.fill('input[name="firstName"]', "Ewa");
  await couple.fill('input[name="lastName"]', "Kowalska");
  await couple.click('button:has-text("Dodaj gościa")');
  await couple.waitForSelector("text=Ewa Kowalska");

  await couple.fill('input[name="firstName"]', "Piotr");
  await couple.fill('input[name="lastName"]', "Kowalski");
  await couple.click('button:has-text("Dodaj gościa")');
  await couple.waitForSelector("text=Piotr Kowalski");
  assert(true, "dwoje gości grupy dodanych");

  // Przypisanie obojga do grupy - dwa oddzielne formularze <select> na liście.
  const groupForms = couple.locator('form:has(select[name="groupId"])');
  const formCount = await groupForms.count();
  assert(formCount === 2, "dwa formularze przypisania grupy widoczne: " + formCount);
  for (let i = 0; i < formCount; i++) {
    const form = couple.locator('form:has(select[name="groupId"])').nth(i);
    await form.locator('select[name="groupId"]').selectOption({ label: "Rodzina Kasi" });
    await form.locator("button").click();
    await couple.waitForLoadState("networkidle");
  }

  await couple.goto(`${BASE}/admin/groups?weddingId=${weddingId}`);
  await couple.waitForSelector("text=Ewa Kowalska");
  await couple.waitForSelector("text=Piotr Kowalski");
  assert(true, "oboje gości widoczni jako członkowie grupy w panelu Grupy gości");

  await couple.evaluate(() => {
    window.__copiedGroupLink = null;
    navigator.clipboard.writeText = async (text) => {
      window.__copiedGroupLink = text;
    };
  });
  await couple.click('button:has-text("Wygeneruj link grupowy")');
  await couple.waitForSelector('button:has-text("Skopiuj link grupowy")');
  await couple.click('button:has-text("Skopiuj link grupowy")');
  const groupInviteUrl = await couple.evaluate(() => window.__copiedGroupLink);
  assert(!!groupInviteUrl && groupInviteUrl.includes("/zg/"), "link grupowy przechwycony: " + groupInviteUrl);

  // =========================================================================
  // 1b. Przedstawiciel grupy: zgoda + selektywne RSVP za oboje
  // =========================================================================
  const groupCtx = await browser.newContext();
  await groupCtx.addCookies([{ name: "guest_locale", value: "pl", url: BASE }]);
  const rep = await groupCtx.newPage();

  await rep.goto(groupInviteUrl);
  await rep.waitForURL(/\/grupa/);
  assert((await rep.content()).includes("Ewa"), "strona grupowa wymienia Ewę w kroku zgody");
  assert((await rep.content()).includes("Piotr"), "strona grupowa wymienia Piotra w kroku zgody");

  await rep.check('input[name="consent"]');
  await rep.click('button:has-text("Zgadzam się, przejdź dalej")');
  // UWAGA: strona PRZED i PO zgodzie ma ten sam adres (/grupa) - waitForURL
  // na samym wzorcu ścieżki rozstrzygnąłby się natychmiast, zanim faktyczne
  // przejście (redirect z Server Action) się dokona, więc czekamy na
  // konkretny fragment treści widoczny WYŁĄCZNIE po zgodzie.
  await rep.waitForSelector("text=Osoby w tej grupie", { timeout: 10000 });
  assert(true, "po zgodzie widać formularz RSVP grupy");

  // Ewa: TAK, Piotr: NIE - selektywnie w jednym formularzu.
  const yesRadios = rep.locator('input[type="radio"][value="YES"]');
  const noRadios = rep.locator('input[type="radio"][value="NO"]');
  await yesRadios.first().check({ force: true });
  await noRadios.nth(1).check({ force: true });
  await rep.click('button:has-text("Zapisz odpowiedzi")');
  await rep.waitForURL(/saved=1/);
  assert(true, "RSVP grupy zapisane (selektywnie: jedna osoba tak, druga nie)");

  // Imię i nazwisko renderują się jako dwa osobne wyrażenia JSX ({firstName}
  // {lastName}) - w surowym page.content() React wstawia między nimi znaczniki
  // komentarzy hydratacji, więc prosty .includes("Ewa Kowalska") na surowym
  // HTML by tego nie złapał, mimo że tekst renderuje się poprawnie. Selektor
  // "text=" Playwrighta normalizuje węzły tekstowe i łapie to poprawnie.
  await couple.goto(`${BASE}/admin/groups?weddingId=${weddingId}`);
  await couple.waitForSelector("text=Ewa Kowalska");
  await couple.waitForSelector("text=Piotr Kowalski");
  assert(true, "panel pary nadal pokazuje oboje członków grupy");

  // =========================================================================
  // 1c. Usadzanie przez grupę - włączenie opcji + stół + wybór miejsca
  // =========================================================================
  await couple.goto(`${BASE}/admin/groups?weddingId=${weddingId}`);
  await couple.click('button:has-text("Wyłączone - włącz")');
  // Ten sam powód co przy zgodzie wyżej - adres przed i po przełączeniu
  // jest identyczny (/admin/groups), więc czekamy na zmianę treści przycisku.
  await couple.waitForSelector('button:has-text("Włączone - wyłącz")', { timeout: 10000 });
  assert(true, "usadzanie przez grupę włączone");

  await couple.goto(`${BASE}/admin/tables`);
  await couple.waitForSelector("canvas", { state: "visible", timeout: 15000 });
  await couple.click('button:has-text("+ Stół okrągły")');
  await couple.waitForSelector("text=Miejsca (8)", { timeout: 10000 });
  assert(true, "stół dodany do planera dla testu usadzania grupowego");

  await rep.goto(groupInviteUrl);
  await rep.waitForSelector("text=Miejsca przy stołach", { timeout: 10000 });
  assert(true, "sekcja usadzania grupy widoczna po włączeniu opcji");

  await rep.locator('input[type="radio"][name^="seat_"]').first().check({ force: true });
  await rep.locator('form:has(input[name^="seat_"]) button[type="submit"]').click();
  await rep.waitForURL(/seatSaved=1/);
  assert(true, "przedstawiciel grupy usadził Ewę (potwierdzoną) przy stole");

  // =========================================================================
  // 2. Ręczne przypomnienia
  // =========================================================================
  await couple.goto(`${BASE}/admin/guests?weddingId=${weddingId}`);
  await couple.locator('input[name="firstName"]').fill("Marek");
  const phoneField = couple.locator('form:has(input[name="firstName"]) input[name="phone"]').first();
  const emailField = couple.locator('form:has(input[name="firstName"]) input[name="email"]').first();
  await phoneField.fill("600100200");
  await emailField.fill("marek@example.com");
  await couple.click('button:has-text("Dodaj gościa")');
  await couple.waitForSelector("text=Marek");

  const remindSummary = couple.locator('summary:has-text("Przypomnij")').first();
  await remindSummary.click();
  await couple.waitForSelector('button:has-text("Przypomnij mailem")');
  await couple.waitForSelector('button:has-text("Przypomnij SMS-em")');
  assert(true, "przyciski ręcznego przypomnienia (mailto:/sms:) widoczne dla gościa z kontaktem");

  // =========================================================================
  // 3. Menu i alergeny
  // =========================================================================
  await couple.goto(`${BASE}/admin/menu?weddingId=${weddingId}`);
  await couple.fill('input[name="category"]', "Danie główne");
  await couple.fill('input[name="name"]', "Kaczka z jabłkami");
  await couple.locator('label:has-text("Gluten") input[type="checkbox"]').check({ force: true });
  await couple.locator('label:has-text("Mleko") input[type="checkbox"]').check({ force: true });
  await couple.click('button:has-text("Dodaj danie")');
  await couple.waitForSelector("text=Kaczka z jabłkami");
  assert((await couple.content()).includes("Gluten"), "danie z zaznaczonymi alergenami zapisane w panelu");

  // Marek został dodany jako ostatni gość - jego wiersz i przycisk kopiowania
  // linku są ostatnie na liście (kolejność wg daty dodania).
  await couple.goto(`${BASE}/admin/guests?weddingId=${weddingId}`);
  await couple.evaluate(() => {
    window.__copiedMarek = null;
    navigator.clipboard.writeText = async (text) => {
      window.__copiedMarek = text;
    };
  });
  await couple.locator('button:has-text("Skopiuj link dla gościa")').last().click();
  const marekUrl = await couple.evaluate(() => window.__copiedMarek);

  const marekCtx = await browser.newContext();
  await marekCtx.addCookies([{ name: "guest_locale", value: "pl", url: BASE }]);
  const marek = await marekCtx.newPage();
  await marek.goto(marekUrl);
  await marek.waitForURL(/\/(zgoda|moje-zaproszenie)/);
  if (marek.url().includes("/zgoda")) {
    await marek.check('input[name="consent"]');
    await marek.click('button[type="submit"]');
    await marek.waitForURL(/\/moje-zaproszenie/);
  }
  assert((await marek.content()).includes("Kaczka z jabłkami"), "gość widzi danie menu na swojej stronie zaproszenia");
  assert((await marek.content()).includes("Gluten"), "gość widzi oznaczone alergeny dania");

  // =========================================================================
  // 4. Raport konfigurowalny
  // =========================================================================
  await couple.goto(`${BASE}/admin/report?weddingId=${weddingId}`);
  const fullReport = await couple.content();
  assert(fullReport.includes("Stopień potwierdzania gości"), "raport (domyślnie pełny) pokazuje sekcję RSVP");
  assert(fullReport.includes("Alergie i uwagi dietetyczne"), "raport pokazuje sekcję alergii");
  assert(fullReport.includes("Zgłoszone piosenki"), "raport pokazuje sekcję piosenek");
  assert(fullReport.includes("Wybrane miejsca siedzące"), "raport pokazuje sekcję miejsc");
  assert(/\d+ z \d+ gości potwierdziło przybycie/.test(fullReport), "raport liczy odsetek potwierdzeń");

  // Odznaczenie wszystkiego oprócz RSVP -> tylko ta sekcja ma zostać.
  const checkboxes = couple.locator('form[method="get"] input[type="checkbox"]');
  const count = await checkboxes.count();
  for (let i = 0; i < count; i++) {
    const value = await checkboxes.nth(i).getAttribute("name");
    if (value !== "rsvp") await checkboxes.nth(i).uncheck({ force: true });
  }
  await couple.click('button:has-text("Generuj raport")');
  await couple.waitForURL(/submitted=1/);
  // UWAGA: sam formularz wyboru sekcji ZAWSZE wypisuje wszystkie etykiety
  // (w checkboxach), więc .includes() na całej stronie złapałoby "Zgłoszone
  // piosenki" nawet gdy sekcja raportu jest ukryta - sprawdzamy więc konkretny
  // nagłówek <h3> sekcji raportu, nie dowolne wystąpienie tekstu na stronie.
  await couple.waitForSelector('h3:has-text("Stopień potwierdzania gości")');
  assert(true, "po zawężeniu: sekcja RSVP nadal widoczna");
  assert(
    (await couple.locator('h3:has-text("Zgłoszone piosenki")').count()) === 0,
    "po zawężeniu: sekcja piosenek ZNIKA, gdy odznaczona"
  );
  assert(
    (await couple.locator('h3:has-text("Wybrane miejsca siedzące")').count()) === 0,
    "po zawężeniu: sekcja miejsc ZNIKA, gdy odznaczona"
  );

  await browser.close();
  console.log("\nWSZYSTKIE TESTY NOWYCH FUNKCJI PRZESZŁY POMYŚLNIE");
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
