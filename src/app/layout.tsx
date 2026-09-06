import type { Metadata } from "next";
import "./globals.css";
// Next.js App Router pozwala importować globalny CSS z node_modules
// wyłącznie w głównym layoucie - stąd tutaj, mimo że dotyczy tylko mapy
// (src/components/LocationMapPicker.tsx, LocationsMap.tsx).
import "leaflet/dist/leaflet.css";

// Uwaga: świadomie NIE używamy next/font/google (Geist itd.) - next/font
// pobiera pliki fontów w trakcie builda z fonts.googleapis.com, a to nie
// zawsze jest dostępne (np. w piaskownicy bez tego hosta na białej liście).
// Zamiast tego zwykły stos fontów systemowych - zero zależności sieciowej
// przy budowaniu, i tak działa szybciej u użytkownika (font już ma na dysku).

export const metadata: Metadata = {
  title: "Nasze Wesele - strony ślubne z RSVP",
  description: "Załóż darmową stronę-zaproszenie na swój ślub: RSVP, lista gości, prywatność gości.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pl" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
