-- Marasim Digital Invitation Platform — Initial Schema
-- Run via Supabase CLI: supabase db push
-- Or paste into Supabase SQL Editor

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
CREATE TYPE public.user_role AS ENUM (
  'super_admin',
  'host',
  'check_in_staff'
);

CREATE TYPE public.template_type AS ENUM (
  'standard',
  'vip'
);

CREATE TYPE public.rsvp_status AS ENUM (
  'not_opened',
  'opened_no_response',
  'confirmed',
  'declined',
  'maybe'
);

CREATE TYPE public.check_in_status AS ENUM (
  'not_checked_in',
  'checked_in'
);

CREATE TYPE public.event_status AS ENUM (
  'draft',
  'published',
  'archived'
);

-- ---------------------------------------------------------------------------
-- Profiles (extends auth.users)
-- ---------------------------------------------------------------------------
CREATE TABLE public.profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  full_name     TEXT,
  phone         TEXT,
  role          public.user_role NOT NULL DEFAULT 'host',
  avatar_url    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.profiles IS 'Application users with role-based access.';

-- ---------------------------------------------------------------------------
-- Events
-- ---------------------------------------------------------------------------
CREATE TABLE public.events (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id           UUID NOT NULL REFERENCES public.profiles (id) ON DELETE RESTRICT,
  title             TEXT NOT NULL,
  slug              TEXT NOT NULL,
  template_type     public.template_type NOT NULL DEFAULT 'standard',
  status            public.event_status NOT NULL DEFAULT 'draft',
  event_date        TIMESTAMPTZ,
  location_name     TEXT,
  maps_url          TEXT,
  countdown_target  TIMESTAMPTZ,
  primary_color     TEXT NOT NULL DEFAULT '#1a1a2e',
  secondary_color   TEXT NOT NULL DEFAULT '#e94560',
  content_slots     JSONB NOT NULL DEFAULT '[]'::JSONB,
  settings          JSONB NOT NULL DEFAULT '{}'::JSONB,
  is_template       BOOLEAN NOT NULL DEFAULT FALSE,
  source_event_id   UUID REFERENCES public.events (id) ON DELETE SET NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT events_slug_unique UNIQUE (slug),
  CONSTRAINT events_content_slots_is_array CHECK (jsonb_typeof(content_slots) = 'array'),
  CONSTRAINT events_settings_is_object CHECK (jsonb_typeof(settings) = 'object')
);

COMMENT ON TABLE public.events IS 'Invitation events. content_slots holds dynamic text/image/video blocks.';
COMMENT ON COLUMN public.events.content_slots IS
  'Array of { key, type: text|image|video, value, label?, locale?: ar|en|both, order? }';
COMMENT ON COLUMN public.events.settings IS
  'Future-ready flags: companion_limits, whatsapp_template, locale_default, etc.';

CREATE INDEX idx_events_host_id ON public.events (host_id);
CREATE INDEX idx_events_slug ON public.events (slug);
CREATE INDEX idx_events_status ON public.events (status);
CREATE INDEX idx_events_event_date ON public.events (event_date);

