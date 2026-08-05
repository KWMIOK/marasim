"use server";

import { sendAdminAccessRequestEmail } from "@/lib/email/send-admin-access-request";
import { getProfile, getSessionUser } from "@/lib/auth/session";
import { toE164KuwaitMobile } from "@/lib/phone/format-e164";
import { createClient } from "@/lib/supabase/server";

export type RequestAdminAccessResult =
  | { success: true }
  | { success: false; error: string };

export async function requestAdminAccess(input?: {
  phone?: string;
}): Promise<RequestAdminAccessResult> {
  const user = await getSessionUser();
  const profile = user ? await getProfile() : null;

  const phoneFromInput = input?.phone ? toE164KuwaitMobile(input.phone) : null;
  const email = profile?.email ?? user?.email ?? null;
  const phone = profile?.phone ?? user?.phone ?? phoneFromInput;

  if (!user && !email && !phone) {
    return {
      success: false,
      error: "missing_contact",
    };
  }

  if (user && profile) {
    const supabase = await createClient();
    const patch: { email?: string; phone?: string } = {};

    if (user.email && !profile.email) {
      patch.email = user.email;
    }

    if (user.phone && !profile.phone) {
      patch.phone = user.phone;
    }

    if (phoneFromInput && !profile.phone && !user.phone) {
      patch.phone = phoneFromInput;
    }

    if (Object.keys(patch).length > 0) {
      await supabase.from("profiles").update(patch as never).eq("id", user.id);
    }
  }

  const result = await sendAdminAccessRequestEmail({
    userId: user?.id,
    fullName: profile?.full_name ?? user?.user_metadata?.full_name ?? null,
    email: email ?? profile?.email ?? null,
    phone: phone ?? phoneFromInput,
    source: user ? "profile" : "signup",
  });

  if (!result.ok) {
    return { success: false, error: result.error };
  }

  return { success: true };
}
