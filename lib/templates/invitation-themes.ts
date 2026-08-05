export const INVITATION_THEMES = [
  {
    id: "classic-gold",
    primaryColor: "#c9a227",
    secondaryColor: "#1a1a2e",
  },
  {
    id: "champagne-night",
    primaryColor: "#e8d5a3",
    secondaryColor: "#1a1a2e",
  },
  {
    id: "rose-velvet",
    primaryColor: "#8b1e3f",
    secondaryColor: "#1a1a2e",
  },
  {
    id: "midnight-gold",
    primaryColor: "#1a1a2e",
    secondaryColor: "#c9a227",
  },
  {
    id: "ivory-rose",
    primaryColor: "#e8d5a3",
    secondaryColor: "#8b1e3f",
  },
  {
    id: "pure-contrast",
    primaryColor: "#ffffff",
    secondaryColor: "#0a0a0a",
  },
  {
    id: "gold-black",
    primaryColor: "#c9a227",
    secondaryColor: "#0a0a0a",
  },
  {
    id: "blush-light",
    primaryColor: "#8b1e3f",
    secondaryColor: "#e8d5a3",
  },
] as const;

export type InvitationThemeId = (typeof INVITATION_THEMES)[number]["id"];

export type InvitationTheme = (typeof INVITATION_THEMES)[number];

export const DEFAULT_INVITATION_THEME_ID: InvitationThemeId = "classic-gold";

export function getInvitationTheme(id: InvitationThemeId): InvitationTheme {
  return INVITATION_THEMES.find((theme) => theme.id === id) ?? INVITATION_THEMES[0];
}

function normalizeColorHex(value: string): string {
  return value.trim().toLowerCase();
}

export function findInvitationThemeByColors(
  primaryColor: string,
  secondaryColor: string
): InvitationTheme | null {
  const primary = normalizeColorHex(primaryColor);
  const secondary = normalizeColorHex(secondaryColor);

  return (
    INVITATION_THEMES.find(
      (theme) =>
        normalizeColorHex(theme.primaryColor) === primary &&
        normalizeColorHex(theme.secondaryColor) === secondary
    ) ?? null
  );
}

export function resolveInvitationThemeId(input: {
  themeId?: unknown;
  primaryColor?: unknown;
  secondaryColor?: unknown;
}): InvitationThemeId {
  if (typeof input.themeId === "string") {
    const match = INVITATION_THEMES.find((theme) => theme.id === input.themeId);
    if (match) return match.id;
  }

  if (typeof input.primaryColor === "string" && typeof input.secondaryColor === "string") {
    const byColors = findInvitationThemeByColors(input.primaryColor, input.secondaryColor);
    if (byColors) return byColors.id;
  }

  return DEFAULT_INVITATION_THEME_ID;
}

export function invitationThemeColors(themeId: InvitationThemeId): {
  primaryColor: string;
  secondaryColor: string;
} {
  const theme = getInvitationTheme(themeId);
  return {
    primaryColor: theme.primaryColor,
    secondaryColor: theme.secondaryColor,
  };
}
