import type { InvitationAnimatedTemplate } from "@/types/events";

export const VIP_ADVANTAGE_KEYS = [
  "concierge",
  "premiumDesigns",
  "receptionSupport",
  "customBranding",
  "guestExperience",
  "whiteGlove",
] as const;

export type VipAdvantageKey = (typeof VIP_ADVANTAGE_KEYS)[number];

export type VipComparisonPairConfig = {
  id: string;
  standardId: string;
  vipId: string;
  highlightKey: `pair${1 | 2}`;
};

export const VIP_COMPARISON_PAIRS: VipComparisonPairConfig[] = [
  {
    id: "classic-vs-golden",
    standardId: "demo-classic-slide",
    vipId: "demo-golden-shimmer",
    highlightKey: "pair1",
  },
  {
    id: "elegant-vs-floral",
    standardId: "demo-elegant-rise",
    vipId: "demo-floral-bloom",
    highlightKey: "pair2",
  },
];

export type ResolvedVipComparisonPair = {
  id: string;
  highlightKey: VipComparisonPairConfig["highlightKey"];
  standard: InvitationAnimatedTemplate;
  vip: InvitationAnimatedTemplate;
};

export function resolveVipComparisonPairs(
  templates: InvitationAnimatedTemplate[]
): ResolvedVipComparisonPair[] {
  const byId = new Map(templates.map((template) => [template.id, template]));

  return VIP_COMPARISON_PAIRS.flatMap((pair) => {
    const standard = byId.get(pair.standardId);
    const vip = byId.get(pair.vipId);
    if (!standard || !vip) return [];

    return [{ id: pair.id, highlightKey: pair.highlightKey, standard, vip }];
  });
}
