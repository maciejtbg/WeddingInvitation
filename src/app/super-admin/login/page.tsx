import { loginPlatformAdminAction } from "../actions";

const ERROR_MESSAGES: Record<string, string> = {
  invalid: "Nieprawidłowy email lub hasło.",
};

export default async function PlatformAdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="flex flex-1 items-center justify-center bg-gradient-to-b from-zinc-100 to-white px-6 py-16">
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-8 shadow-lg shadow-zinc-200/50">
        <h1 className="mb-1 text-3xl font-semibold text-zinc-900">Panel operatora</h1>
        <p className="mb-8 text-sm text-zinc-500">
          Nie panel pary - logowanie do zarządzania kodami rabatowymi.
        </p>

        {error && (
          <p className="mb-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {ERROR_MESSAGES[error] ?? "Coś poszło nie tak, spróbuj ponownie."}
          </p>
        )}

        <form action={loginPlatformAdminAction} className="space-y-5">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-800">Email</label>
            <input
              type="email"
              name="email"
              required
              className="w-full rounded-lg border border-zinc-300 px-3.5 py-2.5 text-base text-zinc-900 outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-100"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-800">Hasło</label>
            <input
              type="password"
              name="password"
              required
              className="w-full rounded-lg border border-zinc-300 px-3.5 py-2.5 text-base text-zinc-900 outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-100"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-full bg-zinc-900 px-4 py-3 text-base font-medium text-white transition-colors hover:bg-zinc-700"
          >
            Zaloguj się
          </button>
        </form>
      </div>
    </div>
  );
}
