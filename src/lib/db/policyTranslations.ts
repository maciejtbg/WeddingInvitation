// Cache przetłumaczonej polityki prywatności - patrz
// src/lib/i18n/translatePolicyContent.ts i src/lib/db/client.ts.

import { db } from "./client";
import type { PolicySection } from "@/lib/privacyPolicyContent";

export function getCachedPolicy(locale: string): PolicySection[] | null {
  const row = db
    .prepare("SELECT sections_json FROM policy_translation_cache WHERE locale = ?")
    .get(locale) as { sections_json: string } | undefined;
  if (!row) return null;
  try {
    return JSON.parse(row.sections_json) as PolicySection[];
  } catch {
    return null;
  }
}

export function saveCachedPolicy(locale: string, sections: PolicySection[]): void {
  db.prepare(
    `INSERT INTO policy_translation_cache (locale, sections_json)
     VALUES (?, ?)
     ON CONFLICT (locale) DO UPDATE SET sections_json = excluded.sections_json`
  ).run(locale, JSON.stringify(sections));
}
