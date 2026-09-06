// RODO - odpalacz retencji danych (patrz src/lib/dataRetention.ts i
// src/app/api/purge-expired-data/route.ts). Ten skrypt sam NIE dotyka bazy -
// woła działającą aplikację przez HTTP, dokładnie tak jak zrobiłby to cron
// na hostingu (curl), tylko wygodniej się nim posłużyć z poziomu npm.
//
// Uruchomienie (aplikacja musi już działać, patrz npm run start):
//   RETENTION_PURGE_SECRET=... node scripts/purge-expired-data.mjs
//
// Zmienne środowiskowe:
//   RETENTION_PURGE_SECRET - musi być identyczny z tym ustawionym na
//                            serwerze aplikacji (inaczej 401)
//   PURGE_BASE_URL         - adres działającej aplikacji (domyślnie
//                            http://localhost:3000)
//
// Na produkcji (np. mikr.us) dodaj do crontaba coś w stylu:
//   0 4 * * * RETENTION_PURGE_SECRET=xxx PURGE_BASE_URL=https://wasza-domena \
//     node /sciezka/do/aplikacji/scripts/purge-expired-data.mjs >> /var/log/wedding-purge.log 2>&1

const BASE = process.env.PURGE_BASE_URL || "http://localhost:3000";
const SECRET = process.env.RETENTION_PURGE_SECRET;

if (!SECRET) {
  console.error("Brak RETENTION_PURGE_SECRET w środowisku - przerywam.");
  process.exit(1);
}

const response = await fetch(`${BASE}/api/purge-expired-data`, {
  method: "POST",
  headers: { Authorization: `Bearer ${SECRET}` },
});

const body = await response.json();
if (!response.ok) {
  console.error(`Błąd (${response.status}):`, body);
  process.exit(1);
}

console.log(`Wyczyszczono dane gości dla ${body.purged} wesel/i.`);
for (const w of body.weddings) {
  console.log(`  - ${w.slug}: usunięto ${w.guestsDeleted} gości`);
}
