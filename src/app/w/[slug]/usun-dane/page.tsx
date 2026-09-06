// RODO - prawo do usunięcia (art. 17) z poziomu gościa, patrz
// src/lib/db/guests.ts (guestDeleteSelf) i ./actions.ts. Osobna strona
// potwierdzenia zamiast jednego przycisku bez pytania - to nieodwracalna
// operacja, gość musi mieć świadomy moment "na pewno?".

import { redirect, notFound } from "next/navigation";
import { getGuestSession } from "@/lib/auth/guest";
import { findWeddingBySlug } from "@/lib/db/weddings";
import { getTheme, themeStyleVars } from "@/lib/themes";
import { ThemeOrnament } from "@/components/theme-ornaments";
import { getLocale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n/getDictionary";
import { deleteMyDataAction } from "./actions";

export default async function DeleteMyDataPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const wedding = findWeddingBySlug(slug);
  if (!wedding) notFound();

  const session = await getGuestSession();
  if (!session || session.weddingId !== wedding.id) {
    redirect(`/w/${wedding.slug}`);
  }

  const theme = getTheme(wedding.theme);
  const locale = await getLocale();
  const dict = await getDictionary(locale);

  return (
    <div
      className="flex flex-1 items-center justify-center px-6 py-16"
      style={{ ...themeStyleVars(theme), background: theme.colors.background }}
    >
      <div className="w-full max-w-md text-center">
        <ThemeOrnament
          theme={theme.id}
          className="mx-auto mb-6 h-8 w-40"
          style={{ color: theme.colors.accent }}
        />
        <h1 className="mb-4 font-serif text-2xl font-semibold text-[var(--wd-text)]">
          {dict.deleteMyDataTitle}
        </h1>
        <p className="mb-8 text-sm leading-relaxed text-[var(--wd-muted)]">
          {dict.deleteMyDataWarning}
        </p>
        <div className="flex justify-center gap-3">
          <a
            href={`/w/${wedding.slug}/moje-zaproszenie`}
            className="rounded-full border border-[var(--wd-border)] px-5 py-2.5 text-sm font-medium text-[var(--wd-text)] hover:border-[var(--wd-accent)]"
          >
            {dict.deleteMyDataCancel}
          </a>
          <form action={deleteMyDataAction}>
            <input type="hidden" name="slug" value={wedding.slug} />
            <button
              type="submit"
              className="rounded-full bg-red-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-red-700"
            >
              {dict.deleteMyDataConfirmButton}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
