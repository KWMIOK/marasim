import Link from "next/link";
import { AppPageShell } from "@/components/shared/app-page-shell";
import { ROUTES } from "@/lib/constants/routes";
import { translate } from "@/lib/i18n";
import { getServerLocale } from "@/lib/i18n/server";

export default async function ReceptionNotFound() {
  const locale = await getServerLocale();

  return (
    <AppPageShell className="min-h-screen pb-10 pt-8">
      <h1 className="text-2xl font-semibold text-gold-light">
        {translate(locale, "reception.notFoundTitle")}
      </h1>
      <p className="mt-3 text-sm text-muted">{translate(locale, "reception.notFoundDescription")}</p>
      <Link
        href={ROUTES.home}
        className="btn-outline-gold mt-8 inline-flex rounded-xl px-4 py-3 text-sm font-medium"
      >
        {translate(locale, "hostSuccess.backHome")}
      </Link>
    </AppPageShell>
  );
}
