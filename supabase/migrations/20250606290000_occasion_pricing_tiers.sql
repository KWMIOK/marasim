-- Guest-count pricing tiers per occasion category (personal, formal, vip)

CREATE TABLE public.occasion_pricing_tiers (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category    TEXT NOT NULL CHECK (category IN ('personal', 'formal', 'vip')),
  guests_from INTEGER NOT NULL CHECK (guests_from >= 0),
  guests_to   INTEGER NOT NULL CHECK (guests_to >= guests_from),
  price_kd    NUMERIC(10, 3) NOT NULL CHECK (price_kd >= 0),
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX occasion_pricing_tiers_category_sort_idx
  ON public.occasion_pricing_tiers (category, sort_order, guests_from);

CREATE TRIGGER occasion_pricing_tiers_set_updated_at
  BEFORE UPDATE ON public.occasion_pricing_tiers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.occasion_pricing_tiers ENABLE ROW LEVEL SECURITY;

CREATE POLICY occasion_pricing_tiers_select_public
  ON public.occasion_pricing_tiers
  FOR SELECT
  USING (true);

CREATE POLICY occasion_pricing_tiers_admin_all
  ON public.occasion_pricing_tiers
  FOR ALL
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

COMMENT ON TABLE public.occasion_pricing_tiers IS
  'Guest-count pricing tiers shown on occasion category cards and managed in admin.';
