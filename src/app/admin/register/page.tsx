import Link from "next/link";
import { registerCoupleAction } from "../actions";

const ERROR_MESSAGES: Record<string, string> = {
  missing: "Uzupełnijcie wszystkie pola.",
  "weak-password": "Hasło musi mieć co najmniej 8 znaków.",
  exists: "Konto z tym adresem email już istnieje.",
  consent: "Musicie zaakceptować politykę prywatności, żeby założyć konto.",
};

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="flex flex-1 items-center justify-center bg-gradient-to-b from-rose-50 to-white px-6 py-16">
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-8 shadow-lg shadow-rose-100/50">
        <h1 className="mb-2 text-3xl font-semibold text-zinc-900">Załóżcie konto</h1>
        <p className="mb-8 text-base text-zinc-600">
          Jedno konto na parę - stąd będziecie zarządzać stroną i gośćmi.
        </p>

        {error && (
          <p className="mb-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {ERROR_MESSAGES[error] ?? "Coś poszło nie tak, spróbuj ponownie."}
          </p>
        )}

        <form action={registerCoupleAction} className="space-y-5">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-800">
                Imię pierwszej osoby
              </label>
              <input
                type="text"
                name="partner1Name"
                required
                className="w-full rounded-lg border border-zinc-300 px-3.5 py-2.5 text-base text-zinc-900 outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-zinc-800">
                Imię drugiej osoby
              </label>
              <input
                type="text"
                name="partner2Name"
                required
                className="w-full rounded-lg border border-zinc-300 px-3.5 py-2.5 text-base text-zinc-900 outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
              />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-800">Email</label>
            <input
              type="email"
              name="email"
              required
              className="w-full rounded-lg border border-zinc-300 px-3.5 py-2.5 text-base text-zinc-900 outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-800">Hasło</label>
            <input
              type="password"
              name="password"
              required
              minLength={8}
              className="w-full rounded-lg border border-zinc-300 px-3.5 py-2.5 text-base text-zinc-900 outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
            />
            <p className="mt-1.5 text-sm text-zinc-500">Minimum 8 znaków.</p>
          </div>
          <label className="flex cursor-pointer gap-2 text-sm text-zinc-600">
            <input type="checkbox" name="privacyConsent" className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              Jako administrator danych osobowych Waszych gości akceptuję{" "}
              <Link href="/polityka-prywatnosci" target="_blank" className="underline">
                politykę prywatności
              </Link>{" "}
              i zobowiązuję się przetwarzać dane gości zgodnie z RODO.
            </span>
          </label>
          <button
            type="submit"
            className="w-full rounded-full bg-zinc-900 px-4 py-3 text-base font-medium text-white transition-colors hover:bg-zinc-700"
          >
            Załóż konto
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-zinc-600">
          Masz już konto?{" "}
          <Link href="/admin/login" className="font-medium text-zinc-900 underline">
            Zaloguj się
          </Link>
        </p>
      </div>
    </div>
  );
}
