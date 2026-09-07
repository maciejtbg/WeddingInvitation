# Wedding App - strony ślubne z RSVP

Szkielet aplikacji: konto pary młodej, strona-zaproszenie z unikalnym adresem,
lista gości, prywatne linki dla każdego gościa, RSVP i czat gość-para.
Kontekst biznesowy (analiza konkurencji, hosting, wybór funkcji) jest
opisany osobno, w rozmowie, w której powstał ten projekt.

## Status

To jest szkielet, nie gotowy produkt. Działa i jest przetestowane end-to-end
(patrz `npm run smoke`, `npm run smoke:tables`, `npm run smoke:seating`,
`npm run smoke:invite-card`, `npm run smoke:locations`, `npm run smoke:i18n`,
`npm run smoke:gallery`, `npm run smoke:extras`, `npm run smoke:music` i
`npm run smoke:gdpr` niżej), ale brakuje jeszcze m.in.:

- logowania Google/Facebook/telefonem dla gości (OAuth wymaga założenia
  aplikacji u dostawcy, logowanie telefonem - płatnej bramki SMS typu
  Twilio/SMSAPI, albo własnego mostka SMS na starym telefonie z kartą SIM -
  patrz sekcja "Logowanie Google" niżej),
- prawdziwej galerii zdjęć na Cloudflare R2 (na razie jest lekki placeholder
  na lokalnym dysku, patrz niżej - do podmiany, gdy będzie konto R2),
- panelu do zarządzania czatami ze wszystkimi gośćmi naraz (na razie jest
  wejście z listy gości, jeden na jednego),
- wdrożenia na docelowy VPS (mikr.us) razem z przejściem na Postgres.

## Odliczanie, kalendarz, harmonogram, FAQ i lista muzyczna

Cztery drobniejsze funkcje, wszystkie widoczne na stronie publicznej:

- **Odliczanie do ślubu** - liczone samo z `weddings.wedding_date`, żadnej
  konfiguracji. Zero JS po stronie klienta - liczba dni jest policzona przy
  renderze strony na serwerze (`daysUntil()` w `src/app/w/[slug]/page.tsx`).
- **Kalendarz** - `/w/[slug]/calendar` zwraca prawdziwy plik `.ics`
  (`src/lib/calendarInvite.ts`, format RFC 5545, bez żadnej biblioteki) z
  alarmem dzień wcześniej - to jest właściwy "system przypomnień": raz
  dodane do kalendarza gościa wydarzenie przypomni samo, przez zwykły
  mechanizm alarmów kalendarza w telefonie, bez SMS-a i bez żadnej
  infrastruktury wysyłkowej po naszej stronie. Obok jest też bezpośredni
  link "Dodaj do Google Calendar" (URL z gotowymi parametrami, bez OAuth).
- **Harmonogram dnia** (`/admin/schedule`) i **FAQ** (`/admin/faq`) - do
  decyzji pary, prosty CRUD z kolejnością sterowaną przyciskami ↑/↓
  (prościej niż przeciąganie, tak samo skuteczne przy liście kilkunastu
  punktów). FAQ na stronie publicznej to natywne `<details>/<summary>` -
  rozwijana lista bez ani linijki JavaScriptu.
- **Lista życzeń muzycznych** (`/moje-zaproszenie/muzyka`) - każdy gość może
  wyszukać i zgłosić piosenkę w dowolnym momencie (także w trakcie samego
  ślubu - nie wymaga potwierdzonego RSVP, w odróżnieniu od wyboru miejsca).
  Wyszukiwanie przez **darmowe, nieoficjalne iTunes Search API** (bez
  klucza, `src/lib/musicSearch.ts`) - zwraca okładkę albumu i 30-sekundowy
  podgląd audio (odtwarzany przez natywny `<audio>`, bez żadnej biblioteki
  audio). Wspólna, widoczna dla wszystkich gości lista (jak wspólna
  playlista) - para moderuje (usuwa) z `/admin/music`.

Testy end-to-end: `npm run smoke:extras` (odliczanie/kalendarz/harmonogram/
FAQ) i `npm run smoke:music` (wyszukiwanie i lista muzyczna).

## Galeria zdjęć (placeholder do Cloudflare R2)

Świadomie NIE R2 - żeby nie zwiększać kosztów hostingu, zanim będzie na to
konto Cloudflare. Zamiast tego zwykły dysk serwera, z twardymi limitami:

