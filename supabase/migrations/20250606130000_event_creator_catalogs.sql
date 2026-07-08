-- Marasim — Event creator expansion: ceremony types, catalogs, extended fields

CREATE TYPE public.ceremony_event_type AS ENUM (
  'wedding',
  'katb_ktab',
  'engagement',
  'henna',
  'birthday',
  'graduation'
);

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS event_type public.ceremony_event_type NOT NULL DEFAULT 'wedding',
  ADD COLUMN IF NOT EXISTS groom_name TEXT,
  ADD COLUMN IF NOT EXISTS bride_name TEXT,
  ADD COLUMN IF NOT EXISTS honoree_name TEXT,
  ADD COLUMN IF NOT EXISTS start_datetime TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS end_datetime TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS venue TEXT,
  ADD COLUMN IF NOT EXISTS maps_lat DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS maps_lng DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS custom_message TEXT,
  ADD COLUMN IF NOT EXISTS hero_image_url TEXT;

-- Backfill venue from location_name where missing
UPDATE public.events
SET venue = location_name
WHERE venue IS NULL AND location_name IS NOT NULL;

-- ---------------------------------------------------------------------------
-- Admin-managed invitation catalogs
-- ---------------------------------------------------------------------------
CREATE TABLE public.invitation_animated_templates (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  description   TEXT,
  preview_url   TEXT,
  animation_key TEXT NOT NULL DEFAULT 'fade-rise',
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order    INT NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.invitation_themes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  description     TEXT,
  preview_url     TEXT,
  primary_color   TEXT NOT NULL DEFAULT '#1a1a2e',
  secondary_color TEXT NOT NULL DEFAULT '#e94560',
  background_style TEXT,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order      INT NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.invitation_fonts (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT NOT NULL,
  language     TEXT NOT NULL CHECK (language IN ('ar', 'en', 'both')),
  font_family  TEXT NOT NULL,
  preview_url  TEXT,
  is_active    BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order   INT NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.invitation_font_colors (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  color_hex  TEXT NOT NULL,
  is_active  BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.invitation_animated_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitation_themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitation_fonts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitation_font_colors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read active animated templates"
  ON public.invitation_animated_templates FOR SELECT
  USING (is_active = TRUE OR public.is_super_admin());

CREATE POLICY "Super admin manages animated templates"
  ON public.invitation_animated_templates FOR ALL
  USING (public.is_super_admin());

CREATE POLICY "Public read active themes"
  ON public.invitation_themes FOR SELECT
  USING (is_active = TRUE OR public.is_super_admin());

CREATE POLICY "Super admin manages themes"
  ON public.invitation_themes FOR ALL
  USING (public.is_super_admin());

CREATE POLICY "Public read active fonts"
  ON public.invitation_fonts FOR SELECT
  USING (is_active = TRUE OR public.is_super_admin());

CREATE POLICY "Super admin manages fonts"
  ON public.invitation_fonts FOR ALL
  USING (public.is_super_admin());

CREATE POLICY "Public read active font colors"
  ON public.invitation_font_colors FOR SELECT
  USING (is_active = TRUE OR public.is_super_admin());

CREATE POLICY "Super admin manages font colors"
  ON public.invitation_font_colors FOR ALL
  USING (public.is_super_admin());

-- ---------------------------------------------------------------------------
-- Seed defaults (refine with partners later)
-- ---------------------------------------------------------------------------
INSERT INTO public.invitation_animated_templates (name, description, animation_key, sort_order) VALUES
  ('Elegant Rise', 'Soft fade with upward motion', 'fade-rise', 1),
  ('Golden Shimmer', 'Luxury shimmer entrance', 'shimmer', 2),
  ('Floral Bloom', 'Organic bloom animation', 'bloom', 3),
  ('Classic Slide', 'Clean horizontal slide', 'slide', 4);

INSERT INTO public.invitation_themes (name, description, primary_color, secondary_color, background_style, sort_order) VALUES
  ('Midnight Rose', 'Dark elegant with rose accents', '#1a1a2e', '#e94560', 'gradient-dark', 1),
  ('Desert Gold', 'Warm Arabian gold tones', '#2d2013', '#c9a227', 'gradient-gold', 2),
  ('Pearl White', 'Minimal bright celebration', '#f8f7f4', '#b76e79', 'solid-light', 3),
  ('Royal Emerald', 'Deep green luxury', '#0b3d2e', '#d4af37', 'gradient-emerald', 4);

INSERT INTO public.invitation_fonts (name, language, font_family, sort_order) VALUES
  ('Amiri', 'ar', 'Amiri, serif', 1),
  ('Cairo', 'ar', 'Cairo, sans-serif', 2),
  ('Noto Naskh Arabic', 'ar', 'Noto Naskh Arabic, serif', 3),
  ('Scheherazade', 'ar', 'Scheherazade New, serif', 4),
  ('Playfair Display', 'en', 'Playfair Display, serif', 1),
  ('Cormorant Garamond', 'en', 'Cormorant Garamond, serif', 2),
  ('Montserrat', 'en', 'Montserrat, sans-serif', 3),
  ('Great Vibes', 'en', 'Great Vibes, cursive', 4);

INSERT INTO public.invitation_font_colors (name, color_hex, sort_order) VALUES
  ('Classic Gold', '#c9a227', 1),
  ('Rose Gold', '#b76e79', 2),
  ('Pearl White', '#f8f7f4', 3),
  ('Deep Navy', '#1a1a2e', 4),
  ('Emerald', '#0b6e4f', 5),
  ('Burgundy', '#800020', 6),
  ('Charcoal', '#36454f', 7),
  ('Blush Pink', '#f4c2c2', 8);
