-- Persist host "Guest QR" toggle on reception sessions

ALTER TABLE public.reception_sessions
  ADD COLUMN IF NOT EXISTS guest_qr_enabled BOOLEAN NOT NULL DEFAULT TRUE;

CREATE OR REPLACE FUNCTION public.create_reception_session(
  p_token UUID,
  p_event_display_name TEXT,
  p_event_date DATE,
  p_occasion TEXT,
  p_event_slug TEXT,
  p_guest_token UUID,
  p_guest_qr_enabled BOOLEAN DEFAULT TRUE
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
    guest_qr_enabled,
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
    guest_qr_enabled = EXCLUDED.guest_qr_enabled;

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
    'guest_qr_enabled', COALESCE(rs.guest_qr_enabled, TRUE)
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
    'guest_qr_enabled', COALESCE(rs.guest_qr_enabled, TRUE)
  )
  INTO v_result
  FROM public.reception_guests rg
  INNER JOIN public.reception_sessions rs ON rs.token = rg.reception_token
  WHERE rg.unique_token = p_token
  LIMIT 1;

  RETURN v_result;
END;
$$;