-- ---------------------------------------------------------------------------
-- Event gates (future multi-gate check-in)
-- ---------------------------------------------------------------------------
CREATE TABLE public.event_gates (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id    UUID NOT NULL REFERENCES public.events (id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order  INT NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT event_gates_event_slug_unique UNIQUE (event_id, slug)
);

CREATE INDEX idx_event_gates_event_id ON public.event_gates (event_id);

-- ---------------------------------------------------------------------------
-- Event staff assignments (check-in staff scoped to events)
-- ---------------------------------------------------------------------------
CREATE TABLE public.event_staff (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id    UUID NOT NULL REFERENCES public.events (id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  gate_id     UUID REFERENCES public.event_gates (id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT event_staff_unique UNIQUE (event_id, user_id)
);

CREATE INDEX idx_event_staff_event_id ON public.event_staff (event_id);
CREATE INDEX idx_event_staff_user_id ON public.event_staff (user_id);

-- ---------------------------------------------------------------------------
-- Guests
-- ---------------------------------------------------------------------------
CREATE TABLE public.guests (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id          UUID NOT NULL REFERENCES public.events (id) ON DELETE CASCADE,
  name              TEXT NOT NULL,
  phone_number      TEXT,
  unique_token      UUID NOT NULL DEFAULT gen_random_uuid(),
  rsvp_status       public.rsvp_status NOT NULL DEFAULT 'not_opened',
  check_in_status   public.check_in_status NOT NULL DEFAULT 'not_checked_in',
  checked_in_at     TIMESTAMPTZ,
  table_number      TEXT,
  is_vip            BOOLEAN NOT NULL DEFAULT FALSE,
  companion_count   INT NOT NULL DEFAULT 0,
  opened_at         TIMESTAMPTZ,
  rsvp_updated_at   TIMESTAMPTZ,
  notes             TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT guests_unique_token_unique UNIQUE (unique_token),
  CONSTRAINT guests_companion_count_non_negative CHECK (companion_count >= 0)
);

COMMENT ON TABLE public.guests IS 'Per-event guest roster with RSVP and check-in state.';

CREATE INDEX idx_guests_event_id ON public.guests (event_id);
CREATE INDEX idx_guests_unique_token ON public.guests (unique_token);
CREATE INDEX idx_guests_rsvp_status ON public.guests (event_id, rsvp_status);
CREATE INDEX idx_guests_check_in_status ON public.guests (event_id, check_in_status);
CREATE UNIQUE INDEX idx_guests_event_phone ON public.guests (event_id, phone_number)
  WHERE phone_number IS NOT NULL;

-- ---------------------------------------------------------------------------
-- Check-in logs (audit trail; supports multi-gate)
-- ---------------------------------------------------------------------------
CREATE TABLE public.check_in_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_id        UUID NOT NULL REFERENCES public.guests (id) ON DELETE CASCADE,
  event_id        UUID NOT NULL REFERENCES public.events (id) ON DELETE CASCADE,
  gate_id         UUID REFERENCES public.event_gates (id) ON DELETE SET NULL,
  checked_in_by   UUID REFERENCES public.profiles (id) ON DELETE SET NULL,
  checked_in_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_duplicate    BOOLEAN NOT NULL DEFAULT FALSE,
  metadata        JSONB NOT NULL DEFAULT '{}'::JSONB
);

CREATE INDEX idx_check_in_logs_guest_id ON public.check_in_logs (guest_id);
CREATE INDEX idx_check_in_logs_event_id ON public.check_in_logs (event_id);
CREATE INDEX idx_check_in_logs_checked_in_at ON public.check_in_logs (checked_in_at);

-- ---------------------------------------------------------------------------
-- Helper: updated_at trigger
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER events_set_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER guests_set_updated_at
  BEFORE UPDATE ON public.guests
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Auto-create profile on auth signup
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email),
    COALESCE(
      (NEW.raw_user_meta_data ->> 'role')::public.user_role,
      'host'::public.user_role
    )
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Guest open tracking (mark invitation as opened)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.mark_guest_opened(p_token UUID)
RETURNS public.guests
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_guest public.guests;
BEGIN
  UPDATE public.guests
  SET
    opened_at = COALESCE(opened_at, NOW()),
    rsvp_status = CASE
      WHEN rsvp_status = 'not_opened' THEN 'opened_no_response'::public.rsvp_status
      ELSE rsvp_status
    END
  WHERE unique_token = p_token
  RETURNING * INTO v_guest;

  RETURN v_guest;
END;
$$;

-- ---------------------------------------------------------------------------
-- Atomic check-in (duplicate prevention)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.check_in_guest(
  p_token UUID,
  p_gate_id UUID DEFAULT NULL,
  p_staff_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_guest public.guests;
  v_is_duplicate BOOLEAN := FALSE;
BEGIN
  SELECT * INTO v_guest
  FROM public.guests
  WHERE unique_token = p_token
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', FALSE, 'error', 'invalid_token');
  END IF;

  IF v_guest.check_in_status = 'checked_in' THEN
    v_is_duplicate := TRUE;

    INSERT INTO public.check_in_logs (guest_id, event_id, gate_id, checked_in_by, is_duplicate)
    VALUES (v_guest.id, v_guest.event_id, p_gate_id, p_staff_id, TRUE);

    RETURN jsonb_build_object(
      'success', FALSE,
      'error', 'already_checked_in',
      'guest', row_to_json(v_guest),
      'is_duplicate', TRUE
    );
  END IF;

  UPDATE public.guests
  SET
    check_in_status = 'checked_in',
    checked_in_at = NOW()
  WHERE id = v_guest.id
  RETURNING * INTO v_guest;

  INSERT INTO public.check_in_logs (guest_id, event_id, gate_id, checked_in_by, is_duplicate)
  VALUES (v_guest.id, v_guest.event_id, p_gate_id, p_staff_id, FALSE);

  RETURN jsonb_build_object(
    'success', TRUE,
    'guest', row_to_json(v_guest),
    'is_duplicate', FALSE
  );
END;
$$;

-- ---------------------------------------------------------------------------
-- Event analytics view
-- ---------------------------------------------------------------------------
CREATE OR REPLACE VIEW public.event_analytics AS
SELECT
  e.id AS event_id,
  COUNT(g.id) AS total_guests,
  COUNT(g.id) FILTER (WHERE g.rsvp_status = 'confirmed') AS confirmed,
  COUNT(g.id) FILTER (WHERE g.rsvp_status = 'declined') AS declined,
  COUNT(g.id) FILTER (WHERE g.rsvp_status = 'maybe') AS maybe,
  COUNT(g.id) FILTER (WHERE g.rsvp_status = 'not_opened') AS not_opened,
  COUNT(g.id) FILTER (WHERE g.rsvp_status = 'opened_no_response') AS opened_no_response,
  COUNT(g.id) FILTER (WHERE g.check_in_status = 'checked_in') AS checked_in,
  COALESCE(SUM(g.companion_count) FILTER (WHERE g.check_in_status = 'checked_in'), 0) AS total_companions_checked_in
FROM public.events e
LEFT JOIN public.guests g ON g.event_id = e.id
GROUP BY e.id;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_gates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.check_in_logs ENABLE ROW LEVEL SECURITY;

-- Helper: current user role
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS public.user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'super_admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_event_host(p_event_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.events
    WHERE id = p_event_id AND host_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.is_event_staff(p_event_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.event_staff
    WHERE event_id = p_event_id AND user_id = auth.uid()
  );
$$;

-- Profiles policies
CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id OR public.is_super_admin());

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id OR public.is_super_admin());

