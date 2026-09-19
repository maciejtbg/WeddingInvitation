// Test end-to-end: zabezpieczenie planera przed nakładającymi się stołami,
// przypisanie stołu do grupy WPROST z planera (z ostrzeżeniami o pojemności/
// pustej grupie), panel ostrzeżeń o niespójnościach grupa/stół (ten sam co
// na stronie Grupy gości - patrz src/lib/seatingWarnings.ts), przypisanie
// gościa BEZ grupy do miejsca (dalej ma działać), i informacja o
// przypisanym miejscu na liście gości.
//
// WAŻNE - jak w smoke-tables.mjs: bez --disable-gpu w launchOptions (Konva +
// headless Chromium bez GPU wpada w patologicznie wolną ścieżkę).
//
// Uruchomienie:
//   npm run build && npm run start -- -p 3100
//   SMOKE_BASE_URL=http://localhost:3100 npm run smoke:planner-groups

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

async function setGuestGroup(page, guestFirstName, groupLabel) {
  const form = page.locator("div.rounded-lg.border-zinc-200", { hasText: guestFirstName }).locator(
    'form:has(select[name="groupId"])'
  );
  await form.locator('select[name="groupId"]').selectOption({ label: groupLabel });
  await form.locator("button").click();
  await page.waitForLoadState("networkidle");
}