- **`MAX_PHOTOS_PER_WEDDING = 10`** zdjęć na wesele (`src/lib/photoStorage.ts`)
  - to jedna wspólna galeria (para + goście razem), nie osobny limit na
  każdego. Formularz dodawania znika, gdy limit jest osiągnięty.
- Każde zdjęcie jest **zawsze** przeskalowane (maks. 1600 px dłuższego boku)
  i przekompresowane do JPEG po stronie serwera (`sharp`), niezależnie od
  tego, ile ważyło na wejściu (telefon potrafi wrzucić 10-15 MB) - kilka
  prób jakości aż do ~350 KB. Przy okazji re-encode do JPEG ucina metadane
  EXIF (w tym GPS), które telefony dopisują do zdjęć.
- Para dodaje/usuwa z `/admin/gallery`, goście dodają (nie usuwają) z
  `/moje-zaproszenie`. Widoczna dla wszystkich na stronie publicznej.

**Pułapka warta zapamiętania** (opisana w komentarzu w
`src/lib/photoStorage.ts`): pierwsza wersja zapisywała pliki prosto do
`public/uploads/` - działało w `next dev`, ale w `next start` (tryb
produkcyjny) pliki dopisane do `public/` PO starcie serwera dostawały 404 -
lista statycznych plików jest ustalana wcześniej, nie odświeżana na żywo.
Złapane przez test e2e, nie ręcznie - warto pamiętać przy każdej kolejnej
funkcji zapisującej pliki w runtime. Rozwiązanie: pliki w `data/uploads/`
(poza `public/`), serwowane przez własny route handler
(`src/app/uploads/[weddingId]/[fileName]/route.ts`), który czyta je z
dysku na żądanie - działa identycznie w dev i w produkcji.

Do podmiany na R2 później: cała logika zapisu/odczytu jest w jednym pliku
(`src/lib/photoStorage.ts`), reszta aplikacji odwołuje się tylko do jego
funkcji (`uploadPhoto`, `removePhoto`, `photoUrl`) - ten sam wzorzec co
migracja SQLite → Postgres.

Test end-to-end: `npm run smoke:gallery`.

## Wielojęzyczność stron dla gości

Strona publiczna, `/moje-zaproszenie` i wybór miejsca przy stole (nie panel
pary - ten zostaje po polsku) mają przełącznik języka (flagi u góry strony,
`src/components/LanguageSwitcher.tsx`). Wybór zapisuje się w ciasteczku
`guest_locale` na rok.

- **pl/en/uk/de** - ręcznie tłumaczone słowniki (`src/lib/i18n/locales/`),
  bo to najczęstsi goście polskich wesel.
- **Każdy inny język** (włącznie z kilkoma afrykańskimi w rozwijanej liście -
  suahili, amharski, hausa, joruba, zulu i inne, patrz
  `src/lib/i18n/languages.ts`) - tłumaczony NA ŻĄDANIE przy pierwszym wejściu
  gościa z tym językiem, przez darmowe, nieoficjalne API Google Translate
  (`google-translate-api-x`, bez klucza) - patrz
  `src/lib/i18n/translateDictionary.ts`. Wynik jest buforowany w tabeli
  `translation_cache` (`src/lib/db/translations.ts`), więc tłumaczenie
  dzieje się raz na język w historii aplikacji, nie przy każdym wejściu.
  Cały słownik leci w jednym zapytaniu wsadowym (nie osobne na klucz), a gdy
  nieoficjalne API akurat zawiedzie (limit/awaria), strona po cichu wraca do
  polskiego zamiast wywalić błąd 500.

**Pułapka warta zapamiętania** (opisana w komentarzu w
`src/lib/i18n/actions.ts`): druga (i kolejna) zmiana języka na TEJ SAMEJ
stronie w tej samej wizycie, bez przeładowania, potrafiła nie odświeżyć
widoku - klient Next.js miał zbuforowany RSC payload tej ścieżki z
poprzedniego wejścia, a `redirect()` do tego samego adresu z Server Action
sam z siebie nie wie, że wynik renderu się zmienił (bo zależy od ciasteczka,
nie od samego URL-a). Naprawa: `revalidatePath(returnTo)` przed
`redirect()` w `setLocaleAction`.

Test end-to-end: `npm run smoke:i18n` (w tym dokładnie ten scenariusz -
dwie zmiany języka pod rząd bez przeładowania).

## Miejsca na mapie (OpenStreetMap)

