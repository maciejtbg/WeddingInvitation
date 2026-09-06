// Ewidencja zgód RODO (art. 5 ust. 2 - zasada rozliczalności): administrator
// musi umieć wykazać, KTO, KIEDY i na jaką WERSJĘ polityki prywatności
// wyraził zgodę - sama checkbox w formularzu, bez śladu w bazie, tego nie
// zapewnia. Jeden wiersz = jedna zgoda; subjectId to id pary albo gościa,
// zależnie od subjectType.

import { db, newId } from "./client";
import type { Consent, ConsentSubjectType, SqliteRow } from "./types";

// Jedyny obecnie wymagany typ zgody - zgoda na przetwarzanie danych
// osobowych opisane w polityce prywatności (imię/nazwisko, RSVP, dieta,
// wiadomości czatu, zdjęcia, prośby muzyczne - patrz strona /polityka-prywatnosci).
export const PRIVACY_POLICY_CONSENT = "PRIVACY_POLICY";

// Wersja polityki prywatności, na jaką aktualnie zbieramy zgodę - podbij
// (np. "2026-09-06") i wyczyść/zmigruj rozliczenie, jeśli treść polityki
// się istotnie zmieni, żeby stare zgody nie liczyły się jako ważne na nową treść.
export const CURRENT_POLICY_VERSION = "2026-09-06";

function rowToConsent(row: SqliteRow): Consent {
  return {
    id: row.id as string,
    subjectType: row.subject_type as ConsentSubjectType,
    subjectId: row.subject_id as string,
    consentType: row.consent_type as string,
    policyVersion: row.policy_version as string,
    grantedAt: row.granted_at as string,
  };
}

/** Czy dany podmiot (para/gość) ma już zapisaną zgodę na AKTUALNĄ wersję
 * polityki prywatności - starsza wersja się nie liczy, trzeba poprosić ponownie. */
export function hasCurrentConsent(subjectType: ConsentSubjectType, subjectId: string): boolean {
  const row = db
    .prepare(
      `SELECT 1 FROM consents
       WHERE subject_type = ? AND subject_id = ? AND consent_type = ? AND policy_version = ?
       LIMIT 1`
    )
    .get(subjectType, subjectId, PRIVACY_POLICY_CONSENT, CURRENT_POLICY_VERSION);
  return !!row;
}

export function recordConsent(subjectType: ConsentSubjectType, subjectId: string): Consent {
  const id = newId("consent");
  db.prepare(
    `INSERT INTO consents (id, subject_type, subject_id, consent_type, policy_version)
     VALUES (?, ?, ?, ?, ?)`
  ).run(id, subjectType, subjectId, PRIVACY_POLICY_CONSENT, CURRENT_POLICY_VERSION);
  const row = db.prepare("SELECT * FROM consents WHERE id = ?").get(id);
  return rowToConsent(row as SqliteRow);
}
