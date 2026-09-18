// Generuje hash bcrypt do PLATFORM_ADMIN_PASSWORD_HASH (patrz .env.example
// i README, sekcja Płatności) - hasło super-admina NIGDY nie jest
// przechowywane jawnie, ani w bazie (nie ma tam takiej tabeli), ani w
// zmiennych środowiskowych.
//
// Użycie:
//   node scripts/hash-password.mjs "twoje-haslo"

import bcrypt from "bcryptjs";

const plain = process.argv[2];
if (!plain) {
  console.error('Użycie: node scripts/hash-password.mjs "twoje-haslo"');
  process.exit(1);
}

const hash = await bcrypt.hash(plain, 12);
console.log(hash);
