import type { ReactNode } from "react";
import type { OccasionTypeId } from "@/lib/events/categories";

function IconBase({ children }: { children: ReactNode }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-10 w-10 text-gold"
      aria-hidden
    >
      {children}
    </svg>
  );
}

const icons: Record<OccasionTypeId, ReactNode> = {
  reception: (
    <IconBase>
      <path d="M10 34V18l14-8 14 8v16" />
      <path d="M10 34h28" />
      <path d="M24 10v24" />
      <circle cx="24" cy="22" r="3" />
    </IconBase>
  ),
  dinner_party: (
    <IconBase>
      <path d="M14 12v26" />
      <path d="M10 12h8" />
      <path d="M12 22h4" />
      <path d="M34 12v26" />
      <path d="M30 12h8" />
      <path d="M32 22h4" />
      <ellipse cx="24" cy="34" rx="10" ry="4" />
    </IconBase>
  ),
  wedding: (
    <IconBase>
      <path d="M24 8c-4 6-12 8-12 16a12 12 0 0 0 24 0c0-8-8-10-12-16z" />
      <circle cx="18" cy="30" r="2" />
      <circle cx="30" cy="30" r="2" />
    </IconBase>
  ),
  graduation: (
    <IconBase>
      <path d="M6 20l18-10 18 10-18 10-18-10z" />
      <path d="M42 22v12" />
      <path d="M18 30v8c0 2 4 4 6 4s6-2 6-4v-8" />
    </IconBase>
  ),
  birthday: (
    <IconBase>
      <rect x="14" y="22" width="20" height="16" rx="2" />
      <path d="M18 22v-4a6 6 0 0 1 12 0v4" />
      <path d="M24 14v-4" />
      <circle cx="24" cy="8" r="2" fill="currentColor" stroke="none" />
    </IconBase>
  ),
  family_occasion: (
    <IconBase>
      <circle cx="18" cy="18" r="4" />
      <circle cx="32" cy="18" r="4" />
      <circle cx="24" cy="12" r="3" />
      <path d="M8 38c0-6 5-10 10-10s10 4 10 10" />
      <path d="M20 38c0-4 2-7 4-7s4 3 4 7" />
    </IconBase>
  ),
  engagement: (
    <IconBase>
      <circle cx="24" cy="28" r="10" />
      <path d="M24 18V8" />
      <path d="M20 12h8" />
      <path d="M24 28l4-6" />
    </IconBase>
  ),
  katb_ktab: (
    <IconBase>
      <rect x="12" y="10" width="24" height="28" rx="2" />
      <path d="M18 18h12" />
      <path d="M18 24h12" />
      <path d="M18 30h8" />
    </IconBase>
  ),
  henna: (
    <IconBase>
      <path d="M24 8c-8 8-14 14-14 22a14 14 0 0 0 28 0c0-8-6-14-14-22z" />
      <path d="M24 20v12" />
      <path d="M20 26h8" />
    </IconBase>
  ),
  corporate_event: (
    <IconBase>
      <rect x="10" y="14" width="28" height="24" rx="2" />
      <path d="M18 14V10h12v4" />
      <path d="M10 24h28" />
      <path d="M22 30h4" />
    </IconBase>
  ),
  gala_dinner: (
    <IconBase>
      <path d="M8 36h32" />
      <path d="M12 36V20l12-8 12 8v16" />
      <path d="M24 12v24" />
      <circle cx="24" cy="26" r="4" />
    </IconBase>
  ),
  formal_dinner: (
    <IconBase>
      <circle cx="24" cy="20" r="8" />
      <path d="M12 38c0-6 5-10 12-10s12 4 12 10" />
      <path d="M24 12V8" />
    </IconBase>
  ),
  private_celebration: (
    <IconBase>
      <path d="M24 6l4 10h10l-8 6 3 10-9-6-9 6 3-10-8-6h10z" />
    </IconBase>
  ),
  exclusive_wedding: (
    <IconBase>
      <path d="M24 6l3 8h8l-6 5 2 8-7-5-7 5 2-8-6-5h8z" />
      <path d="M14 36h20" />
      <path d="M18 36v-6" />
      <path d="M30 36v-6" />
    </IconBase>
  ),
  corporate_vip: (
    <IconBase>
      <rect x="8" y="16" width="32" height="22" rx="2" />
      <path d="M16 16V12h16v4" />
      <path d="M24 24v6" />
      <path d="M20 28h8" />
    </IconBase>
  ),
  royal_occasion: (
    <IconBase>
      <path d="M8 32l4-16 12 8 12-8 4 16H8z" />
      <circle cx="24" cy="14" r="3" />
    </IconBase>
  ),
};

export function OccasionTypeIcon({ type }: { type: OccasionTypeId }) {
  return icons[type];
}
