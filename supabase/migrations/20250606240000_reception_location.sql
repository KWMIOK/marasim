-- Venue name, manual directions, and map pin on reception sessions

ALTER TABLE public.reception_sessions
  ADD COLUMN IF NOT EXISTS location_name TEXT,
  ADD COLUMN IF NOT EXISTS location_directions TEXT,
  ADD COLUMN IF NOT EXISTS maps_lat DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS maps_lng DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS maps_url TEXT;

DROP FUNCTION IF EXISTS public.create_reception_session(UUID, TEXT, DATE, TEXT, TEXT, UUID, BOOLEAN, INTEGER, UUID, TEXT);

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
  p_host_device_id TEXT DEFAULT NULL,
  p_location_name TEXT DEFAULT NULL,
  p_location_directions TEXT DEFAULT NULL,
  p_maps_lat DOUBLE PRECISION DEFAULT NULL,
  p_maps_lng DOUBLE PRECISION DEFAULT NULL,
  p_maps_url TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_limit INTEGER := GREATEST(0, LEAST(COALESCE(p_reception_staff_limit, 0), 20));
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
    location_name = EXCLUDED.location_name,
    location_directions = EXCLUDED.location_directions,
    maps_lat = EXCLUDED.maps_lat,
    maps_lng = EXCLUDED.maps_lng,
    maps_url = EXCLUDED.maps_url;

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

CREATE OR REPLACE FUNCTION public.get_public_guest_invitation(
  p_slug TEXT,
  p_token UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSON;
BEGIN
  SELECT json_build_object(
    'guest_token', rg.unique_token,
    'name', rg.name,
    'invitation_number', rg.invitation_number,
    'event_display_name', rs.event_display_name,
    'event_date', rs.event_date,
    'rsvp_status', rg.rsvp_status,
    'check_in_status', rg.check_in_status,
    'guest_qr_enabled', COALESCE(rs.guest_qr_enabled, TRUE),
    'location_name', rs.location_name,
    'location_directions', rs.location_directions,
    'maps_lat', rs.maps_lat,
    'maps_lng', rs.maps_lng,
    'maps_url', rs.maps_url
  )
  INTO v_result
  FROM public.reception_guests rg
  INNER JOIN public.reception_sessions rs ON rs.token = rg.reception_token
  WHERE rg.unique_token = p_token
    AND (
      rs.event_slug = p_slug
      OR rs.guest_token = p_token
    )
  LIMIT 1;

  IF v_result IS NOT NULL THEN
    RETURN v_result;
  END IF;

  SELECT json_build_object(
    'guest_token', rg.unique_token,
    'name', rg.name,
    'invitation_number', rg.invitation_number,
    'event_display_name', rs.event_display_name,
    'event_date', rs.event_date,
    'rsvp_status', rg.rsvp_status,
    'check_in_status', rg.check_in_status,
    'guest_qr_enabled', COALESCE(rs.guest_qr_enabled, TRUE),
    'location_name', rs.location_name,
    'location_directions', rs.location_directions,
    'maps_lat', rs.maps_lat,
    'maps_lng', rs.maps_lng,
    'maps_url', rs.maps_url
  )
  INTO v_result
  FROM public.reception_guests rg
  INNER JOIN public.reception_sessions rs ON rs.token = rg.reception_token
  WHERE rg.unique_token = p_token
  LIMIT 1;

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_reception_session(UUID, TEXT, DATE, TEXT, TEXT, UUID, BOOLEAN, INTEGER, UUID, TEXT, TEXT, TEXT, DOUBLE PRECISION, DOUBLE PRECISION, TEXT) TO service_role;