CREATE POLICY "Super admin manages profiles"
  ON public.profiles FOR ALL
  USING (public.is_super_admin());

-- Events policies
CREATE POLICY "Super admin full access to events"
  ON public.events FOR ALL
  USING (public.is_super_admin());

CREATE POLICY "Hosts read own events"
  ON public.events FOR SELECT
  USING (host_id = auth.uid());

CREATE POLICY "Hosts update own events"
  ON public.events FOR UPDATE
  USING (host_id = auth.uid());

CREATE POLICY "Staff read assigned events"
  ON public.events FOR SELECT
  USING (public.is_event_staff(id));

CREATE POLICY "Public read published events by slug"
  ON public.events FOR SELECT
  USING (status = 'published');

-- Event gates policies
CREATE POLICY "Super admin manages gates"
  ON public.event_gates FOR ALL
  USING (public.is_super_admin());

CREATE POLICY "Host manages own event gates"
  ON public.event_gates FOR ALL
  USING (public.is_event_host(event_id));

CREATE POLICY "Staff read assigned event gates"
  ON public.event_gates FOR SELECT
  USING (public.is_event_staff(event_id));

-- Event staff policies
CREATE POLICY "Super admin manages event staff"
  ON public.event_staff FOR ALL
  USING (public.is_super_admin());

CREATE POLICY "Host manages own event staff"
  ON public.event_staff FOR ALL
  USING (public.is_event_host(event_id));

CREATE POLICY "Staff read own assignments"
  ON public.event_staff FOR SELECT
  USING (user_id = auth.uid());

