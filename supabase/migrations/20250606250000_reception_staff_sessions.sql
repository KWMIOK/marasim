-- Session-backed reception staff access (replaces device fingerprint + national ID)

CREATE EXTENSION IF NOT EXISTS pgcrypto;

ALTER TABLE public.reception_sessions
  ADD COLUMN IF NOT EXISTS emergency_passcode_hash TEXT,
  ADD COLUMN IF NOT EXISTS staff_sessions_reset_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

COMMENT ON COLUMN public.reception_sessions.reception_staff_limit IS
  'Max receptionists (0 = unlimited). Counts active, non-revoked staff registrations.';

CREATE TABLE IF NOT EXISTS public.reception_staff (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reception_token  UUID NOT NULL REFERENCES public.reception_sessions (token) ON DELETE CASCADE,
  full_name        TEXT NOT NULL,
  phone            TEXT NOT NULL,
  phone_verified_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at       TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (reception_token, phone)
);

CREATE TABLE IF NOT EXISTS public.reception_staff_sessions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id         UUID NOT NULL REFERENCES public.reception_staff (id) ON DELETE CASCADE,
  reception_token  UUID NOT NULL REFERENCES public.reception_sessions (token) ON DELETE CASCADE,
  token_hash       TEXT NOT NULL UNIQUE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at       TIMESTAMPTZ NOT NULL,
  last_seen_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.reception_staff_otp (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reception_token  UUID NOT NULL REFERENCES public.reception_sessions (token) ON DELETE CASCADE,
  phone            TEXT NOT NULL,
  full_name        TEXT NOT NULL,
  code_hash        TEXT NOT NULL,
  expires_at       TIMESTAMPTZ NOT NULL,
  consumed_at      TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS reception_staff_token_idx ON public.reception_staff (reception_token);
CREATE INDEX IF NOT EXISTS reception_staff_sessions_staff_idx ON public.reception_staff_sessions (staff_id);
CREATE INDEX IF NOT EXISTS reception_staff_sessions_token_idx ON public.reception_staff_sessions (reception_token);
CREATE INDEX IF NOT EXISTS reception_staff_otp_lookup_idx
  ON public.reception_staff_otp (reception_token, phone, created_at DESC);

ALTER TABLE public.reception_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reception_staff_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reception_staff_otp ENABLE ROW LEVEL SECURITY;

-- Migrate legacy staff rows (drop national_id dependency)
INSERT INTO public.reception_staff (reception_token, full_name, phone, phone_verified_at, created_at)
SELECT DISTINCT ON (rsd.reception_token, rsd.phone)
  rsd.reception_token,
  rsd.full_name,
  rsd.phone,
  COALESCE(rsd.registered_at, NOW()),
  COALESCE(rsd.registered_at, NOW())
FROM public.reception_staff_devices rsd
WHERE NOT EXISTS (
  SELECT 1 FROM public.reception_staff rs
  WHERE rs.reception_token = rsd.reception_token AND rs.phone = rsd.phone
)
ORDER BY rsd.reception_token, rsd.phone, rsd.registered_at DESC;

CREATE OR REPLACE FUNCTION public.check_reception_staff_access(
  p_token UUID,
  p_session_token_hash TEXT DEFAULT NULL,
  p_viewer_profile_id UUID DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
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

  IF NULLIF(TRIM(COALESCE(p_session_token_hash, '')), '') IS NOT NULL THEN
    SELECT json_build_object(
      'full_name', rs.full_name,
      'phone', rs.phone
    )
    INTO v_staff
    FROM public.reception_staff_sessions rss
    INNER JOIN public.reception_staff rs ON rs.id = rss.staff_id
    WHERE rss.reception_token = p_token
      AND rss.token_hash = TRIM(p_session_token_hash)
      AND rss.expires_at > NOW()
      AND rss.created_at >= v_session.staff_sessions_reset_at
      AND rs.revoked_at IS NULL;

    IF v_staff IS NOT NULL THEN
      UPDATE public.reception_staff_sessions
      SET last_seen_at = NOW()
      WHERE token_hash = TRIM(p_session_token_hash);

      RETURN json_build_object('status', 'authenticated', 'staff', v_staff);
    END IF;
  END IF;

  IF v_session.reception_staff_limit = 0 THEN
    RETURN json_build_object(
      'status', 'needs_registration',
      'staff_limit', 0,
      'slots_remaining', NULL
    );
  END IF;

  SELECT COUNT(*)::INTEGER INTO v_staff_count
  FROM public.reception_staff
  WHERE reception_token = p_token AND revoked_at IS NULL;

  RETURN json_build_object(
    'status', 'needs_registration',
    'staff_limit', v_session.reception_staff_limit,
    'slots_remaining', GREATEST(v_session.reception_staff_limit - v_staff_count, 0)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.store_reception_staff_otp(
  p_token UUID,
  p_phone TEXT,
  p_full_name TEXT,
  p_code_plain TEXT,
  p_expires_at TIMESTAMPTZ
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.reception_sessions WHERE token = p_token) THEN
    RETURN json_build_object('ok', false, 'error', 'invalid_session');
  END IF;

  IF NULLIF(TRIM(p_phone), '') IS NULL
     OR NULLIF(TRIM(p_full_name), '') IS NULL
     OR NULLIF(TRIM(p_code_plain), '') IS NULL THEN
    RETURN json_build_object('ok', false, 'error', 'missing_fields');
  END IF;

  INSERT INTO public.reception_staff_otp (
    reception_token, phone, full_name, code_hash, expires_at
  )
  VALUES (
    p_token,
    TRIM(p_phone),
    TRIM(p_full_name),
    crypt(TRIM(p_code_plain), gen_salt('bf')),
    p_expires_at
  );

  RETURN json_build_object('ok', true);
END;
$$;

CREATE OR REPLACE FUNCTION public.verify_reception_staff_otp(
  p_token UUID,
  p_phone TEXT,
  p_code TEXT,
  p_full_name TEXT,
  p_session_token_hash TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_session public.reception_sessions%ROWTYPE;
  v_otp public.reception_staff_otp%ROWTYPE;
  v_staff public.reception_staff%ROWTYPE;
  v_staff_count INTEGER;
  v_staff_id UUID;
BEGIN
  SELECT * INTO v_session FROM public.reception_sessions WHERE token = p_token;
  IF NOT FOUND THEN
    RETURN json_build_object('ok', false, 'error', 'invalid_session');
  END IF;

  SELECT * INTO v_otp
  FROM public.reception_staff_otp
  WHERE reception_token = p_token
    AND phone = TRIM(p_phone)
    AND consumed_at IS NULL
    AND expires_at > NOW()
  ORDER BY created_at DESC
  LIMIT 1;

  IF NOT FOUND OR crypt(TRIM(p_code), v_otp.code_hash) IS DISTINCT FROM v_otp.code_hash THEN
    RETURN json_build_object('ok', false, 'error', 'invalid_otp');
  END IF;

  IF TRIM(v_otp.full_name) <> TRIM(p_full_name) THEN
    RETURN json_build_object('ok', false, 'error', 'name_mismatch');
  END IF;

  SELECT * INTO v_staff
  FROM public.reception_staff
  WHERE reception_token = p_token AND phone = TRIM(p_phone);

  IF FOUND THEN
    IF v_staff.revoked_at IS NOT NULL THEN
      RETURN json_build_object('ok', false, 'error', 'staff_revoked');
    END IF;
    v_staff_id := v_staff.id;
    UPDATE public.reception_staff
    SET full_name = TRIM(p_full_name), phone_verified_at = NOW()
    WHERE id = v_staff_id;
  ELSE
    IF v_session.reception_staff_limit > 0 THEN
      SELECT COUNT(*)::INTEGER INTO v_staff_count
      FROM public.reception_staff
      WHERE reception_token = p_token AND revoked_at IS NULL;

      IF v_staff_count >= v_session.reception_staff_limit THEN
        RETURN json_build_object('ok', false, 'error', 'staff_limit_reached');
      END IF;
    END IF;

    INSERT INTO public.reception_staff (reception_token, full_name, phone, phone_verified_at)
    VALUES (p_token, TRIM(p_full_name), TRIM(p_phone), NOW())
    RETURNING id INTO v_staff_id;
  END IF;

  UPDATE public.reception_staff_otp SET consumed_at = NOW() WHERE id = v_otp.id;

  INSERT INTO public.reception_staff_sessions (
    staff_id, reception_token, token_hash, expires_at
  )
  VALUES (
    v_staff_id,
    p_token,
    TRIM(p_session_token_hash),
    NOW() + INTERVAL '30 days'
  );

  SELECT * INTO v_staff FROM public.reception_staff WHERE id = v_staff_id;

  RETURN json_build_object(
    'ok', true,
    'staff', json_build_object('full_name', v_staff.full_name, 'phone', v_staff.phone)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.login_reception_staff_emergency(
  p_token UUID,
  p_passcode TEXT,
  p_full_name TEXT,
  p_phone TEXT,
  p_session_token_hash TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_session public.reception_sessions%ROWTYPE;
  v_staff public.reception_staff%ROWTYPE;
  v_staff_count INTEGER;
  v_staff_id UUID;
BEGIN
  SELECT * INTO v_session FROM public.reception_sessions WHERE token = p_token;
  IF NOT FOUND THEN
    RETURN json_build_object('ok', false, 'error', 'invalid_session');
  END IF;

  IF v_session.emergency_passcode_hash IS NULL
     OR crypt(TRIM(p_passcode), v_session.emergency_passcode_hash) IS DISTINCT FROM v_session.emergency_passcode_hash THEN
    RETURN json_build_object('ok', false, 'error', 'invalid_passcode');
  END IF;

  SELECT * INTO v_staff
  FROM public.reception_staff
  WHERE reception_token = p_token AND phone = TRIM(p_phone);

  IF FOUND THEN
    IF v_staff.revoked_at IS NOT NULL THEN
      RETURN json_build_object('ok', false, 'error', 'staff_revoked');
    END IF;
    v_staff_id := v_staff.id;
    UPDATE public.reception_staff SET full_name = TRIM(p_full_name) WHERE id = v_staff_id;
  ELSE
    IF v_session.reception_staff_limit > 0 THEN
      SELECT COUNT(*)::INTEGER INTO v_staff_count
      FROM public.reception_staff
      WHERE reception_token = p_token AND revoked_at IS NULL;

      IF v_staff_count >= v_session.reception_staff_limit THEN
        RETURN json_build_object('ok', false, 'error', 'staff_limit_reached');
      END IF;
    END IF;

    INSERT INTO public.reception_staff (reception_token, full_name, phone, phone_verified_at)
    VALUES (p_token, TRIM(p_full_name), TRIM(p_phone), NOW())
    RETURNING id INTO v_staff_id;
  END IF;

  INSERT INTO public.reception_staff_sessions (
    staff_id, reception_token, token_hash, expires_at
  )
  VALUES (
    v_staff_id,
    p_token,
    TRIM(p_session_token_hash),
    NOW() + INTERVAL '30 days'
  );

  SELECT * INTO v_staff FROM public.reception_staff WHERE id = v_staff_id;

  RETURN json_build_object(
    'ok', true,
    'staff', json_build_object('full_name', v_staff.full_name, 'phone', v_staff.phone)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.list_reception_staff_for_host(
  p_token UUID,
  p_host_profile_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_session public.reception_sessions%ROWTYPE;
BEGIN
  SELECT * INTO v_session FROM public.reception_sessions WHERE token = p_token;
  IF NOT FOUND THEN
    RETURN json_build_object('ok', false, 'error', 'invalid_session');
  END IF;

  IF p_host_profile_id IS NULL OR v_session.host_profile_id IS DISTINCT FROM p_host_profile_id THEN
    RETURN json_build_object('ok', false, 'error', 'forbidden');
  END IF;

  RETURN json_build_object(
    'ok', true,
    'staff_limit', v_session.reception_staff_limit,
    'has_emergency_passcode', v_session.emergency_passcode_hash IS NOT NULL,
    'staff', COALESCE(
      (
        SELECT json_agg(
          json_build_object(
            'id', rs.id,
            'full_name', rs.full_name,
            'phone', rs.phone,
            'created_at', rs.created_at,
            'revoked_at', rs.revoked_at,
            'active_sessions', (
              SELECT COUNT(*)::INTEGER
              FROM public.reception_staff_sessions rss
              WHERE rss.staff_id = rs.id
                AND rss.expires_at > NOW()
                AND rss.created_at >= v_session.staff_sessions_reset_at
            )
          )
          ORDER BY rs.created_at ASC
        )
        FROM public.reception_staff rs
        WHERE rs.reception_token = p_token
      ),
      '[]'::JSON
    )
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.revoke_reception_staff_member(
  p_staff_id UUID,
  p_host_profile_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_staff public.reception_staff%ROWTYPE;
  v_session public.reception_sessions%ROWTYPE;
BEGIN
  SELECT * INTO v_staff FROM public.reception_staff WHERE id = p_staff_id;
  IF NOT FOUND THEN
    RETURN json_build_object('ok', false, 'error', 'not_found');
  END IF;

  SELECT * INTO v_session FROM public.reception_sessions WHERE token = v_staff.reception_token;
  IF p_host_profile_id IS NULL OR v_session.host_profile_id IS DISTINCT FROM p_host_profile_id THEN
    RETURN json_build_object('ok', false, 'error', 'forbidden');
  END IF;

  UPDATE public.reception_staff SET revoked_at = NOW() WHERE id = p_staff_id;
  DELETE FROM public.reception_staff_sessions WHERE staff_id = p_staff_id;

  RETURN json_build_object('ok', true);
END;
$$;

CREATE OR REPLACE FUNCTION public.reset_reception_staff_sessions(
  p_token UUID,
  p_host_profile_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_session public.reception_sessions%ROWTYPE;
BEGIN
  SELECT * INTO v_session FROM public.reception_sessions WHERE token = p_token;
  IF NOT FOUND THEN
    RETURN json_build_object('ok', false, 'error', 'invalid_session');
  END IF;

  IF p_host_profile_id IS NULL OR v_session.host_profile_id IS DISTINCT FROM p_host_profile_id THEN
    RETURN json_build_object('ok', false, 'error', 'forbidden');
  END IF;

  UPDATE public.reception_sessions
  SET staff_sessions_reset_at = NOW()
  WHERE token = p_token;

  DELETE FROM public.reception_staff_sessions WHERE reception_token = p_token;

  RETURN json_build_object('ok', true);
END;
$$;

CREATE OR REPLACE FUNCTION public.set_reception_emergency_passcode(
  p_token UUID,
  p_host_profile_id UUID,
  p_passcode_plain TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_session public.reception_sessions%ROWTYPE;
BEGIN
  SELECT * INTO v_session FROM public.reception_sessions WHERE token = p_token;
  IF NOT FOUND THEN
    RETURN json_build_object('ok', false, 'error', 'invalid_session');
  END IF;

  IF p_host_profile_id IS NULL OR v_session.host_profile_id IS DISTINCT FROM p_host_profile_id THEN
    RETURN json_build_object('ok', false, 'error', 'forbidden');
  END IF;

  IF NULLIF(TRIM(p_passcode_plain), '') IS NULL OR LENGTH(TRIM(p_passcode_plain)) <> 6 THEN
    RETURN json_build_object('ok', false, 'error', 'invalid_passcode');
  END IF;

  UPDATE public.reception_sessions
  SET emergency_passcode_hash = crypt(TRIM(p_passcode_plain), gen_salt('bf'))
  WHERE token = p_token;

  RETURN json_build_object('ok', true);
END;
$$;

DROP FUNCTION IF EXISTS public.create_reception_session(UUID, TEXT, DATE, TEXT, TEXT, UUID, BOOLEAN, INTEGER, UUID, TEXT, TEXT, TEXT, DOUBLE PRECISION, DOUBLE PRECISION, TEXT);

CREATE OR REPLACE FUNCTION public.create_reception_session(
  p_token UUID,
  p_event_display_name TEXT,
  p_event_date DATE,
  p_occasion TEXT,
  p_event_slug TEXT,
  p_guest_token UUID,
  p_guest_qr_enabled BOOLEAN DEFAULT TRUE,
  p_reception_staff_limit INTEGER DEFAULT 0,
  p_host_profile_id UUID DEFAULT NULL,
  p_emergency_passcode_plain TEXT DEFAULT NULL,
  p_location_name TEXT DEFAULT NULL,
  p_location_directions TEXT DEFAULT NULL,
  p_maps_lat DOUBLE PRECISION DEFAULT NULL,
  p_maps_lng DOUBLE PRECISION DEFAULT NULL,
  p_maps_url TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_limit INTEGER := GREATEST(0, LEAST(COALESCE(p_reception_staff_limit, 0), 20));
  v_is_insert BOOLEAN := FALSE;
  v_passcode_hash TEXT;
BEGIN
  v_is_insert := NOT EXISTS (SELECT 1 FROM public.reception_sessions WHERE token = p_token);

  IF v_is_insert AND NULLIF(TRIM(COALESCE(p_emergency_passcode_plain, '')), '') IS NOT NULL THEN
    v_passcode_hash := crypt(TRIM(p_emergency_passcode_plain), gen_salt('bf'));
  END IF;

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
    emergency_passcode_hash,
    location_name,
    location_directions,
    maps_lat,
    maps_lng,
    maps_url,
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
    v_passcode_hash,
    NULLIF(TRIM(COALESCE(p_location_name, '')), ''),
    NULLIF(TRIM(COALESCE(p_location_directions, '')), ''),
    p_maps_lat,
    p_maps_lng,
    NULLIF(TRIM(COALESCE(p_maps_url, '')), ''),
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
    host_profile_id = COALESCE(EXCLUDED.host_profile_id, public.reception_sessions.host_profile_id),
    emergency_passcode_hash = COALESCE(
      EXCLUDED.emergency_passcode_hash,
      public.reception_sessions.emergency_passcode_hash
    ),
    location_name = EXCLUDED.location_name,
    location_directions = EXCLUDED.location_directions,
    maps_lat = EXCLUDED.maps_lat,
    maps_lng = EXCLUDED.maps_lng,
    maps_url = EXCLUDED.maps_url;

  PERFORM public.seed_reception_demo_guests(p_token);
  PERFORM public.ensure_host_reception_guest(p_token, p_guest_token, p_event_display_name);
  PERFORM public.refresh_reception_session_counts(p_token);

  RETURN json_build_object('ok', true, 'created', v_is_insert);
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_reception_staff_access(UUID, TEXT, UUID) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.store_reception_staff_otp(UUID, TEXT, TEXT, TEXT, TIMESTAMPTZ) TO service_role;
GRANT EXECUTE ON FUNCTION public.verify_reception_staff_otp(UUID, TEXT, TEXT, TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.login_reception_staff_emergency(UUID, TEXT, TEXT, TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.list_reception_staff_for_host(UUID, UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.revoke_reception_staff_member(UUID, UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.reset_reception_staff_sessions(UUID, UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.set_reception_emergency_passcode(UUID, UUID, TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.create_reception_session(UUID, TEXT, DATE, TEXT, TEXT, UUID, BOOLEAN, INTEGER, UUID, TEXT, TEXT, TEXT, DOUBLE PRECISION, DOUBLE PRECISION, TEXT) TO service_role;
