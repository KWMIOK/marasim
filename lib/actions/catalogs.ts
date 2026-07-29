"use server";

import { revalidatePath } from "next/cache";
import { getProfile } from "@/lib/auth/session";
import {
  CATALOG_TABLES,
  type CatalogActionResult,
  type CatalogInputMap,
  type CatalogKind,
} from "@/lib/catalog/tables";
import { createClient } from "@/lib/supabase/server";
import { ROUTES } from "@/lib/constants/routes";

async function requireSuperAdmin() {
  const profile = await getProfile();
  if (!profile || profile.role !== "super_admin") {
    throw new Error("Unauthorized");
  }
  return profile;
}

function revalidateCatalogPaths() {
  revalidatePath(ROUTES.admin.catalog);
  revalidatePath(ROUTES.admin.newEvent);
}

export async function createCatalogItem<K extends CatalogKind>(
  kind: K,
  input: CatalogInputMap[K]
): Promise<CatalogActionResult> {
  try {
    await requireSuperAdmin();
    const supabase = await createClient();
    const table = CATALOG_TABLES[kind];

    const { data, error } = await (supabase.from(table) as ReturnType<typeof supabase.from>)
      .insert(input as never)
      .select("id")
      .single();

    if (error || !data) {
      return { success: false, error: error?.message ?? "Insert failed." };
    }

    revalidateCatalogPaths();
    return { success: true, id: (data as { id: string }).id };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to create item.",
    };
  }
}

export async function updateCatalogItem<K extends CatalogKind>(
  kind: K,
  id: string,
  input: CatalogInputMap[K]
): Promise<CatalogActionResult> {
  try {
    await requireSuperAdmin();
    const supabase = await createClient();
    const table = CATALOG_TABLES[kind];

    const { error } = await (supabase.from(table) as ReturnType<typeof supabase.from>)
      .update(input as never)
      .eq("id", id);

    if (error) return { success: false, error: error.message };

    revalidateCatalogPaths();
    return { success: true, id };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to update item.",
    };
  }
}

export async function deleteCatalogItem(
  kind: CatalogKind,
  id: string
): Promise<CatalogActionResult> {
  try {
    await requireSuperAdmin();
    const supabase = await createClient();
    const table = CATALOG_TABLES[kind];

    const { error } = await (supabase.from(table) as ReturnType<typeof supabase.from>)
      .delete()
      .eq("id", id);

    if (error) return { success: false, error: error.message };

    revalidateCatalogPaths();
    return { success: true, id };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to delete item.",
    };
  }
}

export async function toggleCatalogItemActive(
  kind: CatalogKind,
  id: string,
  isActive: boolean
): Promise<CatalogActionResult> {
  try {
    await requireSuperAdmin();
    const supabase = await createClient();
    const table = CATALOG_TABLES[kind];

    const { error } = await (supabase.from(table) as ReturnType<typeof supabase.from>)
      .update({ is_active: isActive } as never)
      .eq("id", id);

    if (error) return { success: false, error: error.message };

    revalidateCatalogPaths();
    return { success: true, id };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to update status.",
    };
  }
}
