-- Reception staff device limits + registration

ALTER TABLE public.reception_sessions
  ADD COLUMN IF NOT EXISTS reception_staff_limit INTEGER NOT NULL DEFAULT 2,
  ADD COLUMN IF NOT EXISTS host_profile_id UUID REFERENCES public.profiles (id) ON DELETE SET NULL;

ALTER TABLE public.reception_sessions
  DROP CONSTRAINT IF EXISTS reception_sessions_staff_limit_check;

ALTER TABLE public.reception_sessions
  ADD CONSTRAINT reception_sessions_staff_limit_check
  CHECK (reception_staff_limit >= 1 AND reception_staff_limit <= 20);

CREATE TABLE IF NOT EXISTS public.reception_staff_devices (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reception_token  UUID NOT NULL REFERENCES public.reception_sessions (token) ON DELETE CASCADE,
  device_id        TEXT NOT NULL,
  full_name        TEXT NOT NULL,
  national_id      TEXT NOT NULL,
  phone            TEXT NOT NULL,
  registered_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (reception_token, device_id)
);

CREATE TABLE IF NOT EXISTS public.reception_host_devices (
  reception_token UUID NOT NULL REFERENCES public.reception_sessions (token) ON DELETE CASCADE,
  device_id       TEXT NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (reception_token, device_id)
);

CREATE INDEX IF NOT EXISTS reception_staff_devices_token_idx
  ON public.reception_staff_devices (reception_token);

