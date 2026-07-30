import { getGuestInitials } from "@/lib/reception/guest";
import { cn } from "@/lib/utils/cn";

export function ReceptionGuestAvatar({
  name,
  avatarUrl,
  size = "lg",
}: {
  name: string;
  avatarUrl: string | null;
  size?: "md" | "lg";
}) {
  const sizeClass = size === "lg" ? "h-24 w-24 text-2xl" : "h-12 w-12 text-sm";

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt=""
        className={cn("rounded-full border border-border-gold object-cover", sizeClass)}
      />
    );
  }

  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-full border border-border-gold bg-surface font-semibold text-gold-light",
        sizeClass
      )}
      aria-hidden
    >
      {getGuestInitials(name)}
    </div>
  );
}
