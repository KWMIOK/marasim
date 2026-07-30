-- Receptionist link sessions (token-based access for venue staff)

CREATE TABLE public.reception_sessions (
  token                 UUID PRIMARY KEY,
  event_display_name    TEXT NOT NULL,
  event_date            DATE,
  occasion              TEXT,
  event_slug            TEXT,
  guest_token           UUID,
  total_guests          INTEGER NOT NULL DEFAULT 0,
  arrived_guests        INTEGER NOT NULL DEFAULT 0,
  not_arrived_guests    INTEGER NOT NULL DEFAULT 0,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.reception_sessions IS
  'Token-gated receptionist workspace opened via /reception/{token}.';

ALTER TABLE public.reception_sessions ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.get_reception_session(p_token UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'token', token,
    'event_display_name', event_display_name,
    'event_date', event_date,
    'occasion', occasion,
    'total_guests', total_guests,
    'arrived_guests', arrived_guests,
    'not_arrived_guests', not_arrived_guests
  )
  INTO result
  FROM public.reception_sessions
  WHERE token = p_token;

  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_reception_session(UUID) TO anon, authenticated, service_role;

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

  RETURN json_build_object('ok', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_reception_session(UUID, TEXT, DATE, TEXT, TEXT, UUID) TO service_role;
