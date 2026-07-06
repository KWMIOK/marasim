import type { ContentSlot, TemplateType } from "@/types/database";

export function defaultContentSlots(template: TemplateType): ContentSlot[] {
  const base: ContentSlot[] = [
    {
      key: "headline",
      type: "text",
      value: "",
      label: "Headline",
      locale: "both",
      order: 0,
    },
    {
      key: "subtitle",
      type: "text",
      value: "",
      label: "Subtitle",
      locale: "both",
      order: 1,
    },
    {
      key: "message",
      type: "text",
      value: "",
      label: "Invitation message",
      locale: "both",
      order: 2,
    },
  ];

  if (template === "vip") {
    return [
      ...base,
      {
        key: "hero_video",
        type: "video",
        value: "",
        label: "Hero video URL (Cloudflare Stream)",
        order: 3,
      },
      {
        key: "background_image",
        type: "image",
        value: "",
        label: "Background image URL",
        order: 4,
      },
    ];
  }

  return [
    ...base,
    {
      key: "hero_image",
      type: "image",
      value: "",
      label: "Hero image URL",
      order: 3,
    },
  ];
}
