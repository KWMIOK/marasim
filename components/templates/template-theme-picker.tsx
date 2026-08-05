"use client";

import {
  getInvitationTheme,
  type InvitationThemeId,
  INVITATION_THEMES,
} from "@/lib/templates/invitation-themes";
import { useTranslation } from "@/hooks/use-locale";
import { cn } from "@/lib/utils/cn";
import type { TranslationKey } from "@/lib/i18n";

export function TemplateThemePicker({
  value,
  onChange,
}: {
  value: InvitationThemeId;
  onChange: (themeId: InvitationThemeId) => void;
}) {
  const { t } = useTranslation();

  return (
    <div className="sm:col-span-2">
      <p className="mb-3 text-sm font-medium text-gold-light">{t("selectedTemplate.theme")}</p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {INVITATION_THEMES.map((theme) => {
          const selected = theme.id === value;
          const label = t(`selectedTemplate.themes.${theme.id}` as TranslationKey);

          return (
            <button
              key={theme.id}
              type="button"
              aria-pressed={selected}
              onClick={() => onChange(theme.id)}
              className={cn(
                "surface-card rounded-xl p-2 text-start shadow-lg shadow-black/20 transition",
                selected
                  ? "ring-2 ring-gold ring-offset-2 ring-offset-background"
                  : "hover:border-border-gold-strong"
              )}
            >
              <span className="flex h-10 overflow-hidden rounded-lg border border-border-gold">
                <span
                  className="flex-1"
                  style={{ backgroundColor: theme.primaryColor }}
                  aria-hidden
                />
                <span
                  className="flex-1"
                  style={{ backgroundColor: theme.secondaryColor }}
                  aria-hidden
                />
              </span>
              <span className="mt-2 block truncate text-[11px] font-medium text-gold-light sm:text-xs">
                {label}
              </span>
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-xs text-gold-muted">{t("selectedTemplate.themeHint")}</p>
    </div>
  );
}

export function getThemePreviewColors(themeId: InvitationThemeId) {
  const theme = getInvitationTheme(themeId);
  return {
    primaryColor: theme.primaryColor,
    secondaryColor: theme.secondaryColor,
  };
}