-- Guests policies
CREATE POLICY "Super admin full access to guests"
  ON public.guests FOR ALL
  USING (public.is_super_admin());

CREATE POLICY "Host manages own event guests"
  ON public.guests FOR ALL
  USING (public.is_event_host(event_id));

CREATE POLICY "Staff read assigned event guests"
  ON public.guests FOR SELECT
  USING (public.is_event_staff(event_id));

CREATE POLICY "Staff update check-in on assigned events"
  ON public.guests FOR UPDATE
  USING (public.is_event_staff(event_id))
  WITH CHECK (public.is_event_staff(event_id));

-- Check-in logs policies
CREATE POLICY "Super admin full access to check_in_logs"
  ON public.check_in_logs FOR ALL
  USING (public.is_super_admin());

CREATE POLICY "Host reads own event check_in_logs"
  ON public.check_in_logs FOR SELECT
  USING (public.is_event_host(event_id));

CREATE POLICY "Staff read and insert check_in_logs"
  ON public.check_in_logs FOR SELECT
  USING (public.is_event_staff(event_id));

CREATE POLICY "Staff insert check_in_logs"
  ON public.check_in_logs FOR INSERT
  WITH CHECK (public.is_event_staff(event_id));

-- ---------------------------------------------------------------------------
-- Guest-facing RPCs (anon access via secure token — no direct table access)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_guest_invitation(
  p_slug TEXT,
  p_token UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'guest', jsonb_build_object(
      'id', g.id,
      'name', g.name,
      'phone_number', g.phone_number,
      'rsvp_status', g.rsvp_status,
      'is_vip', g.is_vip,
      'companion_count', g.companion_count
    ),
    'event', jsonb_build_object(
      'id', e.id,
      'title', e.title,
      'slug', e.slug,
      'template_type', e.template_type,
      'event_date', e.event_date,
      'location_name', e.location_name,
      'maps_url', e.maps_url,
      'countdown_target', e.countdown_target,
      'primary_color', e.primary_color,
      'secondary_color', e.secondary_color,
      'content_slots', e.content_slots,
      'settings', e.settings
    )
  ) INTO v_result
  FROM public.guests g
  INNER JOIN public.events e ON e.id = g.event_id
  WHERE g.unique_token = p_token
    AND e.slug = p_slug
    AND e.status = 'published';

  IF v_result IS NULL THEN
    RETURN jsonb_build_object('success', FALSE, 'error', 'not_found');
  END IF;

  PERFORM public.mark_guest_opened(p_token);

  RETURN jsonb_build_object('success', TRUE, 'data', v_result);
END;
$$;

CREATE OR REPLACE FUNCTION public.submit_guest_rsvp(
  p_token UUID,
  p_name TEXT,
  p_phone TEXT,
  p_status public.rsvp_status,
  p_companion_count INT DEFAULT 0
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_guest public.guests;
BEGIN
  IF p_status NOT IN ('confirmed', 'declined', 'maybe') THEN
    RETURN jsonb_build_object('success', FALSE, 'error', 'invalid_status');
  END IF;

  UPDATE public.guests
  SET
    name = COALESCE(NULLIF(TRIM(p_name), ''), name),
    phone_number = COALESCE(NULLIF(TRIM(p_phone), ''), phone_number),
    rsvp_status = p_status,
    companion_count = GREATEST(0, COALESCE(p_companion_count, 0)),
    rsvp_updated_at = NOW(),
    opened_at = COALESCE(opened_at, NOW())
  WHERE unique_token = p_token
    AND EXISTS (
      SELECT 1 FROM public.events e
      WHERE e.id = guests.event_id AND e.status = 'published'
    )
  RETURNING * INTO v_guest;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', FALSE, 'error', 'not_found');
  END IF;

  RETURN jsonb_build_object('success', TRUE, 'guest', row_to_json(v_guest));
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_guest_invitation(TEXT, UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.submit_guest_rsvp(UUID, TEXT, TEXT, public.rsvp_status, INT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_in_guest(UUID, UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_guest_opened(UUID) TO anon, authenticated;

-- Grant analytics view access
GRANT SELECT ON public.event_analytics TO authenticated;
