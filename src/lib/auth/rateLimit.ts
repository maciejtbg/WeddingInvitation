// RODO art. 32 - "bezpieczeństwo przetwarzania" obejmuje też ochronę przed
// prostym zgadywaniem haseł (brute-force), nie tylko szyfrowanie/backupy.
// Prosty licznik w pamięci procesu - wystarczający dla tej skali (jeden
// proces Node na hosting, patrz komentarz w src/lib/db/client.ts o tym
// samym założeniu przy bazie) - nie przeżyje restartu serwera, ale to
// akceptowalne: atak trwający dłużej niż jeden restart i tak jest rzadkością
// warta osobnego rozwiązania (np. fail2ban na hostingu), nie tego kodu.

interface Bucket {
  failures: number;
  windowStart: number;
}

const buckets = new Map<string, Bucket>();

const WINDOW_MS = 15 * 60 * 1000; // 15 minut
const MAX_FAILURES = 10;

/** True, jeśli dla tego klucza (np. "login:email@example.com") przekroczono
 * limit nieudanych prób w bieżącym oknie czasowym - wywołujący powinien
 * odrzucić próbę logowania BEZ sprawdzania hasła (i tak by się nie udało,
 * a to oszczędza sprawdzania hasła pod obciążeniem ataku). */
export function isRateLimited(key: string): boolean {
  const bucket = buckets.get(key);
  if (!bucket) return false;
  if (Date.now() - bucket.windowStart > WINDOW_MS) {
    buckets.delete(key);
    return false;
  }
  return bucket.failures >= MAX_FAILURES;
}

export function recordFailedAttempt(key: string): void {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || now - bucket.windowStart > WINDOW_MS) {
    buckets.set(key, { failures: 1, windowStart: now });
    return;
  }
  bucket.failures += 1;
}

export function clearAttempts(key: string): void {
  buckets.delete(key);
}
