-- Bilingual catalog labels (Arabic + English required for user-facing text)

ALTER TABLE public.invitation_animated_templates
  ADD COLUMN IF NOT EXISTS name_ar TEXT,
  ADD COLUMN IF NOT EXISTS name_en TEXT,
  ADD COLUMN IF NOT EXISTS description_ar TEXT,
  ADD COLUMN IF NOT EXISTS description_en TEXT;

UPDATE public.invitation_animated_templates
SET
  name_en = COALESCE(name_en, name),
  name_ar = COALESCE(name_ar, name),
  description_en = COALESCE(description_en, description, ''),
  description_ar = COALESCE(description_ar, description, '')
WHERE name_ar IS NULL OR name_en IS NULL;

ALTER TABLE public.invitation_animated_templates
  ALTER COLUMN name_ar SET NOT NULL,
  ALTER COLUMN name_en SET NOT NULL,
  ALTER COLUMN description_ar SET NOT NULL,
  ALTER COLUMN description_en SET NOT NULL;

ALTER TABLE public.invitation_animated_templates
  DROP COLUMN IF EXISTS name,
  DROP COLUMN IF EXISTS description;

ALTER TABLE public.invitation_themes
  ADD COLUMN IF NOT EXISTS name_ar TEXT,
  ADD COLUMN IF NOT EXISTS name_en TEXT,
  ADD COLUMN IF NOT EXISTS description_ar TEXT,
  ADD COLUMN IF NOT EXISTS description_en TEXT;

UPDATE public.invitation_themes
SET
  name_en = COALESCE(name_en, name),
  name_ar = COALESCE(name_ar, name),
  description_en = COALESCE(description_en, description, ''),
  description_ar = COALESCE(description_ar, description, '')
WHERE name_ar IS NULL OR name_en IS NULL;

ALTER TABLE public.invitation_themes
  ALTER COLUMN name_ar SET NOT NULL,
  ALTER COLUMN name_en SET NOT NULL,
  ALTER COLUMN description_ar SET NOT NULL,
  ALTER COLUMN description_en SET NOT NULL;

ALTER TABLE public.invitation_themes
  DROP COLUMN IF EXISTS name,
  DROP COLUMN IF EXISTS description;

ALTER TABLE public.invitation_fonts
  ADD COLUMN IF NOT EXISTS name_ar TEXT,
  ADD COLUMN IF NOT EXISTS name_en TEXT;

UPDATE public.invitation_fonts
SET
  name_en = COALESCE(name_en, name),
  name_ar = COALESCE(name_ar, name)
WHERE name_ar IS NULL OR name_en IS NULL;

ALTER TABLE public.invitation_fonts
  ALTER COLUMN name_ar SET NOT NULL,
  ALTER COLUMN name_en SET NOT NULL;

ALTER TABLE public.invitation_fonts
  DROP COLUMN IF EXISTS name;

ALTER TABLE public.invitation_font_colors
  ADD COLUMN IF NOT EXISTS name_ar TEXT,
  ADD COLUMN IF NOT EXISTS name_en TEXT;

UPDATE public.invitation_font_colors
SET
  name_en = COALESCE(name_en, name),
  name_ar = COALESCE(name_ar, name)
WHERE name_ar IS NULL OR name_en IS NULL;

ALTER TABLE public.invitation_font_colors
  ALTER COLUMN name_ar SET NOT NULL,
  ALTER COLUMN name_en SET NOT NULL;

ALTER TABLE public.invitation_font_colors
  DROP COLUMN IF EXISTS name;

COMMENT ON COLUMN public.invitation_animated_templates.name_ar IS 'Admin-provided Arabic display name.';
COMMENT ON COLUMN public.invitation_animated_templates.name_en IS 'Admin-provided English display name.';
