# Wedding App - strony ślubne z RSVP

Szkielet aplikacji: konto pary młodej, strona-zaproszenie z unikalnym adresem,
lista gości, prywatne linki dla każdego gościa, RSVP i czat gość-para.
Kontekst biznesowy (analiza konkurencji, hosting, wybór funkcji) jest
opisany osobno, w rozmowie, w której powstał ten projekt.

## Status

To jest szkielet, nie gotowy produkt. Działa i jest przetestowane end-to-end
(patrz `npm run smoke` niżej), ale brakuje jeszcze m.in.:

- planera stołów (schemat bazy już jest - tabele `tables_` i `seat_assignments`,
  patrz `prisma/`... a właściwie `src/lib/db/client.ts`, bo nie ma tu Prisma,
  patrz sekcja "Dlaczego nie Prisma" niżej),
- logowania Google/Facebook dla gości (wymaga założenia aplikacji OAuth
  u dostawcy - patrz sekcja "Logowanie Google" niżej),
- galerii zdjęć od gości,
- panelu do zarządzania czatami ze wszystkimi gośćmi naraz (na razie jest
  wejście z listy gości, jeden na jednego).

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
    w/[slug]/          publiczna strona wesela + /moje-zaproszenie dla gościa
    z/[token]/         wejście gościa przez unikalny link -> sesja
  lib/
    db/                warstwa danych (node:sqlite + repozytoria)
    auth/              sesje pary i gościa, hasła
  components/          drobne komponenty współdzielone
scripts/
  smoke.mjs            test end-to-end (patrz wyżej)
```
