import { ROUTES } from "@/lib/constants/routes";
import {
  isEventCategory,
  type EventCategory,
  type OccasionTypeId,
} from "@/lib/events/categories";
import { buildTemplateBrowseQuery } from "@/lib/templates/browse";
import type { GeneratedInvitationLinks } from "@/lib/invitations/generate-links";
import {
  DEFAULT_SELECTED_TEMPLATE_FORM,
  parseSelectedTemplateForm,
  type SelectedTemplateFormState,
} from "@/lib/templates/selected-template-form";

export type { SelectedTemplateFormState };

export type OccasionFlowStep =
  | "category"
  | "occasion"
  | "browse"
  | "preview"
  | "customize"
  | "success";

export type OccasionFlowBrowseState = {
  searchQuery: string;
  activeTab: "ready" | "bespoke";
  choosingTemplateId: string | null;
  focusTemplateId: string | null;
};

export type OccasionFlowState = {
  step: OccasionFlowStep;
  category: EventCategory | null;
  occasion: OccasionTypeId | null;
  templateId: string | null;
  browse: OccasionFlowBrowseState;
  customizeForm: SelectedTemplateFormState;
  generatedLinks: GeneratedInvitationLinks | null;
};

export const OCCASION_FLOW_STORAGE_KEY = "marasim_occasion_flow";

export const DEFAULT_OCCASION_FLOW_BROWSE: OccasionFlowBrowseState = {
  searchQuery: "",
  activeTab: "ready",
  choosingTemplateId: null,
  focusTemplateId: null,
};

export const DEFAULT_OCCASION_FLOW: OccasionFlowState = {
  step: "category",
  category: null,
  occasion: null,
  templateId: null,
  browse: DEFAULT_OCCASION_FLOW_BROWSE,
  customizeForm: DEFAULT_SELECTED_TEMPLATE_FORM,
  generatedLinks: null,
};

const ALL_OCCASION_TYPE_IDS = new Set<string>([
  "reception",
  "dinner_party",
  "wedding",
  "graduation",
  "birthday",
  "family_occasion",
  "engagement",
  "katb_ktab",
  "henna",
  "corporate_event",
  "gala_dinner",
  "formal_dinner",
  "private_celebration",
  "exclusive_wedding",
  "corporate_vip",
  "royal_occasion",
]);

export function isOccasionTypeId(value: string): value is OccasionTypeId {
  return ALL_OCCASION_TYPE_IDS.has(value);
}

function canUseStorage() {
  return typeof window !== "undefined";
}

function parseOccasionFlow(value: unknown): OccasionFlowState | null {
  if (!value || typeof value !== "object") return null;

  const record = value as Partial<OccasionFlowState> & {
    browse?: Partial<OccasionFlowBrowseState>;
    customizeForm?: Partial<SelectedTemplateFormState>;
    generatedLinks?: Partial<GeneratedInvitationLinks> | null;
  };

  const step = record.step;
  if (
    step !== "category" &&
    step !== "occasion" &&
    step !== "browse" &&
    step !== "preview" &&
    step !== "customize" &&
    step !== "success"
  ) {
    return null;
  }

  const category =
    record.category && isEventCategory(record.category) ? record.category : null;
  const occasion =
    record.occasion && isOccasionTypeId(record.occasion) ? record.occasion : null;
  const templateId = typeof record.templateId === "string" ? record.templateId : null;

  const browse: OccasionFlowBrowseState = {
    ...DEFAULT_OCCASION_FLOW_BROWSE,
    ...record.browse,
    activeTab: record.browse?.activeTab === "bespoke" ? "bespoke" : "ready",
    searchQuery:
      typeof record.browse?.searchQuery === "string" ? record.browse.searchQuery : "",
    choosingTemplateId:
      typeof record.browse?.choosingTemplateId === "string"
        ? record.browse.choosingTemplateId
        : null,
    focusTemplateId:
      typeof record.browse?.focusTemplateId === "string" ? record.browse.focusTemplateId : null,
  };

  const generatedLinks = parseGeneratedLinks(record.generatedLinks);

  return {
    step,
    category,
    occasion,
    templateId,
    browse,
    customizeForm: parseSelectedTemplateForm(record.customizeForm),
    generatedLinks,
  };
}