(async () => {
  const browser = await chromium.launch(launchOptions);
  const couple = await (await browser.newContext()).newPage();

  const email = `test-plangroup-${Date.now()}@example.com`;
  await couple.goto(`${BASE}/admin/register`);
  await couple.fill('input[name="partner1Name"]', "Nika");
  await couple.fill('input[name="partner2Name"]', "Olek");
  await couple.fill('input[name="email"]', email);
  await couple.fill('input[name="password"]', "supertajnehaslo");
  await couple.check('input[name="privacyConsent"]');
  await couple.click('button[type="submit"]');
  await couple.waitForURL(/\/admin\?welcome=/);

  const weddingIdMatch = await couple.locator("a[href*='weddingId=']").first().getAttribute("href");
  const weddingId = new URL(BASE + weddingIdMatch).searchParams.get("weddingId");
  assert(!!weddingId, "rejestracja pary OK, weddingId=" + weddingId);

  // =========================================================================
  // 1. Grupa (na razie pusta) + trzej goście: Kuba zostaje BEZ grupy przez
  //    cały test (sekcja 4 niżej), Luna i Piotr dołączą do grupy później.
  // =========================================================================
  await couple.goto(`${BASE}/admin/groups?weddingId=${weddingId}`);
  await couple.fill('input[placeholder="np. Rodzina Pana Młodego"]', "Świadkowie");
  await couple.click('button:has-text("Dodaj")');
  await couple.waitForSelector('input[value="Świadkowie"]');
  assert(true, "grupa 'Świadkowie' utworzona (na razie pusta)");

  await couple.goto(`${BASE}/admin/guests?weddingId=${weddingId}`);
  for (const name of ["Kuba", "Luna", "Piotr"]) {
    await couple.fill('input[name="firstName"]', name);
    await couple.click('button:has-text("Dodaj gościa")');
    await couple.waitForSelector(`text=${name}`);
  }
  assert(true, "dodano trzech gości: Kuba, Luna, Piotr");

  // =========================================================================
  // 2. Planer: dwa stoły, próba nałożenia jednego na drugi
  // =========================================================================
  await couple.goto(`${BASE}/admin/tables`);
  await couple.waitForSelector("canvas", { state: "visible", timeout: 15000 });
  await couple.click('button:has-text("+ Stół okrągły")');
  // UWAGA - czekamy na ETYKIETĘ konkretnego stołu ("Stół 1"/"Stół 2"), NIE na
  // ogólny tekst panelu bocznego typu "Miejsca (8)" - ten drugi jest
  // niejednoznaczny (panel Stołu 1 już go pokazuje), więc czekanie na niego
  // po dodaniu Stołu 2 potrafi rozwiązać się NATYCHMIAST, zanim Stół 2
  // faktycznie powstanie (asynchroniczny createTableAction) - złapane
  // empirycznie: powodowało to start przeciągnięcia zanim Stół 2 istniał na
  // kanwie, więc żadne dragStart/dragEnd się nie odpalało i test fałszywie
  // wyglądał na "zabezpieczenie zadziałało" mimo że przeciągnięcie się w
  // ogóle nie wydarzyło.
  await couple.waitForSelector("text=Stół 1", { timeout: 10000 });
  await couple.click('button:has-text("+ Stół okrągły")');
  await couple.waitForSelector("text=Stół 2", { timeout: 10000 });
  assert(true, "dodano dwa stoły okrągłe (Stół 1 na [120,120], Stół 2 na [270,120])");

  const canvasBox = await couple.locator("canvas").first().boundingBox();
  // Przeciągnij Stół 2 (270,120) dokładnie na Stół 1 (120,120) - powinno
  // zostać odrzucone (kolizja) i stół ma wrócić na swoją starą pozycję.
  //
  // UWAGA - Konva potrzebuje WOLNEGO, "prawdziwego" gestu: jeden szybki
  // `mouse.move(..., { steps })` bez przerw między krokami NIE rejestruje
  // się jako przeciągnięcie (złapane empirycznie - stół zostaje na miejscu,
  // co fałszywie wyglądałoby jak działające zabezpieczenie, mimo że drag
  // się w ogóle nie wydarzył). Jawne, małe kroki z odczekaniem między nimi
  // dają Konva czas na przetworzenie każdego ruchu.
  await couple.mouse.move(canvasBox.x + 270, canvasBox.y + 120);
  await couple.mouse.down();
  await couple.waitForTimeout(100);
  for (let i = 1; i <= 15; i++) {
    await couple.mouse.move(canvasBox.x + 270 - (150 * i) / 15, canvasBox.y + 120);
    await couple.waitForTimeout(20);
  }
  await couple.waitForTimeout(100);
  await couple.mouse.up();
  await couple.waitForSelector("text=Stoły nie mogą się na siebie nakładać", { timeout: 5000 });
  assert(true, "ZABEZPIECZENIE: nałożenie stołów na siebie zostało odrzucone z komunikatem");

  // Stół 2 powinien wciąż być klikalny na swojej STAREJ pozycji (270,120) -
  // gdyby przesunięcie faktycznie przeszło, kliknięcie tutaj trafiłoby w
  // puste miejsce (albo w Stół 1, gdyby oba wylądowały w tym samym punkcie).
  await couple.locator("canvas").first().click({ position: { x: 270, y: 120 } });
  await couple.waitForSelector("text=Miejsca (8)", { timeout: 5000 });
  assert(true, "Stół 2 zachował swoją pozycję sprzed przeciągnięcia (nadal wybieralny w [270,120])");

  // =========================================================================
  // 3. Przypisanie stołu do grupy WPROST z planera - ostrzeżenie "pusta grupa"
  // =========================================================================
  // Stół 2 jest teraz zaznaczony. Grupa "Świadkowie" wciąż nie ma ŻADNEGO
  // członka - włączenie powinno przejść (nieblokujące), ale pokazać
  // ostrzeżenie.
  await couple.click('button:has-text("Świadkowie")');
  await couple.waitForSelector("text=nie ma jeszcze żadnego gościa", { timeout: 5000 });
  assert(true, "OSTRZEŻENIE: przypisanie PUSTEJ grupy do stołu pokazuje komunikat, ale NIE blokuje akcji");

  // =========================================================================
  // 4. Ostrzeżenie o pojemności - grupa rośnie do 2 osób, stół ma 1 miejsce
  // =========================================================================
  for (let i = 0; i < 7; i++) {
    await couple.click('button[title="Usuń jedno miejsce (z brzegu)"]');
    await couple.waitForTimeout(150);
  }
  await couple.waitForSelector("text=Miejsca (1)", { timeout: 5000 });

  await couple.goto(`${BASE}/admin/guests?weddingId=${weddingId}`);
  await setGuestGroup(couple, "Luna", "Świadkowie");
  await setGuestGroup(couple, "Piotr", "Świadkowie");
  assert(true, "Luna i Piotr dołączyli do grupy 'Świadkowie' (2 osoby, stół ma tylko 1 miejsce)");

  // Panel ostrzeżeń jest liczony NA ŻYWO z aktualnego stanu - nie trzeba nic
  // dodatkowo przełączać, żeby zauważył nadwyżkę. Jest to <details> domyślnie
  // ZWINIĘTY (tylko <summary> jest zawsze widoczny) - trzeba go otworzyć,
  // zanim treść konkretnego ostrzeżenia (<li> w środku) stanie się "visible"
  // dla Playwrighta.
  await couple.goto(`${BASE}/admin/tables`);
  await couple.waitForSelector("canvas", { state: "visible", timeout: 15000 });
  await couple.waitForSelector("text=rzecz", { timeout: 5000 });
  assert(true, "PANEL OSTRZEŻEŃ: utrwalone podsumowanie widoczne w planerze");

  await couple.click("summary:has-text('rzecz')");
  await couple.waitForSelector("text=/mają razem tylko 1 miejsce/", { timeout: 5000 });
  assert(true, "PANEL OSTRZEŻEŃ (planer): pojemność grupy przekroczona (2 osoby, 1 miejsce)");

  // Ta sama funkcja licząca (src/lib/seatingWarnings.ts) ma dać ten sam
  // wynik na stronie Grupy gości.
  await couple.goto(`${BASE}/admin/groups?weddingId=${weddingId}`);
  await couple.waitForSelector("text=/mają razem tylko 1 miejsce/", { timeout: 5000 });
  assert(true, "PANEL OSTRZEŻEŃ: to samo podsumowanie widoczne też na stronie Grupy gości");

  // =========================================================================
  // 5. Gość BEZ grupy nadal da się przypisać do miejsca w planerze
  // =========================================================================
  await couple.goto(`${BASE}/admin/tables`);
  await couple.waitForSelector("canvas", { state: "visible", timeout: 15000 });
  await couple.locator("canvas").first().click({ position: { x: 120, y: 120 } });
  await couple.waitForSelector("text=Miejsca (8)", { timeout: 5000 });
  const seatSelect = couple.locator("select").filter({ hasText: "przypisz gościa" }).first();
  const options = await seatSelect.locator("option").allTextContents();
  assert(
    options.some((o) => o.includes("Kuba")),
    "Kuba (BEZ przypisanej grupy) jest wybieralny w dropdownie przypisania miejsca w planerze: " +
      JSON.stringify(options)
  );
  await seatSelect.selectOption({ label: "Kuba " });
  await couple.waitForSelector("text=Kuba", { timeout: 5000 });
  assert(true, "przypisano Kubę (bez grupy) do miejsca przy Stole 1 - działa mimo braku grupy");

  // =========================================================================
  // 6. Lista gości pokazuje przypisane miejsce / jego brak
  // =========================================================================
  await couple.goto(`${BASE}/admin/guests?weddingId=${weddingId}`);
  await couple.waitForSelector("text=Miejsce: Stół 1, #1");
  assert(true, "LISTA GOŚCI: Kuba pokazuje przypisane miejsce (Stół 1, #1)");
  const brakCount = await couple.locator("text=brak przypisanego miejsca").count();
  assert(brakCount >= 1, "LISTA GOŚCI: gość bez miejsca (Luna/Piotr) pokazuje 'brak przypisanego miejsca'");

  await browser.close();
  console.log("\nWSZYSTKIE TESTY PLANERA/GRUP/OSTRZEŻEŃ PRZESZŁY POMYŚLNIE");
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
