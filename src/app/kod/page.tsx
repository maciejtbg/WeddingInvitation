import { loginByShortCodeAction } from "./actions";

// Strona dla gości bez skanera QR / bez cyfrowego dostępu do wiadomości
// z linkiem (np. zaproszenie wręczone osobiście na papierze, starsi
// goście bez aplikacji do skanowania). Celowo duże, proste elementy -
// jedno pole, jeden przycisk, żadnego dodatkowego kroku.

export default async function ShortCodeLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="flex flex-1 items-center justify-center px-6 py-20">
      <div className="w-full max-w-sm text-center">
        <h1 className="mb-2 text-2xl font-semibold text-zinc-900">Wpisz swój kod</h1>
        <p className="mb-8 text-sm text-zinc-500">
          Kod znajdziesz na swoim zaproszeniu, pod kodem QR.
        </p>

        {error && (
          <p className="mb-6 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
            Nie rozpoznajemy tego kodu - sprawdź, czy wpisałeś/aś go dokładnie
            tak, jak na zaproszeniu.
          </p>
        )}

        <form action={loginByShortCodeAction} className="space-y-4">
          <input
            name="code"
            required
            autoFocus
            autoComplete="off"
            autoCapitalize="characters"
            placeholder="XXXX-XXXX"
            maxLength={9}
            className="w-full rounded-lg border border-zinc-300 px-4 py-4 text-center text-2xl font-mono uppercase tracking-widest text-zinc-900"
          />
          <button
            type="submit"
            className="w-full rounded-full bg-zinc-900 px-5 py-3.5 text-base font-medium text-white hover:bg-zinc-700"
          >
            Otwórz moje zaproszenie
          </button>
        </form>
      </div>
    </div>
  );
}
