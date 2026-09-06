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
    <div className="flex flex-1 items-center justify-center bg-zinc-50 px-6 py-16">
      <div className="w-full max-w-sm">
        <h1 className="mb-2 text-2xl font-semibold text-zinc-900">Załóżcie konto</h1>
        <p className="mb-6 text-sm text-zinc-500">
          Jedno konto na parę - stąd będziecie zarządzać stroną i gośćmi.
        </p>

        {error && (
          <p className="mb-4 rounded-md bg-red-50 px-4 py-2 text-sm text-red-700">
            {ERROR_MESSAGES[error] ?? "Coś poszło nie tak, spróbuj ponownie."}
          </p>
        )}

        <form action={registerCoupleAction} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700">
                Imię pierwszej osoby
              </label>
              <input
                type="text"
                name="partner1Name"
                required
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700">
                Imię drugiej osoby
              </label>
              <input
                type="text"
                name="partner2Name"
                required
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700">Email</label>
            <input
              type="email"
              name="email"
              required
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700">Hasło</label>
            <input
              type="password"
              name="password"
              required
              minLength={8}
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
            />
            <p className="mt-1 text-xs text-zinc-400">Minimum 8 znaków.</p>
          </div>
          <label className="flex cursor-pointer gap-2 text-xs text-zinc-600">
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
            className="w-full rounded-full bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-700"
          >
            Załóż konto
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-500">
          Masz już konto?{" "}
          <Link href="/admin/login" className="font-medium text-zinc-900 underline">
            Zaloguj się
          </Link>
        </p>
      </div>
    </div>
  );
}
