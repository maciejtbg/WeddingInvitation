"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Odświeża bieżącą stronę (Server Component) w tle co `intervalMs`, żeby
 * czat pokazywał nowe wiadomości bez ręcznego przeładowania - najprostszy
 * "live" bez WebSocketów/workera w tle (patrz komentarz przy sendMessage
 * w src/lib/db/chat.ts). Nic nie renderuje. */
export function PollingRefresher({ intervalMs = 4000 }: { intervalMs?: number }) {
  const router = useRouter();

  useEffect(() => {
    const id = setInterval(() => router.refresh(), intervalMs);
    return () => clearInterval(id);
  }, [router, intervalMs]);

  return null;
}
