import Link from "next/link";
import { ROUTES } from "@/lib/constants/routes";

export function ReceptionBackLink({
  receptionToken,
  label,
  href,
}: {
  receptionToken: string;
  label: string;
  href?: string;
}) {
  return (
    <Link
      href={href ?? ROUTES.reception(receptionToken)}
      className="mb-6 inline-flex items-center gap-2 text-sm text-gold transition hover:text-gold-light"
    >
      <span aria-hidden="true">←</span>
      {label}
    </Link>
  );
}
