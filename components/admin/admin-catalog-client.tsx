"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  createCatalogItem,
  deleteCatalogItem,
  toggleCatalogItemActive,
  updateCatalogItem,
} from "@/lib/actions/catalogs";
import type {
  AnimatedTemplateInput,
  CatalogKind,
  FontColorInput,
  FontInput,
  ThemeInput,
} from "@/lib/catalog/tables";
import { CATALOG_KINDS } from "@/lib/catalog/tables";
import { PageShell } from "@/components/shared/page-shell";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useTranslation } from "@/hooks/use-locale";
import { ROUTES } from "@/lib/constants/routes";
import type {
  EventCatalogs,
  InvitationAnimatedTemplate,
  InvitationFont,
  InvitationFontColor,
  InvitationTheme,
} from "@/types/events";

type CatalogItem =
  | InvitationAnimatedTemplate
  | InvitationTheme
  | InvitationFont
  | InvitationFontColor;

const CATALOG_KEYS: Record<CatalogKind, keyof EventCatalogs> = {
  animated_templates: "animatedTemplates",
  themes: "themes",
  fonts: "fonts",
  font_colors: "fontColors",
};

function emptyForm(kind: CatalogKind, sortOrder: number) {
  switch (kind) {
    case "animated_templates":
      return {
        name: "",
        description: "",
        preview_url: "",
        animation_key: "fade-rise",
        is_active: true,
        sort_order: sortOrder,
      } satisfies AnimatedTemplateInput;
    case "themes":
      return {
        name: "",
        description: "",
        preview_url: "",
        primary_color: "#1a1a2e",
        secondary_color: "#e94560",
        background_style: "",
        is_active: true,
        sort_order: sortOrder,
      } satisfies ThemeInput;
    case "fonts":
      return {
        name: "",
        language: "both" as const,
        font_family: "",
        preview_url: "",
        is_active: true,
        sort_order: sortOrder,
      } satisfies FontInput;
    case "font_colors":
      return {
        name: "",
        color_hex: "#c9a227",
        is_active: true,
        sort_order: sortOrder,
      } satisfies FontColorInput;
  }
}

function itemToForm(kind: CatalogKind, item: CatalogItem) {
  switch (kind) {
    case "animated_templates": {
      const row = item as InvitationAnimatedTemplate;
      return {
        name: row.name,
        description: row.description ?? "",
        preview_url: row.preview_url ?? "",
        animation_key: row.animation_key,
        is_active: row.is_active,
        sort_order: row.sort_order,
      } satisfies AnimatedTemplateInput;
    }
    case "themes": {
      const row = item as InvitationTheme;
      return {
        name: row.name,
        description: row.description ?? "",
        preview_url: row.preview_url ?? "",
        primary_color: row.primary_color,
        secondary_color: row.secondary_color,
        background_style: row.background_style ?? "",
        is_active: row.is_active,
        sort_order: row.sort_order,
      } satisfies ThemeInput;
    }
    case "fonts": {
      const row = item as InvitationFont;
      return {
        name: row.name,
        language: row.language,
        font_family: row.font_family,
        preview_url: row.preview_url ?? "",
        is_active: row.is_active,
        sort_order: row.sort_order,
      } satisfies FontInput;
    }
    case "font_colors": {
      const row = item as InvitationFontColor;
      return {
        name: row.name,
        color_hex: row.color_hex,
        is_active: row.is_active,
        sort_order: row.sort_order,
      } satisfies FontColorInput;
    }
  }
}

