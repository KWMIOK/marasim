-- Reception-scoped guest roster for token-gated check-in (no auth required)

CREATE TABLE public.reception_guests (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reception_token     UUID NOT NULL REFERENCES public.reception_sessions (token) ON DELETE CASCADE,
  name                TEXT NOT NULL,
  invitation_number   TEXT NOT NULL,
  unique_token        UUID NOT NULL DEFAULT gen_random_uuid(),
  rsvp_status         public.rsvp_status NOT NULL DEFAULT 'confirmed',
  companion_count     INT NOT NULL DEFAULT 0,
  avatar_url          TEXT,
  check_in_status     public.check_in_status NOT NULL DEFAULT 'not_checked_in',
  checked_in_at       TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT reception_guests_companion_count_non_negative CHECK (companion_count >= 0),
  CONSTRAINT reception_guests_invitation_number_unique UNIQUE (reception_token, invitation_number),
  CONSTRAINT reception_guests_unique_token_unique UNIQUE (unique_token)
);

CREATE INDEX idx_reception_guests_reception_token ON public.reception_guests (reception_token);
CREATE INDEX idx_reception_guests_name ON public.reception_guests (reception_token, name);
CREATE INDEX idx_reception_guests_invitation_number ON public.reception_guests (reception_token, invitation_number);

CREATE TRIGGER reception_guests_set_updated_at
  BEFORE UPDATE ON public.reception_guests
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.reception_guests ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- Seed demo guests for a reception session (idempotent)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.seed_reception_demo_guests(p_reception_token UUID)
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
    SELECT 1 FROM public.reception_guests WHERE reception_token = p_reception_token
  ) THEN
    RETURN;
  END IF;

  INSERT INTO public.reception_guests (
    reception_token, name, invitation_number, rsvp_status, companion_count, avatar_url
  ) VALUES
    (p_reception_token, 'Ahmed Al-Khaled', 'INV-001', 'confirmed', 2, NULL),
    (p_reception_token, 'Fatima Al-Sabah', 'INV-002', 'maybe', 1, NULL),
    (p_reception_token, 'Mohammed Al-Rashid', 'INV-003', 'confirmed', 0, NULL),
    (p_reception_token, 'Sara Al-Mutairi', 'INV-004', 'declined', 0, NULL),
    (p_reception_token, 'Khalid Hassan', 'INV-005', 'opened_no_response', 3, NULL);
END;
$$;

-- ---------------------------------------------------------------------------
-- Refresh reception session guest counts from roster
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.refresh_reception_session_counts(p_reception_token UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total INT;
  v_arrived INT;
BEGIN
  SELECT COUNT(*), COUNT(*) FILTER (WHERE check_in_status = 'checked_in')
  INTO v_total, v_arrived
  FROM public.reception_guests
  WHERE reception_token = p_reception_token;

  UPDATE public.reception_sessions
  SET
    total_guests = v_total,
    arrived_guests = v_arrived,
    not_arrived_guests = GREATEST(v_total - v_arrived, 0)
  WHERE token = p_reception_token;
END;
$$;

-- ---------------------------------------------------------------------------
-- Search guests by name or invitation number
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.search_reception_guests(
  p_reception_token UUID,
  p_query TEXT DEFAULT ''
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_results JSON;
  v_trimmed TEXT := TRIM(COALESCE(p_query, ''));
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.reception_sessions WHERE token = p_reception_token
  ) THEN
    RETURN '[]'::JSON;
  END IF;

  PERFORM public.seed_reception_demo_guests(p_reception_token);

  SELECT COALESCE(json_agg(row_to_json(guest_row) ORDER BY guest_row.invitation_number), '[]'::JSON)
  INTO v_results
  FROM (
    SELECT
      rg.unique_token AS guest_token,
      rg.name,
      rg.invitation_number,
      rg.rsvp_status,
      rg.companion_count,
      rg.avatar_url,
      rg.check_in_status
    FROM public.reception_guests rg
    WHERE rg.reception_token = p_reception_token
      AND (
        v_trimmed = ''
        OR rg.name ILIKE '%' || v_trimmed || '%'
        OR rg.invitation_number ILIKE '%' || v_trimmed || '%'
      )
    LIMIT 20
  ) AS guest_row;

  RETURN v_results;
END;
$$;

-- ---------------------------------------------------------------------------
-- Get a single guest (validates reception token scope)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_reception_guest(
  p_reception_token UUID,
  p_guest_token UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSON;
BEGIN
  PERFORM public.seed_reception_demo_guests(p_reception_token);

  SELECT json_build_object(
    'guest_token', rg.unique_token,
    'name', rg.name,
    'invitation_number', rg.invitation_number,
    'rsvp_status', rg.rsvp_status,
    'companion_count', rg.companion_count,
    'avatar_url', rg.avatar_url,
    'check_in_status', rg.check_in_status,
    'checked_in_at', rg.checked_in_at
  )
  INTO v_result
  FROM public.reception_guests rg
  WHERE rg.reception_token = p_reception_token
    AND rg.unique_token = p_guest_token;

  RETURN v_result;
END;
$$;

-- ---------------------------------------------------------------------------
-- Register guest arrival (reception-scoped check-in)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.register_reception_guest_arrival(
  p_reception_token UUID,
  p_guest_token UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_guest public.reception_guests;
BEGIN
  SELECT * INTO v_guest
  FROM public.reception_guests
  WHERE reception_token = p_reception_token
    AND unique_token = p_guest_token
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN json_build_object('success', FALSE, 'error', 'invalid_guest');
  END IF;

  IF v_guest.check_in_status = 'checked_in' THEN
    RETURN json_build_object(
      'success', FALSE,
      'error', 'already_checked_in',
      'guest_token', v_guest.unique_token,
      'check_in_status', v_guest.check_in_status,
      'checked_in_at', v_guest.checked_in_at
    );
  END IF;

  UPDATE public.reception_guests
  SET
    check_in_status = 'checked_in',
    checked_in_at = NOW()
  WHERE id = v_guest.id
  RETURNING * INTO v_guest;

  PERFORM public.refresh_reception_session_counts(p_reception_token);

  RETURN json_build_object(
    'success', TRUE,
    'guest_token', v_guest.unique_token,
    'check_in_status', v_guest.check_in_status,
    'checked_in_at', v_guest.checked_in_at
  );
END;
$$;

-- Update session loader to refresh counts on read
CREATE OR REPLACE FUNCTION public.get_reception_session(p_token UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSON;
BEGIN
  PERFORM public.seed_reception_demo_guests(p_token);
  PERFORM public.refresh_reception_session_counts(p_token);

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

GRANT EXECUTE ON FUNCTION public.seed_reception_demo_guests(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.refresh_reception_session_counts(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.search_reception_guests(UUID, TEXT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_reception_guest(UUID, UUID) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.register_reception_guest_arrival(UUID, UUID) TO anon, authenticated, service_role;