ALTER TABLE public.reception_staff_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reception_host_devices ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.check_reception_device_access(
  p_token UUID,
  p_device_id TEXT,
  p_host_device_id TEXT DEFAULT NULL,
  p_viewer_profile_id UUID DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_session public.reception_sessions%ROWTYPE;
  v_staff_count INTEGER;
  v_staff JSON;
BEGIN
  SELECT * INTO v_session FROM public.reception_sessions WHERE token = p_token;

  IF NOT FOUND THEN
    RETURN json_build_object('status', 'invalid');
  END IF;

  IF p_viewer_profile_id IS NOT NULL
     AND v_session.host_profile_id IS NOT NULL
     AND v_session.host_profile_id = p_viewer_profile_id THEN
    RETURN json_build_object('status', 'host');
  END IF;

  IF NULLIF(TRIM(COALESCE(p_host_device_id, '')), '') IS NOT NULL
     AND EXISTS (
       SELECT 1 FROM public.reception_host_devices
       WHERE reception_token = p_token AND device_id = TRIM(p_host_device_id)
     ) THEN
    RETURN json_build_object('status', 'host');
  END IF;

  SELECT json_build_object(
    'full_name', full_name,
    'national_id', national_id,
    'phone', phone
  )
  INTO v_staff
  FROM public.reception_staff_devices
  WHERE reception_token = p_token AND device_id = TRIM(p_device_id)
  LIMIT 1;

  IF v_staff IS NOT NULL THEN
    RETURN json_build_object('status', 'registered', 'staff', v_staff);
  END IF;

  SELECT COUNT(*)::INTEGER INTO v_staff_count
  FROM public.reception_staff_devices
  WHERE reception_token = p_token;

  IF v_staff_count >= v_session.reception_staff_limit THEN
    RETURN json_build_object(
      'status', 'locked',
      'staff_limit', v_session.reception_staff_limit
    );
  END IF;

  RETURN json_build_object(
    'status', 'needs_registration',
    'staff_limit', v_session.reception_staff_limit,
    'slots_remaining', v_session.reception_staff_limit - v_staff_count
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.register_reception_staff_device(
  p_token UUID,
  p_device_id TEXT,
  p_full_name TEXT,
  p_national_id TEXT,
  p_phone TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_session public.reception_sessions%ROWTYPE;
  v_staff_count INTEGER;
  v_row public.reception_staff_devices%ROWTYPE;
BEGIN
  SELECT * INTO v_session FROM public.reception_sessions WHERE token = p_token;
  IF NOT FOUND THEN
    RETURN json_build_object('ok', false, 'error', 'invalid_session');
  END IF;

  IF NULLIF(TRIM(p_device_id), '') IS NULL
     OR NULLIF(TRIM(p_full_name), '') IS NULL
     OR NULLIF(TRIM(p_national_id), '') IS NULL
     OR NULLIF(TRIM(p_phone), '') IS NULL THEN
    RETURN json_build_object('ok', false, 'error', 'missing_fields');
  END IF;

  SELECT * INTO v_row
  FROM public.reception_staff_devices
  WHERE reception_token = p_token AND device_id = TRIM(p_device_id);

  IF FOUND THEN
    RETURN json_build_object(
      'ok', true,
      'staff', json_build_object(
        'full_name', v_row.full_name,
        'national_id', v_row.national_id,
        'phone', v_row.phone
      )
    );
  END IF;

  SELECT COUNT(*)::INTEGER INTO v_staff_count
  FROM public.reception_staff_devices
  WHERE reception_token = p_token;

  IF v_staff_count >= v_session.reception_staff_limit THEN
    RETURN json_build_object('ok', false, 'error', 'device_limit_reached');
  END IF;

  INSERT INTO public.reception_staff_devices (
    reception_token,
    device_id,
    full_name,
    national_id,
    phone
  )
  VALUES (
    p_token,
    TRIM(p_device_id),
    TRIM(p_full_name),
    TRIM(p_national_id),
    TRIM(p_phone)
  )
  RETURNING * INTO v_row;

  RETURN json_build_object(
    'ok', true,
    'staff', json_build_object(
      'full_name', v_row.full_name,
      'national_id', v_row.national_id,
      'phone', v_row.phone
    )
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.register_reception_host_device(
  p_token UUID,
  p_device_id TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.reception_sessions WHERE token = p_token) THEN
    RETURN json_build_object('ok', false);
  END IF;

  IF NULLIF(TRIM(p_device_id), '') IS NULL THEN
    RETURN json_build_object('ok', false);
  END IF;

  INSERT INTO public.reception_host_devices (reception_token, device_id)
  VALUES (p_token, TRIM(p_device_id))
  ON CONFLICT (reception_token, device_id) DO NOTHING;

  RETURN json_build_object('ok', true);
END;
$$;

DROP FUNCTION IF EXISTS public.create_reception_session(UUID, TEXT, DATE, TEXT, TEXT, UUID, BOOLEAN);

CREATE OR REPLACE FUNCTION public.create_reception_session(
  p_token UUID,
  p_event_display_name TEXT,
  p_event_date DATE,
  p_occasion TEXT,
  p_event_slug TEXT,
  p_guest_token UUID,
  p_guest_qr_enabled BOOLEAN DEFAULT TRUE,
  p_reception_staff_limit INTEGER DEFAULT 2,
  p_host_profile_id UUID DEFAULT NULL,
  p_host_device_id TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_limit INTEGER := GREATEST(1, LEAST(COALESCE(p_reception_staff_limit, 2), 20));
BEGIN
  INSERT INTO public.reception_sessions (
    token,
    event_display_name,
    event_date,
    occasion,
    event_slug,
    guest_token,
    guest_qr_enabled,
    reception_staff_limit,
    host_profile_id,
    total_guests,
    arrived_guests,
    not_arrived_guests
  )
  VALUES (
    p_token,
    p_event_display_name,
    p_event_date,
    p_occasion,
    p_event_slug,
    p_guest_token,
    COALESCE(p_guest_qr_enabled, TRUE),
    v_limit,
    p_host_profile_id,
    0,
    0,
    0
  )
  ON CONFLICT (token) DO UPDATE SET
    event_display_name = EXCLUDED.event_display_name,
    event_date = EXCLUDED.event_date,
    occasion = EXCLUDED.occasion,
    event_slug = EXCLUDED.event_slug,
    guest_token = EXCLUDED.guest_token,
    guest_qr_enabled = EXCLUDED.guest_qr_enabled,
    reception_staff_limit = EXCLUDED.reception_staff_limit,
    host_profile_id = COALESCE(EXCLUDED.host_profile_id, public.reception_sessions.host_profile_id);

  PERFORM public.seed_reception_demo_guests(p_token);

  PERFORM public.ensure_host_reception_guest(
    p_token,
    p_guest_token,
    p_event_display_name
  );

  IF NULLIF(TRIM(COALESCE(p_host_device_id, '')), '') IS NOT NULL THEN
    PERFORM public.register_reception_host_device(p_token, p_host_device_id);
  END IF;

  PERFORM public.refresh_reception_session_counts(p_token);

  RETURN json_build_object('ok', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_reception_device_access(UUID, TEXT, TEXT, UUID) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.register_reception_staff_device(UUID, TEXT, TEXT, TEXT, TEXT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.register_reception_host_device(UUID, TEXT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.create_reception_session(UUID, TEXT, DATE, TEXT, TEXT, UUID, BOOLEAN, INTEGER, UUID, TEXT) TO service_role;
