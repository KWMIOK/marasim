import type { User } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export async function syncProfileFromOAuth(
  supabase: SupabaseClient<Database>,
  user: User
) {
  const fullName =
    user.user_metadata?.full_name ??
    user.user_metadata?.name ??
    user.email ??
    null;

  const avatarUrl =
    user.user_metadata?.avatar_url ?? user.user_metadata?.picture ?? null;

  const patch: Record<string, string | null> = {
    full_name: fullName,
    avatar_url: avatarUrl,
  };

  if (user.email) {
    patch.email = user.email;
  }

  if (user.phone) {
    patch.phone = user.phone;
  }

  await supabase
    .from("profiles")
    .update(patch as never)
    .eq("id", user.id);
}

export async function promoteSuperAdminIfAllowed(
  supabase: SupabaseClient<Database>,
  user: User
) {
  const allowlist =
    process.env.SUPER_ADMIN_EMAILS?.split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean) ?? [];

  if (!user.email || !allowlist.includes(user.email.toLowerCase())) {
    return;
  }

  await supabase
    .from("profiles")
    .update({ role: "super_admin" } as never)
    .eq("id", user.id);
}
