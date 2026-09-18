import Link from "next/link";
import { requirePlatformAdminSessionOrRedirect } from "@/lib/auth/platformAdmin";
import { adminListDiscountCodes, isDiscountCodeActive } from "@/lib/db/discountCodes";
import { logoutPlatformAdminAction } from "../actions";
import { createDiscountCodeAction, deleteDiscountCodeAction } from "./actions";

function formatDiscount(type: string, value: number): string {
  return type === "PERCENT" ? `-${value}%` : `-${value.toFixed(2)} zł`;
}

export default async function DiscountCodesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; created?: string }>;
}) {
  await requirePlatformAdminSessionOrRedirect();
  const { error, created } = await searchParams;

  const codes = adminListDiscountCodes();

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-zinc-900">Kody rabatowe</h1>
        <form action={logoutPlatformAdminAction}>
          <button type="submit" className="text-sm text-zinc-500 underline">
            Wyloguj się
          </button>
        </form>
      </div>

      <p className="mb-6 text-sm text-zinc-500">
        Kod obniża cenę jednego pakietu dodatkowych zdjęć (patrz{" "}
        <code className="rounded bg-zinc-100 px-1 py-0.5 text-xs">src/lib/photoPack.ts</code>) - para
        wpisuje go przy zakupie w swojej Galerii. Rabat 100% (procentowy) daje pakiet całkowicie za
        darmo, bez żadnej płatności kartą.
      </p>

      {created === "1" && (
        <p className="mb-6 rounded-md bg-green-50 px-4 py-3 text-sm text-green-800">
          Kod utworzony.
        </p>
      )}
      {error && (
        <p className="mb-6 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      )}

      <div className="mb-8 rounded-lg border border-zinc-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-medium text-zinc-900">Nowy kod</h2>
        <form action={createDiscountCodeAction} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700">
                Kod (puste = wygeneruj losowy)
              </label>
              <input
                name="code"
                placeholder="np. LATO2026"
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm uppercase"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700">Typ rabatu</label>
              <select
                name="discountType"
                defaultValue="PERCENT"
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
              >
                <option value="PERCENT">Procentowy (np. -20%)</option>
                <option value="FIXED">Kwotowy (złotówki od ceny pakietu)</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700">
                Wartość (% albo zł - ustaw 100 przy procentowym dla darmowego pakietu)
              </label>
              <input
                name="discountValue"
                type="number"
                step="0.01"
                min="0.01"
                required
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700">
                Limit użyć (puste = bez limitu)
              </label>
              <input
                name="maxUses"
                type="number"
                min="1"
                step="1"
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700">
                Ważny od (opcjonalnie)
              </label>
              <input
                name="validFrom"
                type="date"
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700">
                Ważny do (opcjonalnie)
              </label>
              <input
                name="validUntil"
                type="date"
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
              />
            </div>
          </div>
          <button
            type="submit"
            className="rounded-full bg-zinc-900 px-5 py-2 text-sm font-medium text-white hover:bg-zinc-700"
          >
            Utwórz kod
          </button>
        </form>
      </div>

      {codes.length === 0 ? (
        <p className="text-sm text-zinc-500">Nie ma jeszcze żadnego kodu rabatowego.</p>
      ) : (
        <div className="space-y-2">
          {codes.map((code) => {
            const active = isDiscountCodeActive(code);
            return (
              <div
                key={code.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-zinc-200 bg-white p-4"
              >
                <div>
                  <p className="font-mono text-base font-semibold text-zinc-900">{code.code}</p>
                  <p className="text-sm text-zinc-500">
                    {[
                      formatDiscount(code.discountType, code.discountValue),
                      `użyto ${code.usedCount}${code.maxUses !== null ? ` / ${code.maxUses}` : " (bez limitu)"}`,
                      code.validFrom || code.validUntil
                        ? `ważny ${code.validFrom ? `od ${code.validFrom.slice(0, 10)} ` : ""}${
                            code.validUntil ? `do ${code.validUntil.slice(0, 10)}` : ""
                          }`
                        : "bez ograniczenia czasowego",
                    ].join(" · ")}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      active ? "bg-green-100 text-green-800" : "bg-zinc-100 text-zinc-500"
                    }`}
                  >
                    {active ? "Aktywny" : "Nieaktywny"}
                  </span>
                  <form action={deleteDiscountCodeAction}>
                    <input type="hidden" name="id" value={code.id} />
                    <button className="rounded-full border border-red-200 px-3 py-1 text-xs font-medium text-red-600 hover:border-red-400">
                      Usuń
                    </button>
                  </form>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <p className="mt-8 text-center text-xs text-zinc-400">
        <Link href="/" className="underline">
          Wróć do strony głównej
        </Link>
      </p>
    </div>
  );
}
