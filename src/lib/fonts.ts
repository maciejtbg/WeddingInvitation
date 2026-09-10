// Rejestruje własne, dołączone do repo fonty (fonts/*.ttf) w fontconfig, żeby
// sharp/librsvg (używane do rasteryzacji zaproszenia w src/lib/inviteCard.ts)
// mogły je znaleźć po nazwie rodziny w atrybucie font-family SVG.
//
// PO CO TO ISTNIEJE: minimalny obraz Dockera (node:22-bookworm-slim), na
// którym działa produkcja, nie ma zainstalowanego ani fontconfig, ani ŻADNYCH
// fontów TrueType - próba narysowania tekstu przez sharp kończyła się
// widocznym dla gościa błędem "Fontconfig error: Cannot load default config
// file" w logach i każdym znakiem renderowanym jako pusty kwadrat (tofu) na
// wygenerowanym obrazku zaproszenia. Rozwiązanie: dołączamy własne pliki
// fontów do repozytorium (fonts/*.ttf - licencje open-source SIL OFL 1.1,
// patrz fonts/OFL.txt) i generujemy dla nich w locie minimalny fonts.conf
// wskazujący WYŁĄCZNIE na ten katalog - nie zależymy w ogóle od tego, co (i
// czy cokolwiek) jest zainstalowane w systemie.
//
// Zweryfikowane empirycznie w kontenerze linux/amd64 node:22-bookworm-slim
// (ten sam obraz, na którym buduje się produkcję - patrz
// deploy/build-linux-bundle.sh) - w tej samej konfiguracji na Windows
// (lokalny dev) sharp używa zupełnie innego mechanizmu doboru fontów i ten
// plik nie ma tam żadnego efektu (ani szkody) - font-family po prostu
// spada na systemowy fallback.

import fs from "node:fs";
import path from "node:path";
import os from "node:os";

const FONTS_DIR = path.join(process.cwd(), "fonts");

let initialized = false;

export function ensureCardFontsRegistered(): void {
  if (initialized) return;
  initialized = true;

  if (!fs.existsSync(FONTS_DIR)) return; // np. test jednostkowy bez repo obok
  if (process.env.FONTCONFIG_FILE) return; // ktoś już to ustawił (np. druga instancja modułu)

  const cacheDir = path.join(os.tmpdir(), "wedding-app-fontconfig-cache");
  fs.mkdirSync(cacheDir, { recursive: true });

  const confPath = path.join(os.tmpdir(), "wedding-app-fonts.conf");
  const xml = `<?xml version="1.0"?>
<!DOCTYPE fontconfig SYSTEM "fonts.dtd">
<fontconfig>
  <dir>${FONTS_DIR}</dir>
  <cachedir>${cacheDir}</cachedir>
</fontconfig>
`;
  fs.writeFileSync(confPath, xml);
  process.env.FONTCONFIG_FILE = confPath;
}

/** Nazwy rodzin fontów dołączonych w fonts/ - do użycia jako font-family w
 * SVG generowanym przez src/lib/inviteCard.ts. Wagi (400/500/600/700) trzeba
 * dobrać do tego, co faktycznie jest w danym pliku TTF (statyczne, nie
 * zmienne fonty - jedna waga na plik), patrz komentarze przy plikach. */
export const CARD_FONTS = {
  displaySerif: "Playfair Display",
  classicSerif: "Cormorant Garamond",
  sans: "Montserrat",
  script: "Great Vibes",
} as const;