Para dodaje na `/admin/locations` dowolną liczbę miejsc (ceremonia/przyjęcie/
poprawiny/inne) klikając dokładny punkt na interaktywnej mapce
(`src/components/LocationMapPicker.tsx`) albo wyszukując adres przez
Nominatim (darmowe geokodowanie OSM, bez klucza API). Wszystkie miejsca
pokazują się gościom na stronie publicznej w sekcji "Jak do nas trafić"
(`src/components/LocationsMap.tsx`) - każda pinezka ma popup z linkiem do
nawigacji w Google Maps i Apple Maps.

**Pułapka warta zapamiętania** (opisana w komentarzu w `LocationsMap.tsx`):
mapa Leaflet zamontowana przez `next/dynamic` bywa mierzona przez
przeglądarkę z szerokością 0 w momencie pierwszego renderu - `fitBounds`
policzony na takim rozmiarze daje zoom oddalony na cały świat zamiast
okolicy. Ani `requestAnimationFrame`, ani `setTimeout` nie gwarantują, że
w tym momencie rozmiar jest już prawdziwy (rAF dodatkowo w ogóle się nie
odpala, gdy karta przeglądarki jest w tle/ukryta). Jedyne pewne rozwiązanie:
`ResizeObserver` na kontenerze mapy - jego callback dostaje realny rozmiar
przy pierwszym wywołaniu zaraz po `observe()`, więc dopiero wtedy wołamy
`invalidateSize()` i `fitBounds`/`setView`.

Test end-to-end: `npm run smoke:locations`.

## Zaproszenie: QR + kod ręczny

Obok linku (`/z/<token>`) każdy gość ma teraz dwa dodatkowe, "analogowe"
sposoby dostępu - dla gości bez Gmaila, bez telefonu ze skanerem, albo
z zaproszeniem wręczonym osobiście na papierze:

- **Karta z kodem QR** - `Pobierz zaproszenie (QR)` na liście gości pobiera
  obrazek PNG (ornament motywu + imiona pary + kod QR prowadzący do
  `/z/<token>` + krótki kod tekstowy) do wysłania jako obrazek (WhatsApp,
  Messenger) albo wydrukowania. Generowanie: `src/lib/inviteCard.ts`
  (SVG + `qrcode`, złożone przez `sharp`), endpoint:
  `src/app/admin/guests/[guestId]/invite-card/route.ts`.
- **Krótki kod ręczny** (`src/lib/db/client.ts`, `newGuestShortCode`) -
  8 znaków bez liter/cyfr łatwych do pomylenia (0/O, 1/I/L), do wpisania na
  stronie `/kod` bez skanowania i bez klikania linku - dla starszych gości
  albo kogoś, kto dostał zaproszenie od kogoś innego ustnie.

Test end-to-end: `npm run smoke:invite-card`.

## Planer stołów

Kanwa (`react-konva`) pod `/admin/tables`: wiele sal (sala to po prostu
wartość `roomName` na stole, nie osobna tabela - patrz `src/lib/db/tables.ts`),
przeciąganie stołów, obrót, zmiana kształtu okrągły/prostokątny, oraz panel
boczny do przypisywania gości do konkretnych miejsc.

- Autosave: każda zmiana pozycji trafia natychmiast do IndexedDB w przeglądarce
  (`src/lib/tablePlannerLocalStore.ts`) i z ~600ms debounce na serwer - jeśli
  połączenie się urwie w trakcie przeciągania, ostatni stan wraca po
  odświeżeniu strony z IndexedDB, nie tylko z ostatniego udanego zapisu.
- Gość widzi WYŁĄCZNIE nazwę własnego stołu i sali (sekcja "Twój stolik" na
  `/moje-zaproszenie`) - nigdy planu całej sali ani listy współbiesiadników,
  zgodnie z tym samym modelem prywatności co reszta danych gościa
  (`guestFindMySeat` w `src/lib/db/tables.ts`).
- Komponent kanwy jest ładowany wyłącznie po stronie klienta
  (`next/dynamic({ssr:false})` w `src/components/TablePlannerLoader.tsx`) -
  Konva potrzebuje `window` już przy imporcie modułu.
- Test end-to-end: `npm run smoke:tables`. Uwaga dla testów w CI/headless:
  **nie dodawać** flagi `--disable-gpu` do uruchomienia przeglądarki
  testowej - w połączeniu z Konva i headless Chromium bez GPU powoduje to
  zawieszenie strony na 100% CPU bez żadnego błędu w konsoli (opisane
  dokładnie w komentarzu na górze `scripts/smoke-tables.mjs`).
