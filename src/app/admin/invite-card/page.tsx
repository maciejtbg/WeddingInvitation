import Link from "next/link";
import { redirect } from "next/navigation";
import { requireCoupleSessionOrRedirect } from "@/lib/auth/couple";
import { findWeddingById } from "@/lib/db/weddings";
import { INVITE_CARD_VARIANTS, INVITE_CARD_VARIANT_INFO } from "@/lib/inviteCard";
import { setInvitationCardVariantAction } from "../actions";

export default async function InviteCardVariantPage({
  searchParams,
}: {
  searchParams: Promise<{ weddingId?: string; saved?: string }>;
}) {
  const session = await requireCoupleSessionOrRedirect();
  const { weddingId, saved } = await searchParams;

  if (!weddingId) redirect("/admin");
  const wedding = findWeddingById(weddingId);
  if (!wedding || wedding.coupleId !== session.coupleId) redirect("/admin");

  return (
    <div className="mx-auto w-full max-w-4xl px-6 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-zinc-900">Karta zaproszenia (QR)</h1>
        <Link href="/admin" className="text-sm text-zinc-500 underline">
          ← Wróć do panelu
        </Link>
      </div>
      <p className="mb-6 text-sm text-zinc-500">
        Wybierzcie styl karty, którą pobierzecie i wydrukujecie dla każdego gościa z listy (ta
        sama karta, kolory zawsze dopasowane do wybranego motywu strony - {wedding.theme}). Kod QR
        i kod ręczny na podglądzie są przykładowe.
      </p>

      {saved === "1" && (
        <p className="mb-6 rounded-md bg-green-50 px-4 py-3 text-sm text-green-800">
          Zapisano wybrany styl karty.
        </p>
      )}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        {INVITE_CARD_VARIANTS.map((variant) => {
          const info = INVITE_CARD_VARIANT_INFO[variant];
          const isSelected = wedding.invitationCardVariant === variant;
          return (
            <div
              key={variant}
              className={`rounded-lg border-2 p-3 ${
                isSelected ? "border-zinc-900" : "border-zinc-200"
              }`}
            >
              <div className="mb-3 overflow-hidden rounded-md border border-zinc-200 bg-zinc-50">
                {/* eslint-disable-next-line @next/next/no-img-element -- generowany dynamicznie przez własny route, nie zewnętrzny URL */}
                <img
                  src={`/admin/invite-card-preview?weddingId=${wedding.id}&variant=${variant}`}
                  alt={`Podgląd wariantu: ${info.label}`}
                  className="w-full"
                />
              </div>
              <h2 className="mb-1 text-sm font-semibold text-zinc-900">
                {info.label}
                {isSelected && (
                  <span className="ml-2 rounded-full bg-zinc-900 px-2 py-0.5 text-[10px] font-medium text-white">
                    Wybrana
                  </span>
                )}
              </h2>
              <p className="mb-3 text-xs text-zinc-500">{info.description}</p>
              <form action={setInvitationCardVariantAction}>
                <input type="hidden" name="weddingId" value={wedding.id} />
                <input type="hidden" name="variant" value={variant} />
                <button
                  type="submit"
                  disabled={isSelected}
                  className="w-full rounded-full bg-zinc-900 px-4 py-2 text-xs font-medium text-white hover:bg-zinc-700 disabled:cursor-default disabled:bg-zinc-300"
                >
                  {isSelected ? "Aktualnie wybrana" : "Wybierz ten wariant"}
                </button>
              </form>
            </div>
          );
        })}
      </div>

      <p className="mt-8 text-sm text-zinc-500">
        Pobieranie karty konkretnego gościa (z prawdziwym kodem QR) jest na liście gości, przy
        każdym z nich - przycisk &bdquo;Pobierz zaproszenie (QR)&rdquo;.
      </p>
    </div>
  );
}
