"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

/** Pole wyszukiwania, które aktualizuje URL (parametr `q`) z opóźnieniem
 * (debounce) w trakcie pisania - zamiast czekać na kliknięcie "Szukaj".
 * Zmiana URL-a odświeża wyniki wyrenderowane po stronie serwera (patrz
 * `searchParams.q` w page.tsx), bez przeładowania całej strony. */
export function LiveSearchInput({
  paramName = "q",
  placeholder,
  className,
}: {
  paramName?: string;
  placeholder: string;
  className: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(searchParams.get(paramName) ?? "");
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const next = e.target.value;
    setValue(next);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (next.trim()) params.set(paramName, next);
      else params.delete(paramName);
      params.delete("added");
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    }, 350);
  }

  return (
    <input
      type="text"
      value={value}
      onChange={handleChange}
      placeholder={placeholder}
      className={className}
    />
  );
}
