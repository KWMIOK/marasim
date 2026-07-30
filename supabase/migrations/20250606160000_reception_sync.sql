-- Real-time sync support: entrance-aware check-ins, audit logs, session timestamps

ALTER TABLE public.reception_sessions
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

CREATE TRIGGER reception_sessions_set_updated_at
  BEFORE UPDATE ON public.reception_sessions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.reception_check_in_logs (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reception_token   UUID NOT NULL REFERENCES public.reception_sessions (token) ON DELETE CASCADE,
  guest_id          UUID NOT NULL REFERENCES public.reception_guests (id) ON DELETE CASCADE,
  entrance_label    TEXT NOT NULL DEFAULT 'Main entrance',
  checked_in_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  is_duplicate      BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_reception_check_in_logs_token
  ON public.reception_check_in_logs (reception_token, checked_in_at DESC);

CREATE INDEX IF NOT EXISTS idx_reception_check_in_logs_guest
  ON public.reception_check_in_logs (guest_id, checked_in_at DESC);

ALTER TABLE public.reception_check_in_logs ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- List all guests for a reception session (sync / guest list)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.list_reception_guests(p_reception_token UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_results JSON;
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
      rg.check_in_status,
      rg.checked_in_at,
      (
        SELECT l.entrance_label
        FROM public.reception_check_in_logs l
        WHERE l.guest_id = rg.id
          AND l.is_duplicate = FALSE
        ORDER BY l.checked_in_at ASC
        LIMIT 1
      ) AS checked_in_entrance
    FROM public.reception_guests rg
    WHERE rg.reception_token = p_reception_token
    LIMIT 500
  ) AS guest_row;

  RETURN v_results;
END;
$$;

-- ---------------------------------------------------------------------------
-- Session payload includes updated_at for client sync
-- ---------------------------------------------------------------------------
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
    'not_arrived_guests', not_arrived_guests,
    'updated_at', updated_at
  )
  INTO result
  FROM public.reception_sessions
  WHERE token = p_token;

  RETURN result;
END;
$$;

-- ---------------------------------------------------------------------------
-- Entrance-aware, conflict-safe check-in (row lock prevents double arrival)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.register_reception_guest_arrival(
  p_reception_token UUID,
  p_guest_token UUID,
  p_entrance_label TEXT DEFAULT 'Main entrance'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_guest public.reception_guests;
  v_entrance TEXT := NULLIF(TRIM(COALESCE(p_entrance_label, '')), '');
  v_first_entrance TEXT;
BEGIN
  IF v_entrance IS NULL THEN
    v_entrance := 'Main entrance';
  END IF;

  SELECT * INTO v_guest
  FROM public.reception_guests
  WHERE reception_token = p_reception_token
    AND unique_token = p_guest_token
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN json_build_object('success', FALSE, 'error', 'invalid_guest');
  END IF;

  IF v_guest.check_in_status = 'checked_in' THEN
    SELECT l.entrance_label
    INTO v_first_entrance
    FROM public.reception_check_in_logs l
    WHERE l.guest_id = v_guest.id
      AND l.is_duplicate = FALSE
    ORDER BY l.checked_in_at ASC
    LIMIT 1;

    INSERT INTO public.reception_check_in_logs (
      reception_token,
      guest_id,
      entrance_label,
      is_duplicate
    )
    VALUES (
      p_reception_token,
      v_guest.id,
      v_entrance,
      TRUE
    );

    RETURN json_build_object(
      'success', FALSE,
      'error', 'already_checked_in',
      'guest_token', v_guest.unique_token,
      'check_in_status', v_guest.check_in_status,
      'checked_in_at', v_guest.checked_in_at,
      'checked_in_entrance', COALESCE(v_first_entrance, v_entrance)
    );
  END IF;

  UPDATE public.reception_guests
  SET
    check_in_status = 'checked_in',
    checked_in_at = NOW()
  WHERE id = v_guest.id
  RETURNING * INTO v_guest;

  INSERT INTO public.reception_check_in_logs (
    reception_token,
    guest_id,
    entrance_label,
    is_duplicate
  )
  VALUES (
    p_reception_token,
    v_guest.id,
    v_entrance,
    FALSE
  );

  PERFORM public.refresh_reception_session_counts(p_reception_token);

  RETURN json_build_object(
    'success', TRUE,
    'guest_token', v_guest.unique_token,
    'check_in_status', v_guest.check_in_status,
    'checked_in_at', v_guest.checked_in_at,
    'checked_in_entrance', v_entrance
  );
END;
$$;

-- Keep search in sync with richer guest payload
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
      rg.check_in_status,
      rg.checked_in_at,
      (
        SELECT l.entrance_label
        FROM public.reception_check_in_logs l
        WHERE l.guest_id = rg.id
          AND l.is_duplicate = FALSE
        ORDER BY l.checked_in_at ASC
        LIMIT 1
      ) AS checked_in_entrance
    FROM public.reception_guests rg
    WHERE rg.reception_token = p_reception_token
      AND (
        v_trimmed = ''
        OR rg.name ILIKE '%' || v_trimmed || '%'
        OR rg.invitation_number ILIKE '%' || v_trimmed || '%'
      )
    LIMIT 500
  ) AS guest_row;

  RETURN v_results;
END;
$$;

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
    'checked_in_at', rg.checked_in_at,
    'checked_in_entrance', (
      SELECT l.entrance_label
      FROM public.reception_check_in_logs l
      WHERE l.guest_id = rg.id
        AND l.is_duplicate = FALSE
      ORDER BY l.checked_in_at ASC
      LIMIT 1
    )
  )
  INTO v_result
  FROM public.reception_guests rg
  WHERE rg.reception_token = p_reception_token
    AND rg.unique_token = p_guest_token;

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.list_reception_guests(UUID) TO anon, authenticated, service_role;
