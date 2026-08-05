export type AdminAccessRequestPayload = {
  userId?: string | null;
  fullName?: string | null;
  email?: string | null;
  phone?: string | null;
  source: "signup" | "profile" | "oauth_callback";
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function sendAdminAccessRequestEmail(
  payload: AdminAccessRequestPayload
): Promise<{ ok: true } | { ok: false; error: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.ADMIN_NOTIFICATION_EMAIL?.trim();
  const from = process.env.RESEND_FROM_EMAIL?.trim() ?? "Marasim <onboarding@resend.dev>";

  if (!apiKey || !to) {
    return {
      ok: false,
      error: "Admin notification email is not configured on the server.",
    };
  }

  const contactEmail = payload.email?.trim() || "—";
  const contactPhone = payload.phone?.trim() || "—";
  const userId = payload.userId?.trim() || "Not signed in yet";
  const fullName = payload.fullName?.trim() || "—";
  const sourceLabel =
    payload.source === "oauth_callback"
      ? "After sign-up (OAuth)"
      : payload.source === "signup"
        ? "Sign-up page"
        : "Profile page";

  const subject = `[Marasim] Admin access request — ${contactEmail !== "—" ? contactEmail : contactPhone}`;

  const html = `
    <h2>Admin access request</h2>
    <p>Someone requested super admin access on Marasim.</p>
    <ul>
      <li><strong>Source:</strong> ${escapeHtml(sourceLabel)}</li>
      <li><strong>User ID:</strong> ${escapeHtml(userId)}</li>
      <li><strong>Name:</strong> ${escapeHtml(fullName)}</li>
      <li><strong>Email:</strong> ${escapeHtml(contactEmail)}</li>
      <li><strong>Phone:</strong> ${escapeHtml(contactPhone)}</li>
    </ul>
    <p>To grant access, run in Supabase SQL editor:</p>
    <pre>UPDATE public.profiles SET role = 'super_admin' WHERE id = '${escapeHtml(userId)}';</pre>
    <p>Or match by email / phone if the user ID is not available yet.</p>
  `;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject,
      html,
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    return { ok: false, error: detail || "Failed to send admin access email." };
  }

  return { ok: true };
}
