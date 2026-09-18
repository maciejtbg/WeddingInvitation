"use client";

// Druk/eksport do PDF przez natywne okno drukowania przeglądarki - żadnej
// biblioteki PDF po stronie serwera, para i tak może "Zapisz jako PDF" z
// tego samego okna drukowania. Ukryty przy drukowaniu (print:hidden na tym
// przycisku i na formularzu wyboru sekcji w page.tsx) - w wydruku zostaje
// tylko treść raportu.
export default function ReportPrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="print:hidden rounded-full bg-zinc-900 px-5 py-2 text-sm font-medium text-white hover:bg-zinc-700"
    >
      🖨️ Drukuj / zapisz jako PDF
    </button>
  );
}
