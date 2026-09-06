# Wedding App - strony ślubne z RSVP

Szkielet aplikacji: konto pary młodej, strona-zaproszenie z unikalnym adresem,
lista gości, prywatne linki dla każdego gościa, RSVP i czat gość-para.
Kontekst biznesowy (analiza konkurencji, hosting, wybór funkcji) jest
opisany osobno, w rozmowie, w której powstał ten projekt.

## Status

To jest szkielet, nie gotowy produkt. Działa i jest przetestowane end-to-end
(patrz `npm run smoke`, `npm run smoke:tables`, `npm run smoke:seating`,
`npm run smoke:invite-card` i `npm run smoke:locations` niżej), ale brakuje
jeszcze m.in.:

- logowania Google/Facebook/telefonem dla gości (OAuth wymaga założenia
  aplikacji u dostawcy, logowanie telefonem - płatnej bramki SMS typu
  Twilio - patrz sekcja "Logowanie Google" niżej),
- galerii zdjęć od gości (Cloudflare R2),
- panelu do zarządzania czatami ze wszystkimi gośćmi naraz (na razie jest
  wejście z listy gości, jeden na jednego),
- wielojęzyczności strony gościa (tłumaczenie w locie),
- wdrożenia na docelowy VPS (mikr.us) razem z przejściem na Postgres.

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

## Jak przetestować (end-to-end)

Jest gotowy skrypt, który przechodzi całą ścieżkę: rejestracja pary, dodanie
gościa, wejście na jego prywatny link, RSVP, czat w obie strony, oraz
sprawdza izolację (gość nie widzi cudzych danych, nie dostaje się do panelu
admina, zgadnięty token nie działa).

```bash
npm run build
npm run start &          # osobny terminal albo w tle
npx playwright install chromium   # tylko raz, pobiera przeglądarkę testową
npm run smoke
npm run smoke:tables     # osobny test end-to-end planera stołów
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
