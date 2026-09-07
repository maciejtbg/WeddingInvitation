# Wdrożenie testowe na VPS

Dwie ścieżki, w zależności od tego, co masz:

- **[A. Zwykły VPS z publicznym IPv4](#a-zwykły-vps-z-publicznym-ipv4)** -
  klasyczny scenariusz (DigitalOcean, Hetzner, OVH, część planów mikr.us...).
  Budujesz i uruchamiasz bezpośrednio na serwerze.
- **[B. Mały VPS bez publicznego IPv4 / z mało RAM-u (np. mikr.us)](#b-mały-vps-bez-publicznego-ipv4--z-mało-ram-u-np-mikrus)**
  - to, na czym faktycznie testowaliśmy tę appkę (serwer `lee203`, 1 GB RAM,
  wyłącznie adres IPv6 + kilka udostępnionych portów IPv4). Wymaga innego
  podejścia do builda i do domeny/HTTPS - opisane niżej wraz z tym, co nie
  zadziałało za pierwszym razem i dlaczego.

Obecna architektura (SQLite + zdjęcia na lokalnym dysku, jeden proces Node)
jest zaprojektowana pod DOKŁADNIE taki scenariusz - **nie trzeba czekać** na
migrację do Postgres/Cloudflare R2, żeby to przetestować.

---

## A. Zwykły VPS z publicznym IPv4

### 0. Czego potrzebujesz

- [ ] Uruchomiony VPS - adres IP, dostęp SSH (klucz albo hasło).
- [ ] (Zalecane) Domena wskazująca na IP serwera (rekord A) - potrzebna do
      HTTPS. Bez niej ciasteczka sesji działają w trybie mniej bezpiecznym.
- [ ] Czy repo GitHuba jest publiczne czy prywatne (jeśli prywatne, serwer
      potrzebuje własnego dostępu, np. GitHub deploy key, ustawionego NA
      serwerze).
- [ ] **Co najmniej ~2 GB RAM (albo swap).** `next build` z Turbopackiem w
      tej aplikacji potrafi szczytowo zająć 1,3-1,6 GB RSS. Jeśli masz mniej
      - patrz sekcja B, build i tak trzeba zrobić gdzie indziej.

### 1. Podstawy systemu (jednorazowo)

```bash
ssh root@TWOJ-SERWER

apt update && apt upgrade -y
apt install -y curl git nginx ufw

# Node.js 22 (LTS) - node:sqlite wymaga co najmniej tej wersji
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt install -y nodejs
node -v   # sprawdź, że pokazuje v22.x lub nowszy
```

### 2. Użytkownik systemowy

Aplikacja NIE powinna działać jako root - dedykowany użytkownik ogranicza
szkody w razie jakiejkolwiek luki (RODO art. 32 - "bezpieczeństwo
przetwarzania" to też ograniczenie uprawnień procesu, nie tylko szyfrowanie).

```bash
adduser --system --group --home /srv/wedding-app wedding
```

### 3. Kod aplikacji

```bash
su - wedding -s /bin/bash
cd /srv/wedding-app
git clone https://github.com/maciejtbg/WeddingInvitation.git .
git checkout nextjs-app
npm ci
npm run build   # wymaga SESSION_SECRET, patrz krok 4 - albo zbuduj po nim
exit   # z powrotem na roota
```

Jeśli repo jest prywatne, `git clone` powyżej zapyta o dane logowania -
najprościej: wygeneruj GitHub Personal Access Token (albo deploy key) i
użyj go **bezpośrednio na serwerze**, w tej sesji SSH - nie wklejaj go nigdzie
indziej.

### 4. Zmienne środowiskowe

```bash
su - wedding -s /bin/bash
cd /srv/wedding-app
cp .env.example .env
openssl rand -base64 32   # skopiuj wynik jako SESSION_SECRET w .env
nano .env                 # wklej SESSION_SECRET, ewentualnie RETENTION_PURGE_SECRET
npm run build             # jeśli jeszcze nie zbudowane / po zmianie .env
exit
```

Minimalny wymagany wpis w `.env`:

```
SESSION_SECRET=<wynik openssl rand -base64 32>
```

Opcjonalnie (do automatycznego czyszczenia danych gości po terminie
retencji RODO - patrz README, sekcja "RODO i ochrona danych osobowych"):

```
RETENTION_PURGE_SECRET=<inny losowy ciąg, np. openssl rand -hex 24>
```

Bez `RETENTION_PURGE_SECRET` wszystko działa normalnie - czyszczenie
retencyjne trzeba wtedy odpalać ręcznie, przyciskiem w `/admin/privacy`.

### 5. Proces w tle (systemd)

`deploy/wedding-app.service` zakłada instalację Node.js przez apt/nodesource
(binarka pod `/usr/bin/npm`). Jeśli instalowałeś Node przez `nvm` (tak jak w
sekcji B), podmień ścieżki w `ExecStart`/`Environment` na te z `which node`/
`which npm` w sesji użytkownika `wedding`.

```bash
cp /srv/wedding-app/deploy/wedding-app.service /etc/systemd/system/
systemctl daemon-reload
systemctl enable --now wedding-app
systemctl status wedding-app     # powinno pokazać "active (running)"
journalctl -u wedding-app -f     # logi na żywo, Ctrl+C żeby wyjść
```

### 6. Reverse proxy + HTTPS

```bash
cp /srv/wedding-app/deploy/nginx.conf /etc/nginx/sites-available/wedding-app
nano /etc/nginx/sites-available/wedding-app   # podmień TWOJA-DOMENA na prawdziwą
ln -s /etc/nginx/sites-available/wedding-app /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx

# HTTPS (wymaga, żeby domena już wskazywała na ten serwer - rekord A):
apt install -y certbot python3-certbot-nginx
certbot --nginx -d TWOJA-DOMENA
```

Bez domeny (test po samym IP): pomiń krok z `certbot`, wejdziesz po
`http://IP/` (bez `client_max_body_size` z nginx.conf upload zdjęć >1MB by
nie działał, więc kroki ze skopiowaniem pliku i przeładowaniem nginx warto
i tak wykonać, tylko pomijając certbota).

### 7. Firewall

```bash
ufw allow OpenSSH
ufw allow 80
ufw allow 443
ufw enable
```

### 8. (Opcjonalnie) automatyczne czyszczenie danych po terminie retencji

Tylko jeśli ustawiłeś `RETENTION_PURGE_SECRET` w kroku 4:

```bash
crontab -u wedding -e
```

Dodaj (czyszczenie raz dziennie o 4:00):

```
0 4 * * * RETENTION_PURGE_SECRET=<ten sam co w .env> PURGE_BASE_URL=https://TWOJA-DOMENA node /srv/wedding-app/scripts/purge-expired-data.mjs >> /var/log/wedding-purge.log 2>&1
```

### 9. Weryfikacja i aktualizacje

Patrz wspólne sekcje [Weryfikacja](#weryfikacja) i
[Aktualizacja po zmianach w kodzie](#aktualizacja-po-zmianach-w-kodzie) na
dole tego pliku.

---

## B. Mały VPS bez publicznego IPv4 / z mało RAM-u (np. mikr.us)

Tak faktycznie wdrożyliśmy i przetestowaliśmy aplikację (serwer `lee203`,
plan mikr.us: 1 CPU, 1 GB RAM, kontener LXC, **brak własnego adresu IPv4**
- tylko IPv6 + kilka udostępnionych portów TCP z puli IPv4). Jeśli masz
podobny plan, poniższe kroki są dokładnie tym, co zadziałało - łącznie z
trzema pułapkami, na które trafiliśmy, żebyś nie musiał/a ich odkrywać
od nowa.

### 0. Specyfika takiego VPS-a

- **Brak publicznego IPv4** - masz IPv6 (`ip -6 a s`) oraz zwykle 2-3
  udostępnione porty TCP z puli IPv4 (np. `10203` = SSH, `20203`/`30203` =
  ogólnego przeznaczenia). Patrz `wiki.mikr.us/udostepnione_porty`.
- **Kontener LXC = brak `swapon`** - `fallocate` + `mkswap` + `swapon`
  kończy się `Operation not permitted`. Nie próbuj dodawać swapu, to i tak
  się nie uda.
- **`next build` (Turbopack) potrzebuje więcej RAM-u niż masz** - na 1 GB
  bez swapu `earlyoom` zabija proces buildu w połowie (widać to w
  `journalctl -u earlyoom`, szuka `next-build` po nazwie). Rozwiązanie:
  **buduj GDZIE INDZIEJ, transferuj tylko wynik** (`.next`) - patrz krok 2.
  Mikr.us ma też "Amfetaminę" (panel -> tymczasowy boost RAM-u na 30 minut,
  raz na 6h, `wiki.mikr.us/amfetamina`) - nawet z tym u nas 1,5 GB dalej było
  za mało (build szczytowo chciał >1,5 GB RSS), ale przy mniejszej aplikacji
  może wystarczyć.

### 1. Podstawy + Node.js przez nvm

```bash
ssh root@TWOJA-NAZWA.mikrus.xyz -p TWÓJ-PORT-SSH

adduser --system --group --shell /bin/bash --home /srv/wedding-app wedding
su - wedding -s /bin/bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.5/install.sh | bash
# jeśli install.sh poskarży się na brak ~/.bashrc, dopisz ręcznie:
cat > ~/.bashrc <<'EOF'
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
EOF
export NVM_DIR="$HOME/.nvm"; . "$NVM_DIR/nvm.sh"
nvm install 22
exit   # z powrotem na roota
```

### 2. Kod + zależności (bez builda na serwerze)

```bash
su - wedding -s /bin/bash
cd /srv/wedding-app
git clone https://github.com/maciejtbg/WeddingInvitation.git .
git checkout nextjs-app
export NVM_DIR="$HOME/.nvm"; . "$NVM_DIR/nvm.sh"
npm ci --omit=dev   # tylko zależności RUNTIME - to jedyny npm ci, który robisz NA serwerze
exit
```

`.next` (skompilowana aplikacja) budujemy GDZIE INDZIEJ i wysyłamy gotowe -
patrz [Build lokalny + transfer](#build-lokalny--transfer-deploybuild-linux-bundlesh)
niżej. Zrób to teraz, zanim przejdziesz do kroku 3.

### 3. Zmienne środowiskowe, systemd

Jak w sekcji A, kroki 4-5, z JEDNĄ różnicą: `ExecStart`/`Environment` w
`wedding-app.service` muszą wskazywać na binarkę Node z `nvm`, nie
`/usr/bin/npm`:

```bash
su - wedding -s /bin/bash -c 'export NVM_DIR=$HOME/.nvm; . $NVM_DIR/nvm.sh; which node; which npm'
# np. /srv/wedding-app/.nvm/versions/node/v22.23.2/bin/node
```

Podmień w skopiowanym `wedding-app.service`:

```ini
Environment=PATH=/srv/wedding-app/.nvm/versions/node/vX.Y.Z/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
ExecStart=/srv/wedding-app/.nvm/versions/node/vX.Y.Z/bin/npm run start -- -p 3000 -H 127.0.0.1
```

potem jak zwykle:

```bash
cp deploy/wedding-app.service /etc/systemd/system/
systemctl daemon-reload
systemctl enable --now wedding-app
```

### 4. Domena + HTTPS: darmowa subdomena mikr.us (`wykr.es`)

Bez własnej domeny (albo do czasu, aż ją podepniesz) mikr.us daje darmową,
w pełni działającą subdomenę z automatycznym HTTPS - **zero configu
certyfikatów**. Format: `<serwer-fizyczny>-<port>.wykr.es`, np. dla serwera
`srv73` i portu `20203`: `https://srv73-20203.wykr.es/`. Nazwę fizycznego
serwera znajdziesz w MOTD po zalogowaniu ssh ("Twój VPS jest na serwerze:
srvXX.mikr.us") albo w panelu. Patrz `wiki.mikr.us/darmowa_subdomena_dla_vps`.

nginx nasłuchuje zwykłym HTTP na tym porcie (tunel robi HTTPS za Ciebie):

```bash
apt install -y nginx
cat > /etc/nginx/sites-available/wedding-app <<'EOF'
server {
    listen 20203;
    listen [::]:20203;
    server_name _;

    client_max_body_size 12m;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Host $host;
        # Tunel mikr.us zawsze podaje ruch do gości jako HTTPS, ale sam
        # łączy się z naszym nginx po zwykłym HTTP - $scheme tutaj
        # zawsze wyszedłby jako "http", mimo że gość realnie jest na HTTPS.
        proxy_set_header X-Forwarded-Proto https;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF
rm -f /etc/nginx/sites-enabled/default
ln -sf /etc/nginx/sites-available/wedding-app /etc/nginx/sites-enabled/wedding-app
nginx -t && systemctl reload nginx

ufw allow <TWÓJ-PORT-SSH>/tcp
ufw allow 20203/tcp
ufw --force enable
```

Docelowo (kupiona domena, np. `wedvite.rsvp`): podepnij ją przez CloudFlare -
patrz `wiki.mikr.us/podpiecie_domeny_przez_cloudflare` (rekord AAAA na Twój
adres IPv6, tryb SSL/TLS "Flexible", nginx nasłuchuje wtedy na porcie 80
zamiast 20203).

**Pułapka #1, na którą trafiliśmy:** linki zaproszeń (`/z/[token]`) budowane
były przez `new URL(path, request.url)`, a `request.url` w Node.js za
reverse proxy odzwierciedla adres, pod którym *nasłuchuje* proces (tu
`http://localhost:3000`), nie publiczny adres z przeglądarki gościa -
przekierowanie po zeskanowaniu QR-a prowadziło z powrotem na
`localhost:3000` zamiast na prawdziwą domenę. Naprawione w kodzie
(`src/app/z/[token]/route.ts` czyta `X-Forwarded-Host`/`X-Forwarded-Proto`
zamiast `request.url`) - działa od razu, jeśli używasz `nginx.conf` z tego
repo (ma te nagłówki ustawione).

### 5. Build lokalny + transfer (`deploy/build-linux-bundle.sh`)

Na maszynie z Dockerem (Twój komputer, nie VPS):

```bash
bash deploy/build-linux-bundle.sh
# tworzy /tmp/wedding-app-build.tar.gz

scp -P <PORT-SSH> /tmp/wedding-app-build.tar.gz root@TWOJA-NAZWA.mikrus.xyz:/tmp/

ssh root@TWOJA-NAZWA.mikrus.xyz -p <PORT-SSH> "
  mv /tmp/wedding-app-build.tar.gz /srv/wedding-app/build.tar.gz
  chown wedding:wedding /srv/wedding-app/build.tar.gz
  su - wedding -s /bin/bash -c '
    cd /srv/wedding-app
    rm -rf .next
    tar -xzf build.tar.gz
    rm build.tar.gz
  '
  systemctl restart wedding-app
"
```

**Pułapka #2, na którą trafiliśmy:** budowanie na innej maszynie niż
docelowa działa TYLKO jeśli architektura/libc się zgadzają - stąd
`--platform linux/amd64` + obraz oparty o Debiana (glibc), nie Alpine
(musl), w `build-linux-bundle.sh`. Budowanie bezpośrednio na Windows i
transfer `.next` NIE zadziała - `sharp` ma platformowe binarki
(`@img/sharp-win32-x64` vs `@img/sharp-linux-x64`), a Turbopack zapisuje w
śladzie (`.nft.json`) DOKŁADNIE tę, która była na maszynie budującej.

**Pułapka #3, na którą trafiliśmy:** `.next/node_modules/sharp-<hash>` to
symlink (`-> ../../node_modules/sharp`), którego Turbopack używa w runtime
do doładowania `sharp` - **NIE wykluczaj `.next/node_modules` z paczki**
(`build-linux-bundle.sh` już tego pilnuje). Bez niego serwer wywala
`Cannot find package 'sharp-<hash>'` przy pierwszym uploadzie zdjęcia.

### 6. Weryfikacja i aktualizacje

Patrz sekcje niżej - w kroku "Aktualizacja" pomiń `npm run build` na
serwerze, zamiast tego użyj `build-linux-bundle.sh` jak w kroku 5 powyżej.

---

## Weryfikacja

- Wejdź na `https://TWOJA-DOMENA/` (albo `https://srv73-20203.wykr.es/` w
  wariancie B) - powinna wyświetlić się strona główna.
- Zarejestruj testowe konto na `/admin/register`, dodaj gościa, otwórz jego
  link zaproszenia w drugiej przeglądarce/oknie prywatnym.
- `systemctl status wedding-app` - "active (running)".
- `journalctl -u wedding-app -n 50` - brak błędów przy starcie.
- Najlepiej: puść cały pakiet smoke testów z własnego komputera przeciwko
  żywemu adresowi (patrz README, sekcja "Jak przetestować"):
  `SMOKE_BASE_URL=https://TWOJA-DOMENA npm run smoke` (i pozostałe
  `smoke:*`) - to jedyny sposób, żeby sprawdzić RSVP/czat/zdjęcia/RODO
  end-to-end, nie tylko "strona się ładuje".

## Aktualizacja po zmianach w kodzie

**Wariant A** (build bezpośrednio na serwerze, dość RAM-u):

```bash
su - wedding -s /bin/bash
cd /srv/wedding-app
git pull origin nextjs-app
npm ci
npm run build
exit
systemctl restart wedding-app
```

**Wariant B** (mało RAM-u - build lokalnie, transfer):

```bash
# 1) na serwerze - zaktualizuj kod źródłowy i zależności RUNTIME:
su - wedding -s /bin/bash
cd /srv/wedding-app
git pull origin nextjs-app
npm ci --omit=dev
exit

# 2) na swoim komputerze - zbuduj i wyślij .next (patrz sekcja B, krok 5):
bash deploy/build-linux-bundle.sh
scp -P <PORT-SSH> /tmp/wedding-app-build.tar.gz root@TWOJA-NAZWA.mikrus.xyz:/tmp/
ssh root@TWOJA-NAZWA.mikrus.xyz -p <PORT-SSH> "..."   # jak w kroku 5

# 3) restart:
systemctl restart wedding-app
```

## Kopia zapasowa danych

Wszystko, co trzeba backupować, jest w `/srv/wedding-app/data/` (baza SQLite
`dev.db` + zdjęcia w `uploads/`) - to jedyny katalog z prawdziwymi danymi
gości. Prosty backup:

```bash
tar -czf wedding-backup-$(date +%F).tar.gz -C /srv/wedding-app data
```
