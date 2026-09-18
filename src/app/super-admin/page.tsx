import { redirect } from "next/navigation";
import { getPlatformAdminSession } from "@/lib/auth/platformAdmin";

// Na razie jedyna sekcja panelu operatora to kody rabatowe - ten indeks
// istnieje tylko po to, żeby /super-admin samo w sobie nie było martwym
// adresem, przekierowuje dalej zależnie od tego, czy sesja jest ważna.
export default async function PlatformAdminIndexPage() {
  const session = await getPlatformAdminSession();
  redirect(session ? "/super-admin/discount-codes" : "/super-admin/login");
}
