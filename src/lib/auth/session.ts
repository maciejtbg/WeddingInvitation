// Wspólny mechanizm podpisywanych ciasteczek sesji (JWT, HS256) - używany
// osobno dla sesji pary (couple.ts) i osobno dla sesji gościa (guest.ts).
// To są dwa całkiem niezależne systemy tożsamości: konto pary nigdy nie
// jest "tym samym" co sesja gościa, nawet jeśli oba mechanizmy dzielą kod.

import { SignJWT, jwtVerify, type JWTPayload } from "jose";

const secretValue = process.env.SESSION_SECRET;

if (!secretValue && process.env.NODE_ENV === "production") {
  throw new Error(
    "Brak SESSION_SECRET w zmiennych środowiskowych - wymagane na produkcji."
  );
}

// W developmencie pozwalamy na wartość domyślną, żeby dało się od razu
// uruchomić projekt bez konfiguracji - ale to NIE jest bezpieczne na produkcji.
const secret = new TextEncoder().encode(
  secretValue || "dev-only-insecure-secret-zmien-mnie"
);

export async function signSession(
  payload: JWTPayload,
  expiresInSeconds: number
): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + expiresInSeconds)
    .sign(secret);
}

export async function verifySession<T extends JWTPayload>(
  token: string
): Promise<T | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as T;
  } catch {
    // token nieważny, wygasły albo sfałszowany - traktujemy jak brak sesji
    return null;
  }
}
