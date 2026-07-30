-- Guest QR: public invitation lookup + host guest row on session create

CREATE OR REPLACE FUNCTION public.ensure_host_reception_guest(
  p_reception_token UUID,
  p_guest_token UUID,
  p_display_name TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.reception_sessions WHERE token = p_reception_token
  ) THEN
    RETURN;
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.reception_guests
    WHERE reception_token = p_reception_token
      AND unique_token = p_guest_token
  ) THEN
    RETURN;
  END IF;

  INSERT INTO public.reception_guests (
    reception_token,
    name,
    invitation_number,
    unique_token,
    rsvp_status,
    companion_count
  )
  VALUES (
    p_reception_token,
    COALESCE(NULLIF(TRIM(p_display_name), ''), 'Guest'),
    'INV-HOST',
    p_guest_token,
    'confirmed',
    0
  )
  ON CONFLICT (unique_token) DO NOTHING;
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
    'check_in_status', rg.check_in_status
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
    'check_in_status', rg.check_in_status
  )
  INTO v_result
  FROM public.reception_guests rg
  INNER JOIN public.reception_sessions rs ON rs.token = rg.reception_token
  WHERE rg.unique_token = p_token
  LIMIT 1;

  RETURN v_result;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_reception_session(
  p_token UUID,
  p_event_display_name TEXT,
  p_event_date DATE,
  p_occasion TEXT,
  p_event_slug TEXT,
  p_guest_token UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.reception_sessions (
    token,
    event_display_name,
    event_date,
    occasion,
    event_slug,
    guest_token,
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
    0,
    0,
    0
  )
  ON CONFLICT (token) DO UPDATE SET
    event_display_name = EXCLUDED.event_display_name,
    event_date = EXCLUDED.event_date,
    occasion = EXCLUDED.occasion,
    event_slug = EXCLUDED.event_slug,
    guest_token = EXCLUDED.guest_token;

  PERFORM public.seed_reception_demo_guests(p_token);

  PERFORM public.ensure_host_reception_guest(
    p_token,
    p_guest_token,
    p_event_display_name
  );

  PERFORM public.refresh_reception_session_counts(p_token);

  RETURN json_build_object('ok', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.ensure_host_reception_guest(UUID, UUID, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_public_guest_invitation(TEXT, UUID) TO anon, authenticated, service_role;
