export const EVENT_LOGO_ACCEPT = "image/jpeg,image/png,image/webp";

export const EVENT_LOGO_ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

/** Maximum upload size before compression (2 MB). */
export const EVENT_LOGO_MAX_FILE_BYTES = 2 * 1024 * 1024;

/** Minimum width/height in pixels. */
export const EVENT_LOGO_MIN_DIMENSION = 64;

/** Maximum width/height in pixels. */
export const EVENT_LOGO_MAX_DIMENSION = 2048;

/** Longest edge after compression for storage. */
export const EVENT_LOGO_STORE_MAX_DIMENSION = 512;

/** Maximum stored data URL length (~350 KB binary). */
export const EVENT_LOGO_MAX_DATA_URL_LENGTH = 480_000;

export type EventLogoValidationError =
  | "invalid_format"
  | "too_large"
  | "too_small"
  | "dimensions_too_small"
  | "dimensions_too_large"
  | "process_failed";

export type EventLogoValidationResult =
  | { ok: true; width: number; height: number }
  | { ok: false; error: EventLogoValidationError };

function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };

    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("image_load_failed"));
    };

    image.src = url;
  });
}

export async function validateEventLogoFile(file: File): Promise<EventLogoValidationResult> {
  if (!EVENT_LOGO_ALLOWED_MIME_TYPES.has(file.type)) {
    return { ok: false, error: "invalid_format" };
  }

  if (file.size > EVENT_LOGO_MAX_FILE_BYTES) {
    return { ok: false, error: "too_large" };
  }

  if (file.size === 0) {
    return { ok: false, error: "too_small" };
  }

  try {
    const image = await loadImageFromFile(file);
    const width = image.naturalWidth;
    const height = image.naturalHeight;

    if (width < EVENT_LOGO_MIN_DIMENSION || height < EVENT_LOGO_MIN_DIMENSION) {
      return { ok: false, error: "dimensions_too_small" };
    }

    if (width > EVENT_LOGO_MAX_DIMENSION || height > EVENT_LOGO_MAX_DIMENSION) {
      return { ok: false, error: "dimensions_too_large" };
    }

    return { ok: true, width, height };
  } catch {
    return { ok: false, error: "process_failed" };
  }
}

export async function processEventLogoFile(file: File): Promise<
  | { ok: true; dataUrl: string; width: number; height: number }
  | { ok: false; error: EventLogoValidationError }
> {
  const validation = await validateEventLogoFile(file);
  if (!validation.ok) {
    return validation;
  }

  try {
    const image = await loadImageFromFile(file);
    const scale = Math.min(
      1,
      EVENT_LOGO_STORE_MAX_DIMENSION / Math.max(image.naturalWidth, image.naturalHeight)
    );

    const width = Math.max(1, Math.round(image.naturalWidth * scale));
    const height = Math.max(1, Math.round(image.naturalHeight * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");
    if (!context) {
      return { ok: false, error: "process_failed" };
    }

    context.drawImage(image, 0, 0, width, height);

    const dataUrl = canvas.toDataURL("image/jpeg", 0.88);
    if (dataUrl.length > EVENT_LOGO_MAX_DATA_URL_LENGTH) {
      return { ok: false, error: "too_large" };
    }

    return { ok: true, dataUrl, width, height };
  } catch {
    return { ok: false, error: "process_failed" };
  }
}

export function isValidEventLogoDataUrl(value: string | null | undefined): boolean {
  if (!value) return false;
  if (!value.startsWith("data:image/")) return false;
  return value.length <= EVENT_LOGO_MAX_DATA_URL_LENGTH;
}
