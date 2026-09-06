# Wdrożenie testowe na VPS (np. mikr.us)

Krok po kroku, żeby uruchomić aplikację na prawdziwym serwerze do testów.
Zakłada zwykły VPS z dostępem root/sudo przez SSH (Ubuntu/Debian) - jeśli
Twój plan mikr.us działa inaczej (np. kontener bez pełnego roota), niektóre
kroki (systemd, ufw) mogą wymagać dostosowania - sprawdź panel/dokumentację
swojego planu.

Obecna architektura (SQLite + zdjęcia na lokalnym dysku, jeden proces Node)
jest zaprojektowana pod DOKŁADNIE taki scenariusz - **nie trzeba czekać** na
migrację do Postgres/Cloudflare R2, żeby to przetestować.

## 0. Czego potrzebujesz, zanim zaczniemy

- [ ] Uruchomiony VPS - adres IP, dostęp SSH (klucz albo hasło).
- [ ] (Zalecane) Domena albo subdomena wskazująca na IP serwera (rekord A) -
      potrzebna do HTTPS. Bez niej da się przetestować po samym IP, ale
      przeglądarki i tak będą krzyczeć o braku HTTPS, a ciasteczka sesji
      działają w trybie mniej bezpiecznym.
- [ ] Zdecyduj, czy repo GitHuba jest publiczne czy prywatne (wpływa na
      krok 3 - jeśli prywatne, serwer potrzebuje własnego dostępu, np. GitHub
      deploy key, ustawionego NA serwerze).

## 1. Podstawy systemu (jednorazowo)

```bash
ssh root@TWOJ-SERWER

apt update && apt upgrade -y
apt install -y curl git nginx ufw

# Node.js 22 (LTS) - node:sqlite wymaga co najmniej tej wersji
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt install -y nodejs
node -v   # sprawdź, że pokazuje v22.x lub nowszy
```

## 2. Użytkownik systemowy

Aplikacja NIE powinna działać jako root - dedykowany użytkownik ogranicza
szkody w razie jakiejkolwiek luki (RODO art. 32 - "bezpieczeństwo
przetwarzania" to też ograniczenie uprawnień procesu, nie tylko szyfrowanie).

```bash
adduser --system --group --home /srv/wedding-app wedding
```

## 3. Kod aplikacji

```bash
su - wedding -s /bin/bash
cd /srv/wedding-app
git clone https://github.com/maciejtbg/WeddingInvitation.git .
git checkout nextjs-app
npm ci --omit=dev
npm run build   # wymaga SESSION_SECRET, patrz krok 4 - albo zbuduj po nim
exit   # z powrotem na roota
```

Jeśli repo jest prywatne, `git clone` powyżej zapyta o dane logowania -
najprościej: wygeneruj GitHub Personal Access Token (albo deploy key) i
użyj go **bezpośrednio na serwerze**, w tej sesji SSH - nie wklejaj go nigdzie
indziej.

## 4. Zmienne środowiskowe

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

## 5. Proces w tle (systemd)

```bash
cp /srv/wedding-app/deploy/wedding-app.service /etc/systemd/system/
systemctl daemon-reload
systemctl enable --now wedding-app
systemctl status wedding-app     # powinno pokazać "active (running)"
journalctl -u wedding-app -f     # logi na żywo, Ctrl+C żeby wyjść
```

## 6. Reverse proxy + HTTPS

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

## 7. Firewall

```bash
ufw allow OpenSSH
ufw allow 80
ufw allow 443
ufw enable
```

## 8. (Opcjonalnie) automatyczne czyszczenie danych po terminie retencji

Tylko jeśli ustawiłeś `RETENTION_PURGE_SECRET` w kroku 4:

```bash
crontab -u wedding -e
```

Dodaj (czyszczenie raz dziennie o 4:00):

```
0 4 * * * RETENTION_PURGE_SECRET=<ten sam co w .env> PURGE_BASE_URL=https://TWOJA-DOMENA node /srv/wedding-app/scripts/purge-expired-data.mjs >> /var/log/wedding-purge.log 2>&1
```

## 9. Weryfikacja

- Wejdź na `https://TWOJA-DOMENA/` (albo `http://IP/`) - powinna wyświetlić
  się strona główna.
- Zarejestruj testowe konto na `/admin/register`, dodaj gościa, otwórz jego
  link zaproszenia w drugiej przeglądarce/oknie prywatnym.
- `systemctl status wedding-app` - "active (running)".
- `journalctl -u wedding-app -n 50` - brak błędów przy starcie.

## Aktualizacja aplikacji po kolejnych zmianach w kodzie

```bash
su - wedding -s /bin/bash
cd /srv/wedding-app
git pull origin nextjs-app
npm ci --omit=dev
npm run build
exit
systemctl restart wedding-app
```

## Kopia zapasowa danych

Wszystko, co trzeba backupować, jest w `/srv/wedding-app/data/` (baza SQLite
`dev.db` + zdjęcia w `uploads/`) - to jedyny katalog z prawdziwymi danymi
gości. Prosty backup:

```bash
tar -czf wedding-backup-$(date +%F).tar.gz -C /srv/wedding-app data
```
