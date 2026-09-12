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
  await couple.check('input[name="privacyConsent"]');
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

  // --- "Podedytor" miejsc - do stołów zsuniętych w nieregularny sposób,
  //     gdzie część krawędzi fizycznie nie mieści krzesła (patrz
  //     adminSetSeatDisabled w src/lib/db/tables.ts). Przycisk "Wyłącz"
  //     jest tylko przy WOLNYCH miejscach (miejsce #1 ma już Zofię i
  //     zamiast niego pokazuje "Usuń") - celujemy więc w pierwsze wolne. ---
  const seatRows = couple.locator("div:has(> span.w-6)");
  const freeSeatRow = seatRows.filter({ has: couple.getByRole("button", { name: "Wyłącz" }) }).first();
  await freeSeatRow.getByRole("button", { name: "Wyłącz" }).click();
  await couple.waitForSelector("text=wyłączone - brak krzesła");
  assert(true, "wolne miejsce wyłączone - w panelu widać 'wyłączone - brak krzesła'");

  await couple.getByRole("button", { name: "Przywróć" }).click();
  await couple.waitForSelector("text=wyłączone - brak krzesła", { state: "detached" });
  assert(true, "przywrócenie miejsca działa - dropdown przypisania wraca");

  // --- Gość: widzi WYŁĄCZNIE własny stolik, nigdy plan sali ---
  const guestCtx = await browser.newContext();
  // Wymuszamy polski, żeby test nie zależał od tego, z jakiego kraju
  // faktycznie łączy się maszyna uruchamiająca testy (patrz src/proxy.ts -
  // automatyczne wykrywanie języka po adresie IP przy pierwszym wejściu).
  await guestCtx.addCookies([{ name: "guest_locale", value: "pl", url: BASE }]);
  const guest = await guestCtx.newPage();
  await guest.goto(inviteUrl);
  await guest.waitForURL(/\/(zgoda|moje-zaproszenie)/);
  if (guest.url().includes("/zgoda")) {
    await guest.check('input[name="consent"]');
    await guest.click('button[type="submit"]');
    await guest.waitForURL(/\/moje-zaproszenie/);
  }

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

  // --- Znaczniki (DJ, bufet...) i ściany ---
  // window.prompt/confirm nie mają domyślnej obsługi w Playwright (dialog
  // jest automatycznie ODRZUCANY, jeśli nic go nie przechwyci) - stąd
  // jednorazowy handler ustawiany PRZED kliknięciem, który akceptuje z
  // zadanym tekstem (dla prompt) albo po prostu zatwierdza (dla confirm).
  // Selektor po title, nie po tekście "DJ" - przycisk paska narzędzi "+
  // Oznaczenie (DJ, bufet...)" TEŻ zawiera "DJ" jako podtekst, więc
  // has-text("DJ") łapałby oba na raz. "elementu", nie samo "zmień nazwę" -
  // przycisk zmiany nazwy STOŁU ma bardzo podobny title ("...nazwę stołu"),
  // więc na wolniejszym łączu (żywy serwer) można było chwilowo złapać
  // jeszcze widoczny panel stołu sprzed kliknięcia zamiast nowo dodanego
  // znacznika - złapane empirycznie.
  const markerLabelButton = couple.locator('button[title="Kliknij, żeby zmienić nazwę elementu"]');
  couple.once("dialog", (dialog) => {
    console.log(`  [dialog] type=${dialog.type()} message=${JSON.stringify(dialog.message())}`);
    dialog.accept("DJ");
  });
  await couple.click('button:has-text("+ Oznaczenie")');
  await couple.waitForTimeout(500);
  await markerLabelButton.waitFor({ timeout: 10000 });
  const markerLabelText = (await markerLabelButton.innerText()).trim();
  assert(markerLabelText === "DJ", `dodano znacznik 'DJ', widoczny jako nazwa w panelu bocznym (odczytano: "${markerLabelText}")`);

  couple.once("dialog", (dialog) => dialog.accept());
  await couple.click('button:has-text("Usuń")');
  await markerLabelButton.waitFor({ state: "detached", timeout: 10000 });
  assert(true, "usunięcie znacznika działa (panel boczny się zamknął)");

  await couple.click('button:has-text("+ Ściana")');
  await couple.waitForSelector("text=Długość (120)", { timeout: 10000 });
  assert(true, "dodano ścianę z domyślną długością 120");

  await couple.click('button[title="Zwiększ: Długość ściany"]');
  await couple.waitForSelector("text=Długość (140)", { timeout: 10000 });
  assert(true, "wydłużenie ściany działa (+20 na kliknięcie)");

  await couple.click('button:has-text("Obróć o 15°")');

  // Zmiana pozycji/rozmiaru/rotacji zapisuje się na serwer z debounce
  // (SAVE_DEBOUNCE_MS w TablePlanner.tsx) - odczekujemy z zapasem, potem
  // przeładowujemy stronę, żeby sprawdzić, że ściana NAPRAWDĘ przetrwała
  // zapis na serwer, a nie tylko żyje w stanie komponentu w przeglądarce.
  await couple.waitForTimeout(1000);
  const consoleErrors = [];
  couple.on("pageerror", (err) => consoleErrors.push(String(err)));
  await couple.reload();
  await couple.waitForSelector("canvas", { state: "visible", timeout: 15000 });
  await couple.waitForTimeout(500);
  assert(consoleErrors.length === 0, "strona planera po przeładowaniu wczytuje się bez błędów JS (ściana z bazy)");

  // --- Kształt sali (rozciągana bryła dookoła stołów) ---
  await couple.click('button:has-text("+ Kształt sali")');
  await couple.waitForSelector("text=Szerokość (320)", { timeout: 10000 });
  assert(true, "dodano domyślny kształt sali (prostokąt 320×220)");

  await couple.click('button:has-text("Romb")');
  await couple.waitForFunction(
    () =>
      Array.from(document.querySelectorAll("button")).some(
        (b) => b.textContent === "Romb" && b.className.includes("bg-zinc-900")
      ),
    { timeout: 10000 }
  );
  assert(true, "zmiana kształtu na romb działa (przycisk 'Romb' aktywny)");

  await couple.click('button[title="Zwiększ: Szerokość elementu"]');
  await couple.waitForSelector("text=Szerokość (340)", { timeout: 10000 });
  assert(true, "rozciąganie kształtu sali działa (+20 na kliknięcie)");

  // --- Zmiana rozmiaru stołu (żeby krzesła się nie nakładały przy wielu gościach) ---
  await couple.locator("canvas").first().click({ position: { x: 120, y: 120 } });
  await couple.waitForSelector("text=Rozmiar (46)", { timeout: 10000 });
  await couple.click('button[title="Zwiększ: Rozmiar stołu"]');
  await couple.waitForSelector("text=Rozmiar (56)", { timeout: 10000 });
  assert(true, "ręczne powiększenie okrągłego stołu działa (+10 na kliknięcie)");

  // Dokładenie miejsc ponad to, co mieści bieżący rozmiar, automatycznie
  // powiększa stół (patrz src/lib/tableGeometry.ts) - przy 8 miejscach i
  // promieniu 56 jest jeszcze zapas, więc dokładamy sporo naraz.
  for (let i = 0; i < 10; i++) {
    await couple.click('button[title="Dodaj jedno miejsce"]');
  }
  await couple.waitForSelector("text=Miejsca (18)", { timeout: 10000 });
  const radiusText = await couple.locator("p", { hasText: "Rozmiar (" }).innerText();
  const radiusValue = Number(radiusText.match(/\((\d+)\)/)[1]);
  assert(radiusValue > 56, `stół automatycznie urósł przy 18 miejscach (promień: ${radiusValue}, był 56)`);

  // --- Limit 4 sal/planów ---
  // Wedding startuje z 1 domyślną salą, więc potrzeba 3 kliknięć, żeby
  // dojść do limitu MAX_ROOMS=4 (przycisk znika dopiero PO osiągnięciu limitu,
  // patrz warunek `rooms.length < MAX_ROOMS` w TablePlanner.tsx).
  couple.on("dialog", (dialog) => dialog.accept(`Sala ${Math.random()}`));
  for (let i = 0; i < 3; i++) {
    await couple.click('button:has-text("+ Nowa sala/plan")');
    await couple.waitForTimeout(300);
  }
  const newRoomButtonCount = await couple.locator('button:has-text("+ Nowa sala/plan")').count();
  assert(
    newRoomButtonCount === 0,
    "po osiągnięciu 4 sal przycisk '+ Nowa sala/plan' znika (limit działa)"
  );

  await browser.close();
  console.log("\nWSZYSTKIE TESTY PLANERA STOŁÓW PRZESZŁY POMYŚLNIE");
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
