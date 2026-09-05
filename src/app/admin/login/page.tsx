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
    <div className="flex flex-1 items-center justify-center bg-zinc-50 px-6 py-16">
      <div className="w-full max-w-sm">
        <h1 className="mb-6 text-2xl font-semibold text-zinc-900">Zaloguj się</h1>

        {error && (
          <p className="mb-4 rounded-md bg-red-50 px-4 py-2 text-sm text-red-700">
            {ERROR_MESSAGES[error] ?? "Coś poszło nie tak, spróbuj ponownie."}
          </p>
        )}

        <form action={loginCoupleAction} className="space-y-4">
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
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-full bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-700"
          >
            Zaloguj się
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-500">
          Nie masz jeszcze konta?{" "}
          <Link href="/admin/register" className="font-medium text-zinc-900 underline">
            Załóż je
          </Link>
        </p>
      </div>
    </div>
  );
}