- Para może: zmienić nazwę stołu (kliknięcie nazwy w panelu bocznym),
  zmienić liczbę miejsc strzałkami +/- (przydatne przy zsuniętych/
  rozsuniętych stołach - zmniejszenie zwalnia gościa z usuwanego miejsca na
  brzegu zamiast blokować zmianę), i zobaczyć nazwę grupy, dla której stół
  jest zarezerwowany (`GROUP_CONSTRAINED`, patrz sekcja "Tryby
  rozmieszczania gości") bezpośrednio na kanwie, nie tylko na osobnej
  stronie Grupy gości.

## Poprawki czytelności i kilka błędów złapanych na żywym teście

Zestaw poprawek po pierwszym prawdziwym code review "z zewnątrz" (osoba,
która nie pisała kodu, testująca gotową appkę) - zostawione jako lekcje,
bo żadna z tych trzech nie była oczywista z samego kodu:

- **Ciemne tło pod białymi kartami w panelu pary, prawie niewidoczny tekst
  we wpisywanych polach** - `src/app/globals.css` miał niedotknięty,
  pozostały po szablonie startowym Next.js `@media (prefers-color-scheme:
  dark)`, który na systemie z ciemnym motywem zamieniał tło strony na
  czarne i domyślny kolor tekstu na prawie biały - żaden formularz w tej
  appce nie był projektowany z myślą o trybie ciemnym. Naprawa: usunięcie
  tego bloku + `color-scheme: light` na `:root` (każe przeglądarce
  renderować natywne kontrolki formularzy zawsze w jasnym wariancie,
  niezależnie od ustawień systemu) + jawne `background/color` na
  `input, textarea, select` w globalnym CSS.
- **Pinezka na mapie (panel lokalizacji) to niezaładowany obrazek** -
  domyślne ikonki Leaflet ładowane były z `unpkg.com`, którego CSP
  (`img-src`, patrz `next.config.ts`, dodane przy pracy nad RODO) nie
  wymieniał - przeglądarka po cichu blokowała obrazek, bez błędu widocznego
  gdziekolwiek poza konsolą deweloperską. Naprawa: własne kopie plików w
  `public/leaflet/` (skopiowane z `node_modules/leaflet/dist/images/`)
  zamiast CDN - nie trzeba nawet zmieniać CSP, bo `img-src 'self'` już to
  pokrywa.
- **Polskie "ł" w adresie strony znikało, zamieniane na łącznik** (np.
  "Chłop" → `ch-op`) - `slugify()` (`src/lib/db/weddings.ts`) czyścił
  znaki diakrytyczne przez `.normalize("NFKD")`, co poprawnie rozkłada
  ą/ę/ć/ń/ó/ś/ź/ż na literę bazową + osobny znak diakrytyczny, ale **nie**
  "ł"/"Ł" - to osobny punkt kodowy Unicode (U+0142/U+0141), nie kombinacja
  litery ze znakiem diakrytycznym, więc NFKD nic z nim nie robi, a kolejny
  krok (wywalenie wszystkiego spoza `[a-z0-9]`) zamieniał go w myślnik.
  Naprawa: jawna mapa transliteracji polskich znaków, zastosowana PRZED
  normalizacją NFKD.

## Tryby rozmieszczania gości

Para wybiera tryb w ustawieniach wesela (`src/lib/seatingModes.ts`):

- **COUPLE_ONLY** - para przypisuje ręcznie w planerze (domyślny, jedyny
  tryb sprzed tej funkcji).
- **GUEST_SELF_SELECT** - potwierdzony gość (`rsvpStatus === "YES"`) widzi
  wolne miejsca przy wszystkich stołach i wybiera/zmienia sam
  (`GuestSeatSection.tsx`) - w odróżnieniu od `adminAssignSeat` używanego
  przez parę, samoobsługowy wybór (`guestSelfAssignSeat` w
  `src/lib/db/tables.ts`) NIGDY nie "podbija" kogoś, kto już tam siedzi -
  zajęte miejsce jest po prostu niewybieralne.
- **GUEST_REQUEST** - gość nie przenosi się sam, tylko wysyła prośbę
  tekstem; para akceptuje/odrzuca na `/admin/seat-requests` i przenosi go
  ręcznie w planerze.
- **GROUP_CONSTRAINED** - jak `GUEST_SELF_SELECT`, ale wybór ograniczony do
  stołów dozwolonych grupie gościa. Grupy (rodzina/praca/przyjaciele) i ich
  zezwolenia na stoły ustawia się na `/admin/groups` - grupa bez żadnego
  zaznaczonego stołu ma dostęp do wszystkich (nie trzeba konfigurować
  ograniczeń dla grup, którym para ufa bez zastrzeżeń).

`groupLabel` na gościu (wolny tekst, prywatna notatka pary) i `groupId`
(strukturalna grupa do uprawnień rozmieszczania) to dwa niezależne pola -
patrz komentarz w `src/lib/db/types.ts`.

Test end-to-end wszystkich czterech trybów: `npm run smoke:seating`.

**Domyślny tryb to `GROUP_CONSTRAINED`, nie `COUPLE_ONLY`** - najbardziej
typowy przypadek to para wyznaczająca obszary/stoły poszczególnym grupom
gości (rodzina, praca, przyjaciele), a członkowie grupy sami dogadują się,
kto siedzi gdzie w obrębie przydzielonych stołów. Grupa bez żadnego
ograniczonego stołu ma dostęp do wszystkich, więc ten tryb jest neutralny,
dopóki para faktycznie nie ograniczy żadnej grupy - stąd bezpieczny jako
domyślny.

## RODO i ochrona danych osobowych

Strona **gromadzi dane osobowe gości** (imię i nazwisko, RSVP, uwagi
dietetyczne, miejsce przy stole, treść wiadomości, zdjęcia, prośby
muzyczne), więc podlega RODO (Rozporządzeniu 2016/679).

### Które przepisy mają zastosowanie i dlaczego

Zbadane przed implementacją - w skrócie:

- **To NIE jest kwestia narodowości twórcy ani lokalizacji serwera.**
  Terytorialny zakres RODO (art. 3) obejmuje: (a) każdego administratora
  danych **mającego siedzibę/prowadzącego działalność w UE**, niezależnie od
  tego, gdzie fizycznie stoi serwer (art. 3 ust. 1), oraz (b) administratorów
  spoza UE, jeśli **oferują usługi osobom w UE** (art. 3 ust. 2). Hosting na
  serwerze poza UE (np. tani VPS gdziekolwiek) NIE zwalnia z RODO, jeśli
  administrator (para/prowadzący instancję) działa/mieszka w UE albo strona
  jest skierowana do gości w UE.
- **Wyjątek "działalności czysto osobistej/domowej" (art. 2 ust. 2 lit. c)
  prawdopodobnie NIE chroni tej aplikacji** - strony `/w/[slug]` są
  publicznie dostępne pod adresem URL (nie są prywatnym, zamkniętym
  systemem), co w świetle orzecznictwa (np. sprawa Bodil Lindqvist, C-101/01)
  zwykle wyłącza ten wyjątek. Dlatego zaimplementowano pełną zgodność,
  zamiast polegać na wyjątku.
- Kto jest **administratorem danych** gości: para młoda, która założyła
  konto i zaprasza gości - to ona decyduje o celach i sposobach
  przetwarzania (patrz `/polityka-prywatnosci`). Jeśli hostujesz tę
  aplikację dla wielu par (nie tylko dla siebie), rozważ konsultację
  prawną - w takim układzie Ty (operator instancji) możesz pełnić rolę
  procesora/współadministratora wobec danych ich gości.

**To nie jest porada prawna** - to podsumowanie researchu zrobionego przy
implementacji tej funkcji. Jeśli masz wątpliwości (szczególnie przy
hostowaniu dla wielu par), skonsultuj się z prawnikiem.

### Co zostało zaimplementowane

- **Zgoda i jej ewidencja** (art. 6, 7 i zasada rozliczalności z art. 5 ust. 2)
  - Rejestracja pary wymaga zaznaczenia zgody na politykę prywatności
    (`src/app/admin/register/`, `registerCoupleAction`) - bez tego rejestracja
    jest odrzucana.
  - Pierwsze wejście gościa (przez `/z/<token>` albo `/kod`) prowadzi na
    bramę zgody `/w/[slug]/zgoda`, zanim zobaczy jakikolwiek formularz z
    danymi - zwracający gość z ważną zgodą przechodzi od razu dalej.
  - Każda zgoda jest zapisana w tabeli `consents` (kto, kiedy, na jaką
    **wersję** polityki) - patrz `src/lib/db/consents.ts`. Sama checkbox w
    UI, bez śladu w bazie, nie wystarcza do wykazania zgody przy kontroli.
  - **Zgoda jest wymuszana na dwóch poziomach**, nie tylko na renderze
    strony: każda Server Action zapisująca dane gościa (RSVP, wiadomość,
    wybór miejsca, zdjęcie, prośba muzyczna - `src/app/w/[slug]/moje-zaproszenie/actions.ts`)
    sama sprawdza zgodę (`requireGuestConsent`), bo POST do Server Action
    to osobny punkt wejścia, niezależny od tego, czy gość w ogóle zobaczył
    formularz - sam render strony to za mało.
- **Polityka prywatności** (art. 13-14) - `/polityka-prywatnosci`, publiczna,
  bez sesji. Treść w `src/lib/privacyPolicyContent.ts` (źródło: polski),
  tłumaczona na żądanie tym samym mechanizmem co reszta i18n (patrz sekcja
  "Wielojęzyczność" wyżej) i buforowana w tabeli `policy_translation_cache`.
- **Prawo do usunięcia / "bycia zapomnianym"** (art. 17)
  - **Gość**: przycisk "Usuń moje dane" na `/moje-zaproszenie` ->
    `/w/[slug]/usun-dane` (osobna strona potwierdzenia - nieodwracalna
    operacja). Kasuje zdjęcia gościa z dysku (`removePhotosByGuest`),
    potem wiersz gościa (`guestDeleteSelf`) - kaskada bazy (`ON DELETE
    CASCADE`) sama usuwa przy okazji wiadomości czatu, przypisanie miejsca
    i prośby o zmianę miejsca.
  - **Para**: "Usuń konto i wszystkie dane" na `/admin/privacy`
    (dwustopniowe potwierdzenie, bez JS - link z `?confirmDelete=1`, nie
    modal). Kasuje WSZYSTKIE zdjęcia wszystkich wesel tej pary z dysku
    (kaskada bazy nie dotyka systemu plików), potem konto - kaskada usuwa
    resztę (wesela, gości, stoły, wiadomości, harmonogram, FAQ, listę
    muzyczną).
- **Ograniczenie przechowywania / retencja** (art. 5 ust. 1 lit. e) - patrz
  `src/lib/dataRetention.ts`. Każde wesele ma `dataRetentionDays`
  (domyślnie 90, edytowalne w ustawieniach strony w `/admin`) - po tylu
  dniach od `weddingDate` dane osobowe GOŚCI (nie sama strona/motyw/
  harmonogram - to zostaje, to własne dane pary) są czyszczone: wszystkie
  zdjęcia z dysku i bazy, wszyscy goście (kaskada usuwa resztę). Wesele
  dostaje znacznik `purgedAt`, żeby nie próbować drugi raz.
  - **Aplikacja Next.js nie ma własnego procesu w tle**, więc automatyczne
    czyszczenie trzeba zaplanować z zewnątrz: trasa `POST
    /api/purge-expired-data`, zabezpieczona sekretem `RETENTION_PURGE_SECRET`
    (bez niego trasa jest wyłączona, zwraca 503), wywoływana przez cron na
    hostingu (patrz `scripts/purge-expired-data.mjs` - `npm run
    purge-expired-data`, przykładowy wpis do crontaba w komentarzu tego
    pliku).
  - Dla par bez skonfigurowanego crona: przycisk "Wyczyść teraz dane
    wszystkich gości" na `/admin/privacy` robi to samo ręcznie, w dowolnym
    momencie (np. zaraz po weselu, zamiast czekać 90 dni).
- **Bezpieczeństwo przetwarzania** (art. 32)
  - Nagłówki HTTP (`next.config.ts`): CSP, `X-Frame-Options: DENY`,
    `X-Content-Type-Options: nosniff`, `Referrer-Policy`,
    `Permissions-Policy`, HSTS. CSP dopuszcza `'unsafe-inline'` dla
    script-src/style-src - świadomy kompromis (Next.js sam wstrzykuje
    inline skrypty hydratujące, a masa komponentów używa inline
    `style={{...}}` do zmiennych CSS motywu), nie przeoczenie - nadal
    blokuje ładowanie skryptów/stylów z OBCYCH domen, czyli najczęstszy
    wektor XSS. Ambitniejsza wersja wymagałaby nonce z middleware.
  - Podstawowy rate-limiting logowania pary (`src/lib/auth/rateLimit.ts`) -
    10 nieudanych prób na email w oknie 15 minut, licznik w pamięci procesu
    (wystarczające dla jednego procesu Node na hosting, patrz ten sam
    wzorzec przy `PRAGMA busy_timeout` w `src/lib/db/client.ts`).
  - Hasła hashowane (`bcryptjs`), nigdy jawnym tekstem.
  - Zdjęcia tracą metadane (w tym GPS) przy kompresji (`sharp` domyślnie nie
    przepisuje EXIF) - patrz sekcja "Galeria zdjęć" wyżej.
  - Model izolacji danych gościa (`admin*`/`guest*`) - patrz sekcja "Model
    prywatności gości" niżej, to jest ta sama ochrona z innej strony.

Test end-to-end całej ścieżki RODO (rejestracja bez zgody odrzucona, brama
zgody dla nowego gościa, próba ominięcia bramy bezpośrednim wejściem na
`/moje-zaproszenie`, samodzielne usunięcie danych przez gościa, ręczne
czyszczenie retencyjne, usunięcie całego konta pary): `npm run smoke:gdpr`.

## Stack

- Next.js 16 (App Router, Server Actions) + TypeScript + Tailwind CSS 4.
- Baza danych: `node:sqlite` (wbudowane w Node.js 22) na etapie developmentu.
- Sesje: podpisywane ciasteczka JWT (`jose`), dwa niezależne systemy -
  jedno dla konta pary, drugie dla gościa (patrz `src/lib/auth/`).
- Hasła: `bcryptjs`.
- Zero zależności od next/font/google - fonty systemowe, żeby build działał
  też bez dostępu do fonts.googleapis.com.

### Dlaczego nie Prisma

Pierwotny plan zakładał Prisma (łatwe przejście SQLite -> Postgres jedną
zmianą w schemacie). Prisma przy pierwszym użyciu pobiera natywną binarkę
silnika z `binaries.prisma.sh` - w środowisku, w którym to pisaliśmy, ten
host był zablokowany, więc `prisma generate` się nie udawało i nie dało się
zweryfikować builda. Zamiast tego jest wbudowany w Node.js 22 moduł
`node:sqlite` (eksperymentalny, ale działa) plus własna, cienka warstwa
repozytoriów w `src/lib/db/*.ts`.

**To nie powinno być problemem na Twoim komputerze ani na docelowym VPS-ie**
(zwykły dostęp do internetu wystarczy) - jeśli wolisz wrócić do Prismy,
zamień `src/lib/db/client.ts` i pliki w `src/lib/db/*.ts` na odpowiedniki
z `@prisma/client`, reszta aplikacji korzysta wyłącznie z funkcji tych
plików (np. `adminListGuests`, `guestSubmitRsvp`), więc migracja nie dotyka
logiki biznesowej ani stron.

### Przejście na Postgres na produkcji

Zgodnie z wcześniejszą analizą hostingu: docelowo Postgres w tym samym
Dockerze co aplikacja, na VPS-ie (np. mikr.us). Migracja: podmienić
`src/lib/db/client.ts` (połączenie + `CREATE TABLE` na składnię Postgresa,
albo faktycznie wrócić do Prismy, patrz wyżej) - repozytoria w
`src/lib/db/couples.ts`, `weddings.ts`, `guests.ts`, `chat.ts` zachowują te
same nazwy i sygnatury funkcji, więc strony i akcje w `src/app/` nie
wymagają zmian.

## Jak uruchomić lokalnie

```bash
npm install
cp .env.example .env
# ustaw w .env losowy SESSION_SECRET, np.:
openssl rand -base64 32
npm run dev
```

Otwórz http://localhost:3000.

## Wdrożenie testowe na VPS

Krok po kroku (Node.js + systemd + nginx + HTTPS) w
[`deploy/DEPLOY.md`](deploy/DEPLOY.md). Obecna architektura (SQLite +
zdjęcia na lokalnym dysku) jest zaprojektowana pod zwykły VPS z jednym
stale działającym procesem - nie trzeba czekać na migrację do
Postgres/Cloudflare R2, żeby to przetestować na prawdziwym serwerze.

## Jak przetestować (end-to-end)

Jest gotowy skrypt, który przechodzi całą ścieżkę: rejestracja pary, dodanie
gościa, wejście na jego prywatny link, RSVP, czat w obie strony, oraz
sprawdza izolację (gość nie widzi cudzych danych, nie dostaje się do panelu
admina, zgadnięty token nie działa).

```bash
npm run build
npm run start &          # osobny terminal albo w tle
npx playwright install chromium   # tylko raz, pobiera przeglądarkę testową
npm run smoke              # szkielet: rejestracja, RSVP, czat, izolacja
npm run smoke:tables       # planer stołów
npm run smoke:seating      # 4 tryby rozmieszczania gości + grupy
npm run smoke:invite-card  # karta z kodem QR + logowanie krótkim kodem
npm run smoke:locations    # miejsca na mapie OSM
npm run smoke:i18n         # przełącznik języka + tłumaczenie na żądanie
npm run smoke:gallery      # galeria zdjęć (limit, kompresja, serwowanie)
npm run smoke:extras       # odliczanie, kalendarz .ics, harmonogram, FAQ
npm run smoke:music        # wyszukiwanie i lista życzeń muzycznych
npm run smoke:gdpr         # zgoda, prawo do usunięcia, retencja (RODO)
```

## Model prywatności gości (ważne, żeby to rozumieć zanim się coś zmieni)

Opisane dokładnie w komentarzach w `src/lib/db/guests.ts`, w skrócie:

- Każdy gość ma unikalny, losowy `token` (część linku `/z/<token>`) - to
  jedyny sposób, żeby "zalogować się" jako ten gość.
- Wejście na `/z/<token>` zamienia token na podpisane ciasteczko sesji
  (`src/lib/auth/guest.ts`) - od tej pory gość używa strony bez tokenu
  w adresie.
- Funkcje w `guests.ts` z przedrostkiem `admin*` zwracają pełne dane
  (całą listę gości, notatki pary) - wolno je wołać wyłącznie z tras
  zabezpieczonych sesją pary.
- Funkcje z przedrostkiem `guest*` zawsze biorą `guestId` z sesji gościa,
  nigdy z danych przesłanych przez formularz - więc nawet znając cudze id,
  nie da się przez nie nic zobaczyć ani zmienić.
- Nigdzie w kodzie nie ma endpointu, który zwracałby listę wszystkich gości
  komukolwiek poza kontem pary.

## Logowanie Google (kolejny krok, jeszcze nie podłączone)

Zależności pod to nie są jeszcze zainstalowane. Żeby to dodać:

1. Załóż projekt w Google Cloud Console, w sekcji "OAuth consent screen"
   i "Credentials" stwórz "OAuth client ID" typu "Web application".
2. Dodaj `GOOGLE_CLIENT_ID` i `GOOGLE_CLIENT_SECRET` do `.env`.
3. Zaimplementować dowiązanie konta Google do już istniejącego rekordu
   gościa (nie do nowego, ogólnego konta) - żeby logowanie Google było
   tylko wygodniejszym wejściem do tego samego prywatnego zaproszenia,
   a nie osobnym systemem tożsamości.

To samo dotyczy logowania przez Facebooka.

**Które konto Google użyć:** bez znaczenia technicznego - zwykłe darmowe
Gmail działa identycznie jak konto Google Workspace firmowe. Zakładanie
projektu w Google Cloud jest darmowe (logowania to nie dotyczy, płaci się
tylko za niektóre inne API). Dla ekranu zgody typu "External" z
podstawowymi uprawnieniami (email/profil) Google pozwala działać w trybie
testowym na do 100 kont bez weryfikacji - żeby wpuścić więcej gości, trzeba
"opublikować" ekran zgody (dla tak podstawowych uprawnień zwykle szybkie).

**Logowanie telefonem (SMS)** - sprawdzone opcje (stan na 2026):
- Twilio: trial pozwala wysyłać tylko do 5 ręcznie zweryfikowanych numerów -
  bezużyteczne bez przejścia na płatne konto.
- SMSAPI.pl (polski dostawca): 50 darmowych SMS przy rejestracji, bez karty -
  starczy na testy, nie na realne wesele.
- Nie ma darmowej bramki SMS na produkcyjną skalę - wysyłka zawsze kosztuje
  operatora.
- Realna opcja przy tej skali (wesele, nie tysiące userów): stary telefon z
  Androidem + aplikacja "SMS Gateway" (wystawia lokalne API HTTP) albo
  moduł SIM800L + ESP32, jako własny, praktycznie darmowy mostek SMS.

## Struktura

```
src/
  app/
    admin/            panel pary (rejestracja, logowanie, lista gości, czat)
    admin/tables/      planer stołów (patrz sekcja wyżej)
    w/[slug]/          publiczna strona wesela + /moje-zaproszenie dla gościa
    z/[token]/         wejście gościa przez unikalny link -> sesja
  lib/
    db/                warstwa danych (node:sqlite + repozytoria)
    auth/              sesje pary i gościa, hasła
    themes.ts          rejestr motywów graficznych strony wesela
    tablePlannerLocalStore.ts   autosave planera stołów w IndexedDB
  components/          drobne komponenty współdzielone (w tym TablePlanner)
scripts/
  smoke.mjs            test end-to-end szkieletu (patrz wyżej)
  smoke-tables.mjs     test end-to-end planera stołów (patrz wyżej)
```
