import { NextRequest, NextResponse } from "next/server";
import { externalOrigin } from "@/lib/externalOrigin";

// Stary prefiks linków ("/w/imie1-imie2") - strony wesela mieszkają teraz
// bezpośrednio pod "/imie1-imie2" (patrz src/app/[slug]/), bez tego "w".
// Ten catch-all zostaje jako stałe przekierowanie, żeby stare zakładki/QR
// kody/wydrukowane zaproszenia z poprzedniego formatu linku nie przestały
// nagle działać.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ rest?: string[] }> }
) {
  const { rest } = await params;
  const path = rest && rest.length > 0 ? `/${rest.join("/")}` : "/";
  return NextResponse.redirect(new URL(path, externalOrigin(request)));
}