function parseGeneratedLinks(value: unknown): GeneratedInvitationLinks | null {
  if (!value || typeof value !== "object") return null;

  const record = value as Partial<GeneratedInvitationLinks>;
  if (
    typeof record.eventSlug !== "string" ||
    typeof record.guestToken !== "string" ||
    typeof record.receptionistToken !== "string" ||
    typeof record.guestUrl !== "string" ||
    typeof record.receptionistUrl !== "string"
  ) {
    return null;
  }

  return {
    eventSlug: record.eventSlug,
    guestToken: record.guestToken,
    receptionistToken: record.receptionistToken,
    guestUrl: record.guestUrl,
    receptionistUrl: record.receptionistUrl,
  };
}

export function getOccasionFlow(): OccasionFlowState | null {
  if (!canUseStorage()) return null;

  try {
    const raw = sessionStorage.getItem(OCCASION_FLOW_STORAGE_KEY);
    if (!raw) return null;
    return parseOccasionFlow(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function saveOccasionFlow(partial: Partial<OccasionFlowState>): OccasionFlowState {
  const current = getOccasionFlow() ?? DEFAULT_OCCASION_FLOW;
  const next: OccasionFlowState = {
    ...current,
    ...partial,
    browse: {
      ...current.browse,
      ...partial.browse,
    },
    customizeForm: partial.customizeForm
      ? { ...current.customizeForm, ...partial.customizeForm }
      : current.customizeForm,
    generatedLinks:
      partial.generatedLinks !== undefined ? partial.generatedLinks : current.generatedLinks,
  };

  if (canUseStorage()) {
    sessionStorage.setItem(OCCASION_FLOW_STORAGE_KEY, JSON.stringify(next));
  }

  return next;
}

export function clearOccasionFlow() {
  if (!canUseStorage()) return;
  sessionStorage.removeItem(OCCASION_FLOW_STORAGE_KEY);
}

export function resetOccasionFlowAfterSuccess() {
  return saveOccasionFlow({
    step: "category",
    category: null,
    occasion: null,
    templateId: null,
    browse: DEFAULT_OCCASION_FLOW_BROWSE,
    customizeForm: DEFAULT_SELECTED_TEMPLATE_FORM,
    generatedLinks: null,
  });
}

export function isOccasionFlowPath(pathname: string): boolean {
  return (
    pathname === ROUTES.occasions ||
    pathname.startsWith("/occasions/") ||
    pathname.startsWith("/templates")
  );
}

export function getOccasionFlowResumePath(state: OccasionFlowState | null): string {
  if (!state) return ROUTES.occasions;

  if (state.step === "success") {
    return ROUTES.occasions;
  }

  const query = buildTemplateBrowseQuery({
    category: state.category,
    occasion: state.occasion,
  });

  switch (state.step) {
    case "customize":
      if (state.templateId) {
        return `${ROUTES.templates.customize(state.templateId)}${query}`;
      }
      break;
    case "preview":
      if (state.templateId) {
        return `${ROUTES.templates.preview(state.templateId)}${query}`;
      }
      break;
    case "browse":
      return `${ROUTES.templates.browse}${query}`;
    case "occasion":
      if (state.category) {
        return ROUTES.occasionCategory(state.category);
      }
      break;
    case "category":
    default:
      return ROUTES.occasions;
  }

  if (state.category && state.occasion) {
    return `${ROUTES.templates.browse}${query}`;
  }

  if (state.category) {
    return ROUTES.occasionCategory(state.category);
  }

  return ROUTES.occasions;
}

export function startOccasionCategoryFlow(category: EventCategory) {
  return saveOccasionFlow({
    step: "occasion",
    category,
    occasion: null,
    templateId: null,
    browse: DEFAULT_OCCASION_FLOW_BROWSE,
  });
}

export function readOccasionFlowForCategory(category: EventCategory): OccasionTypeId | null {
  const flow = getOccasionFlow();
  if (!flow || flow.category !== category) return null;
  return flow.occasion;
}

export function readOccasionFlowBrowseState(): OccasionFlowBrowseState {
  const flow = getOccasionFlow();
  return flow?.browse ?? DEFAULT_OCCASION_FLOW_BROWSE;
}