function CatalogForm({
  kind,
  form,
  onChange,
  onSubmit,
  onCancel,
  saving,
  isEdit,
}: {
  kind: CatalogKind;
  form: AnimatedTemplateInput | ThemeInput | FontInput | FontColorInput;
  onChange: (next: typeof form) => void;
  onSubmit: () => void;
  onCancel: () => void;
  saving: boolean;
  isEdit: boolean;
}) {
  const { t } = useTranslation();

  return (
    <div className="rounded-xl border border-border-gold bg-transparent p-4">
      <h3 className="text-sm font-semibold text-gold-light">
        {isEdit ? t("catalogAdmin.editItem") : t("catalogAdmin.addItem")}
      </h3>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div>
          <Label>{t("catalogAdmin.name")}</Label>
          <Input
            value={form.name}
            onChange={(e) => onChange({ ...form, name: e.target.value })}
            className="mt-1"
            required
          />
        </div>
        <div>
          <Label>{t("catalogAdmin.sortOrder")}</Label>
          <Input
            type="number"
            value={form.sort_order}
            onChange={(e) =>
              onChange({ ...form, sort_order: Number(e.target.value) || 0 })
            }
            className="mt-1"
          />
        </div>

        {kind === "animated_templates" && (
          <>
            <div className="sm:col-span-2">
              <Label>{t("catalogAdmin.description")}</Label>
              <Textarea
                value={(form as AnimatedTemplateInput).description ?? ""}
                onChange={(e) =>
                  onChange({ ...form, description: e.target.value } as typeof form)
                }
                rows={2}
                className="mt-1"
              />
            </div>
            <div>
              <Label>{t("catalogAdmin.animationKey")}</Label>
              <Input
                value={(form as AnimatedTemplateInput).animation_key}
                onChange={(e) =>
                  onChange({ ...form, animation_key: e.target.value } as typeof form)
                }
                className="mt-1"
              />
            </div>
            <div>
              <Label>{t("catalogAdmin.previewUrl")}</Label>
              <Input
                value={(form as AnimatedTemplateInput).preview_url ?? ""}
                onChange={(e) =>
                  onChange({ ...form, preview_url: e.target.value } as typeof form)
                }
                className="mt-1"
                placeholder="https://"
              />
            </div>
          </>
        )}

        {kind === "themes" && (
          <>
            <div className="sm:col-span-2">
              <Label>{t("catalogAdmin.description")}</Label>
              <Textarea
                value={(form as ThemeInput).description ?? ""}
                onChange={(e) =>
                  onChange({ ...form, description: e.target.value } as typeof form)
                }
                rows={2}
                className="mt-1"
              />
            </div>
            <div>
              <Label>{t("eventForm.primaryColor")}</Label>
              <Input
                type="color"
                value={(form as ThemeInput).primary_color}
                onChange={(e) =>
                  onChange({ ...form, primary_color: e.target.value } as typeof form)
                }
                className="mt-1 h-10"
              />
            </div>
            <div>
              <Label>{t("eventForm.secondaryColor")}</Label>
              <Input
                type="color"
                value={(form as ThemeInput).secondary_color}
                onChange={(e) =>
                  onChange({ ...form, secondary_color: e.target.value } as typeof form)
                }
                className="mt-1 h-10"
              />
            </div>
            <div>
              <Label>{t("catalogAdmin.backgroundStyle")}</Label>
              <Input
                value={(form as ThemeInput).background_style ?? ""}
                onChange={(e) =>
                  onChange({ ...form, background_style: e.target.value } as typeof form)
                }
                className="mt-1"
                placeholder="gradient-dark"
              />
            </div>
            <div>
              <Label>{t("catalogAdmin.previewUrl")}</Label>
              <Input
                value={(form as ThemeInput).preview_url ?? ""}
                onChange={(e) =>
                  onChange({ ...form, preview_url: e.target.value } as typeof form)
                }
                className="mt-1"
              />
            </div>
          </>
        )}

        {kind === "fonts" && (
          <>
            <div>
              <Label>{t("eventForm.locale")}</Label>
              <Select
                value={(form as FontInput).language}
                onChange={(e) =>
                  onChange({
                    ...form,
                    language: e.target.value as FontInput["language"],
                  } as typeof form)
                }
                className="mt-1"
              >
                <option value="ar">{t("eventForm.localeAr")}</option>
                <option value="en">{t("eventForm.localeEn")}</option>
                <option value="both">{t("eventForm.localeBoth")}</option>
              </Select>
            </div>
            <div>
              <Label>{t("catalogAdmin.fontFamily")}</Label>
              <Input
                value={(form as FontInput).font_family}
                onChange={(e) =>
                  onChange({ ...form, font_family: e.target.value } as typeof form)
                }
                className="mt-1"
                placeholder="Cairo, sans-serif"
              />
            </div>
            <div className="sm:col-span-2">
              <Label>{t("catalogAdmin.previewUrl")}</Label>
              <Input
                value={(form as FontInput).preview_url ?? ""}
                onChange={(e) =>
                  onChange({ ...form, preview_url: e.target.value } as typeof form)
                }
                className="mt-1"
              />
            </div>
          </>
        )}

        {kind === "font_colors" && (
          <div>
            <Label>{t("catalogAdmin.colorHex")}</Label>
            <div className="mt-1 flex items-center gap-2">
              <Input
                type="color"
                value={(form as FontColorInput).color_hex}
                onChange={(e) =>
                  onChange({ ...form, color_hex: e.target.value } as typeof form)
                }
                className="h-10 w-16"
              />
              <Input
                value={(form as FontColorInput).color_hex}
                onChange={(e) =>
                  onChange({ ...form, color_hex: e.target.value } as typeof form)
                }
              />
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 sm:col-span-2">
          <input
            id={`active-${kind}`}
            type="checkbox"
            checked={form.is_active}
            onChange={(e) => onChange({ ...form, is_active: e.target.checked })}
            className="rounded border-border-gold"
          />
          <Label htmlFor={`active-${kind}`}>{t("catalogAdmin.active")}</Label>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onSubmit}
          disabled={saving || !form.name.trim()}
          className="rounded-lg btn-gold px-4 py-2 text-sm disabled:opacity-60"
        >
          {saving ? t("catalogAdmin.saving") : t("common.save")}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-border-gold px-4 py-2 text-sm text-foreground hover:surface-card"
        >
          {t("common.cancel")}
        </button>
      </div>
    </div>
  );
}

function CatalogSection({
  kind,
  items,
}: {
  kind: CatalogKind;
  items: CatalogItem[];
}) {
  const router = useRouter();
  const { t } = useTranslation();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<
    AnimatedTemplateInput | ThemeInput | FontInput | FontColorInput
  >(emptyForm(kind, items.length + 1));

  const editingItem = useMemo(
    () => items.find((item) => item.id === editingId),
    [items, editingId]
  );

  function startCreate() {
    setEditingId(null);
    setCreating(true);
    setError(null);
    setForm(emptyForm(kind, items.length + 1));
  }

  function startEdit(item: CatalogItem) {
    setCreating(false);
    setEditingId(item.id);
    setError(null);
    setForm(itemToForm(kind, item));
  }

  function cancelForm() {
    setCreating(false);
    setEditingId(null);
    setError(null);
  }

  async function handleSave() {
    setSaving(true);
    setError(null);

    const payload = {
      ...form,
      description: "description" in form ? form.description?.trim() || undefined : undefined,
      preview_url: "preview_url" in form ? form.preview_url?.trim() || undefined : undefined,
      background_style:
        "background_style" in form ? form.background_style?.trim() || undefined : undefined,
    };

    const result = editingId
      ? await updateCatalogItem(kind, editingId, payload as never)
      : await createCatalogItem(kind, payload as never);

    setSaving(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    cancelForm();
    router.refresh();
  }

  async function handleToggleActive(id: string, isActive: boolean) {
    setError(null);
    const result = await toggleCatalogItemActive(kind, id, isActive);
    if (!result.success) setError(result.error);
    else router.refresh();
  }

  async function handleDelete(id: string, name: string) {
    if (!window.confirm(t("catalogAdmin.deleteConfirm", { name }))) return;
    setError(null);
    const result = await deleteCatalogItem(kind, id);
    if (!result.success) setError(result.error);
    else {
      if (editingId === id) cancelForm();
      router.refresh();
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">{t(`catalogAdmin.${kind}Desc`)}</p>
        <button
          type="button"
          onClick={startCreate}
          className="rounded-lg btn-gold px-4 py-2 text-sm hover:brightness-110"
        >
          {t("catalogAdmin.addItem")}
        </button>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      {(creating || editingItem) && (
        <CatalogForm
          kind={kind}
          form={form}
          onChange={setForm}
          onSubmit={handleSave}
          onCancel={cancelForm}
          saving={saving}
          isEdit={Boolean(editingId)}
        />
      )}

      <div className="overflow-hidden rounded-xl border border-border-gold surface-card">
        <table className="min-w-full text-sm">
          <thead className="bg-transparent text-muted">
            <tr>
              <th className="px-4 py-3 font-medium">{t("catalogAdmin.name")}</th>
              <th className="px-4 py-3 font-medium">{t("catalogAdmin.details")}</th>
              <th className="px-4 py-3 font-medium">{t("catalogAdmin.sortOrder")}</th>
              <th className="px-4 py-3 font-medium">{t("admin.status")}</th>
              <th className="px-4 py-3 font-medium">{t("catalogAdmin.actions")}</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted">
                  {t("catalogAdmin.empty")}
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id} className="border-t border-border-gold/50">
                  <td className="px-4 py-3 font-medium text-gold-light">{item.name}</td>
                  <td className="px-4 py-3 text-muted">
                    {kind === "animated_templates" && (
                      <span>{(item as InvitationAnimatedTemplate).animation_key}</span>
                    )}
                    {kind === "themes" && (
                      <span className="inline-flex items-center gap-2">
                        <span
                          className="inline-block h-4 w-4 rounded-full border"
                          style={{
                            backgroundColor: (item as InvitationTheme).primary_color,
                          }}
                        />
                        <span
                          className="inline-block h-4 w-4 rounded-full border"
                          style={{
                            backgroundColor: (item as InvitationTheme).secondary_color,
                          }}
                        />
                      </span>
                    )}
                    {kind === "fonts" && (
                      <span style={{ fontFamily: (item as InvitationFont).font_family }}>
                        {(item as InvitationFont).font_family} · {(item as InvitationFont).language}
                      </span>
                    )}
                    {kind === "font_colors" && (
                      <span className="inline-flex items-center gap-2">
                        <span
                          className="inline-block h-4 w-4 rounded-full border"
                          style={{ backgroundColor: (item as InvitationFontColor).color_hex }}
                        />
                        {(item as InvitationFontColor).color_hex}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">{item.sort_order}</td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => handleToggleActive(item.id, !item.is_active)}
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        item.is_active
                          ? "bg-green-100 text-green-800"
                          : "bg-surface text-muted"
                      }`}
                    >
                      {item.is_active ? t("catalogAdmin.active") : t("catalogAdmin.inactive")}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => startEdit(item)}
                        className="text-gold hover:text-gold-light"
                      >
                        {t("catalogAdmin.edit")}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(item.id, item.name)}
                        className="text-red-600 hover:text-red-700"
                      >
                        {t("catalogAdmin.delete")}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function AdminCatalogClient({ catalogs }: { catalogs: EventCatalogs }) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<CatalogKind>("animated_templates");

  const tabItems = useMemo(
    () => catalogs[CATALOG_KEYS[activeTab]] as CatalogItem[],
    [catalogs, activeTab]
  );

  return (
    <PageShell>
      <Link href={ROUTES.admin.settings} className="text-sm text-muted hover:text-foreground">
        {t("admin.backToSettings")}
      </Link>
      <h1 className="mt-2 text-2xl font-semibold text-gold-light">{t("admin.catalogTitle")}</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted">{t("catalogAdmin.subtitle")}</p>

      <div className="mt-6 flex flex-wrap gap-2 border-b border-border-gold pb-3">
        {CATALOG_KINDS.map((kind) => (
          <button
            key={kind}
            type="button"
            onClick={() => setActiveTab(kind)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
              activeTab === kind
                ? "bg-gold text-black"
                : "surface-card text-muted ring-1 ring-border-gold hover:bg-transparent"
            }`}
          >
            {t(`catalogAdmin.tabs.${kind}`)}
            <span className="ms-1.5 opacity-70">
              ({catalogs[CATALOG_KEYS[kind]].length})
            </span>
          </button>
        ))}
      </div>

      <div className="mt-6">
        <CatalogSection kind={activeTab} items={tabItems} />
      </div>
    </PageShell>
  );
}
