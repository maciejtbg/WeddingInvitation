import Link from "next/link";
import { loginCoupleAction } from "../actions";

const ERROR_MESSAGES: Record<string, string> = {
  invalid: "Nieprawidłowy email lub hasło.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="flex flex-1 items-center justify-center bg-gradient-to-b from-rose-50 to-white px-6 py-16">
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-8 shadow-lg shadow-rose-100/50">
        <h1 className="mb-8 text-3xl font-semibold text-zinc-900">Zaloguj się</h1>

        {error && (
          <p className="mb-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {ERROR_MESSAGES[error] ?? "Coś poszło nie tak, spróbuj ponownie."}
          </p>
        )}

        <form action={loginCoupleAction} className="space-y-5">
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
              className="w-full rounded-lg border border-zinc-300 px-3.5 py-2.5 text-base text-zinc-900 outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-full bg-zinc-900 px-4 py-3 text-base font-medium text-white transition-colors hover:bg-zinc-700"
          >
            Zaloguj się
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-zinc-600">
          Nie masz jeszcze konta?{" "}
          <Link href="/admin/register" className="font-medium text-zinc-900 underline">
            Załóż je
          </Link>
        </p>
      </div>
    </div>
  );
}
