-- Public guest registration requests + registration link token on reception sessions

ALTER TABLE public.reception_sessions
  ADD COLUMN IF NOT EXISTS public_registration_token UUID UNIQUE DEFAULT gen_random_uuid();

UPDATE public.reception_sessions
SET public_registration_token = gen_random_uuid()
WHERE public_registration_token IS NULL;

ALTER TABLE public.reception_sessions
  ALTER COLUMN public_registration_token SET NOT NULL;

ALTER TABLE public.reception_guests
  ADD COLUMN IF NOT EXISTS phone_number TEXT;

CREATE TABLE IF NOT EXISTS public.guest_registration_requests (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reception_token   UUID NOT NULL REFERENCES public.reception_sessions (token) ON DELETE CASCADE,
  name              TEXT NOT NULL,
  phone             TEXT NOT NULL,
  status            TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'approved', 'declined')),
  guest_token       UUID,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at       TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_guest_registration_requests_reception
  ON public.guest_registration_requests (reception_token, status, created_at DESC);

ALTER TABLE public.guest_registration_requests ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.get_public_registration_event(p_public_token UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'event_display_name', rs.event_display_name,
    'event_date', rs.event_date,
    'occasion', rs.occasion
  )
  INTO result
  FROM public.reception_sessions rs
  WHERE rs.public_registration_token = p_public_token;

  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.submit_guest_registration_request(
  p_public_token UUID,
  p_name TEXT,
  p_phone TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_reception_token UUID;
  v_name TEXT := NULLIF(TRIM(p_name), '');
  v_phone TEXT := NULLIF(TRIM(p_phone), '');
  v_request public.guest_registration_requests;
BEGIN
  IF v_name IS NULL OR v_phone IS NULL THEN
    RETURN json_build_object('success', FALSE, 'error', 'invalid_input');
  END IF;

  SELECT token INTO v_reception_token
  FROM public.reception_sessions
  WHERE public_registration_token = p_public_token;

  IF v_reception_token IS NULL THEN
    RETURN json_build_object('success', FALSE, 'error', 'invalid_token');
  END IF;

  INSERT INTO public.guest_registration_requests (reception_token, name, phone)
  VALUES (v_reception_token, v_name, v_phone)
  RETURNING * INTO v_request;

  RETURN json_build_object(
    'success', TRUE,
    'request_id', v_request.id
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.list_guest_registration_requests(p_reception_token UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.reception_sessions WHERE token = p_reception_token
  ) THEN
    RETURN '[]'::JSON;
  END IF;

  RETURN COALESCE(
    (
      SELECT json_agg(row_to_json(r) ORDER BY r.created_at DESC)
      FROM (
        SELECT
          id,
          name,
          phone,
          status,
          guest_token,
          created_at,
          reviewed_at
        FROM public.guest_registration_requests
        WHERE reception_token = p_reception_token
      ) AS r
    ),
    '[]'::JSON
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.review_guest_registration_request(
  p_reception_token UUID,
  p_request_id UUID,
  p_action TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_request public.guest_registration_requests;
  v_session public.reception_sessions;
  v_guest_token UUID := gen_random_uuid();
  v_invitation_number TEXT;
  v_guest_url TEXT;
  v_seq INTEGER;
BEGIN
  IF p_action NOT IN ('approve', 'decline') THEN
    RETURN json_build_object('success', FALSE, 'error', 'invalid_action');
  END IF;

  SELECT * INTO v_request
  FROM public.guest_registration_requests
  WHERE id = p_request_id
    AND reception_token = p_reception_token
    AND status = 'pending';

  IF NOT FOUND THEN
    RETURN json_build_object('success', FALSE, 'error', 'not_found');
  END IF;

  IF p_action = 'decline' THEN
    UPDATE public.guest_registration_requests
    SET status = 'declined', reviewed_at = NOW()
    WHERE id = p_request_id
    RETURNING * INTO v_request;

    RETURN json_build_object('success', TRUE, 'status', 'declined');
  END IF;

  SELECT * INTO v_session
  FROM public.reception_sessions
  WHERE token = p_reception_token;

  SELECT COUNT(*) + 1 INTO v_seq
  FROM public.reception_guests
  WHERE reception_token = p_reception_token;

  v_invitation_number := 'INV-' || LPAD(v_seq::TEXT, 4, '0');

  INSERT INTO public.reception_guests (
    reception_token,
    name,
    phone_number,
    invitation_number,
    unique_token,
    rsvp_status,
    companion_count
  )
  VALUES (
    p_reception_token,
    v_request.name,
    v_request.phone,
    v_invitation_number,
    v_guest_token,
    'confirmed',
    0
  );

  UPDATE public.guest_registration_requests
  SET
    status = 'approved',
    guest_token = v_guest_token,
    reviewed_at = NOW()
  WHERE id = p_request_id
  RETURNING * INTO v_request;

  PERFORM public.refresh_reception_session_counts(p_reception_token);

  IF v_session.event_slug IS NOT NULL THEN
    v_guest_url := '/e/' || v_session.event_slug || '/' || v_guest_token::TEXT;
  END IF;

  RETURN json_build_object(
    'success', TRUE,
    'status', 'approved',
    'guest_token', v_guest_token,
    'guest_url_path', v_guest_url,
    'phone', v_request.phone,
    'name', v_request.name
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_public_registration_token(p_reception_token UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_token UUID;
BEGIN
  SELECT public_registration_token INTO v_token
  FROM public.reception_sessions
  WHERE token = p_reception_token;

  RETURN v_token;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_public_registration_event(UUID) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.submit_guest_registration_request(UUID, TEXT, TEXT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.list_guest_registration_requests(UUID) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.review_guest_registration_request(UUID, UUID, TEXT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_public_registration_token(UUID) TO anon, authenticated, service_role;
