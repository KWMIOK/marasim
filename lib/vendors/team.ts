export type VendorTeamSummary = {
  id: string;
  teamName: string;
  vendorType: string;
  leadPhone: string;
  allowedHeadcount: number;
  checkedInCount: number;
  masterToken: string;
  createdAt: string;
};

export type VendorMasterPass = {
  teamName: string;
  vendorType: string;
  allowedHeadcount: number;
  checkedInCount: number;
  masterToken: string;
  eventDisplayName: string;
  eventDate: string | null;
};

export type VendorTeamForScan = {
  id: string;
  receptionToken: string;
  teamName: string;
  vendorType: string;
  allowedHeadcount: number;
  checkedInCount: number;
  masterToken: string;
};

function parseVendorTeamSummary(value: unknown): VendorTeamSummary | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  if (
    typeof record.id !== "string" ||
    typeof record.team_name !== "string" ||
    typeof record.vendor_type !== "string" ||
    typeof record.lead_phone !== "string" ||
    typeof record.master_token !== "string"
  ) {
    return null;
  }

  return {
    id: record.id,
    teamName: record.team_name,
    vendorType: record.vendor_type,
    leadPhone: record.lead_phone,
    allowedHeadcount:
      typeof record.allowed_headcount === "number" ? record.allowed_headcount : 0,
    checkedInCount:
      typeof record.checked_in_count === "number" ? record.checked_in_count : 0,
    masterToken: record.master_token,
    createdAt: typeof record.created_at === "string" ? record.created_at : "",
  };
}

export function parseVendorTeamSummaries(value: unknown): VendorTeamSummary[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => parseVendorTeamSummary(item))
    .filter((item): item is VendorTeamSummary => item !== null);
}

export function parseVendorMasterPass(value: unknown): VendorMasterPass | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  if (typeof record.team_name !== "string" || typeof record.master_token !== "string") {
    return null;
  }

  return {
    teamName: record.team_name,
    vendorType: typeof record.vendor_type === "string" ? record.vendor_type : "other",
    allowedHeadcount:
      typeof record.allowed_headcount === "number" ? record.allowed_headcount : 0,
    checkedInCount:
      typeof record.checked_in_count === "number" ? record.checked_in_count : 0,
    masterToken: record.master_token,
    eventDisplayName:
      typeof record.event_display_name === "string" ? record.event_display_name : "",
    eventDate: typeof record.event_date === "string" ? record.event_date : null,
  };
}

export function parseVendorTeamForScan(value: unknown): VendorTeamForScan | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  if (
    typeof record.id !== "string" ||
    typeof record.reception_token !== "string" ||
    typeof record.team_name !== "string" ||
    typeof record.master_token !== "string"
  ) {
    return null;
  }

  return {
    id: record.id,
    receptionToken: record.reception_token,
    teamName: record.team_name,
    vendorType: typeof record.vendor_type === "string" ? record.vendor_type : "other",
    allowedHeadcount:
      typeof record.allowed_headcount === "number" ? record.allowed_headcount : 0,
    checkedInCount:
      typeof record.checked_in_count === "number" ? record.checked_in_count : 0,
    masterToken: record.master_token,
  };
}

export function buildVendorPassUrl(masterToken: string, origin: string) {
  return `${origin}/vendor-pass/${masterToken}`;
}

export function buildVendorWhatsAppLink(phone: string, message: string) {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return null;
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}
