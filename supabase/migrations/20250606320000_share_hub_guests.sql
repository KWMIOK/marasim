-- Share hub bulk guest creation, optional guest metadata, slug-based public registration

ALTER TABLE public.reception_guests
  ADD COLUMN IF NOT EXISTS source TEXT
    CHECK (source IS NULL OR source IN ('manual', 'contacts', 'import', 'registration')),
  ADD COLUMN IF NOT EXISTS is_vip BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS table_number TEXT;

CREATE OR REPLACE FUNCTION public.create_reception_guests_bulk(
  p_reception_token UUID,
  p_guests JSONB
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_session public.reception_sessions;
  v_guest JSONB;
  v_name TEXT;
  v_phone TEXT;
  v_source TEXT;
  v_is_vip BOOLEAN;
  v_table_number TEXT;
  v_companion_count INT;
  v_guest_token UUID;
  v_invitation_number TEXT;
  v_seq INTEGER;
  v_results JSONB := '[]'::JSONB;
BEGIN
  SELECT * INTO v_session
  FROM public.reception_sessions
  WHERE token = p_reception_token;

  IF NOT FOUND THEN
    RETURN json_build_object('success', FALSE, 'error', 'invalid_session');
  END IF;

  IF p_guests IS NULL OR jsonb_typeof(p_guests) <> 'array' THEN
    RETURN json_build_object('success', FALSE, 'error', 'invalid_guests');
  END IF;

  SELECT COUNT(*) INTO v_seq
  FROM public.reception_guests
  WHERE reception_token = p_reception_token;

  FOR v_guest IN SELECT * FROM jsonb_array_elements(p_guests)
  LOOP
    v_name := NULLIF(TRIM(v_guest->>'name'), '');
    v_phone := NULLIF(TRIM(v_guest->>'phone'), '');

    IF v_name IS NULL OR v_phone IS NULL THEN
      CONTINUE;
    END IF;

    v_source := NULLIF(TRIM(v_guest->>'source'), '');
    IF v_source IS NOT NULL AND v_source NOT IN ('manual', 'contacts', 'import', 'registration') THEN
      v_source := NULL;
    END IF;

    v_is_vip := COALESCE((v_guest->>'is_vip')::BOOLEAN, FALSE);
    v_table_number := NULLIF(TRIM(v_guest->>'table_number'), '');
    v_companion_count := GREATEST(COALESCE((v_guest->>'companion_count')::INT, 0), 0);

    v_seq := v_seq + 1;
    v_guest_token := gen_random_uuid();
    v_invitation_number := 'INV-' || LPAD(v_seq::TEXT, 4, '0');

    INSERT INTO public.reception_guests (
      reception_token,
      name,
      phone_number,
      invitation_number,
      unique_token,
      rsvp_status,
      companion_count,
      source,
      is_vip,
      table_number
    )
    VALUES (
      p_reception_token,
      v_name,
      v_phone,
      v_invitation_number,
      v_guest_token,
      'not_opened',
      v_companion_count,
      v_source,
      v_is_vip,
      v_table_number
    );

    v_results := v_results || jsonb_build_array(
      jsonb_build_object(
        'name', v_name,
        'phone', v_phone,
        'guest_token', v_guest_token,
        'invitation_number', v_invitation_number,
        'guest_url_path',
          CASE
            WHEN v_session.event_slug IS NOT NULL
              THEN '/e/' || v_session.event_slug || '/' || v_guest_token::TEXT
            ELSE NULL
          END
      )
    );
  END LOOP;

  PERFORM public.refresh_reception_session_counts(p_reception_token);

  RETURN json_build_object(
    'success', TRUE,
    'guests', v_results,
    'created_count', jsonb_array_length(v_results)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_public_registration_event_by_slug(p_event_slug TEXT)
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
    'occasion', rs.occasion,
    'public_registration_token', rs.public_registration_token
  )
  INTO result
  FROM public.reception_sessions rs
  WHERE rs.event_slug = NULLIF(TRIM(p_event_slug), '');

  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.submit_guest_registration_request_by_slug(
  p_event_slug TEXT,
  p_name TEXT,
  p_phone TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_public_token UUID;
BEGIN
  SELECT public_registration_token INTO v_public_token
  FROM public.reception_sessions
  WHERE event_slug = NULLIF(TRIM(p_event_slug), '');

  IF v_public_token IS NULL THEN
    RETURN json_build_object('success', FALSE, 'error', 'invalid_slug');
  END IF;

  RETURN public.submit_guest_registration_request(v_public_token, p_name, p_phone);
END;
$$;

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
      rg.phone_number,
      rg.invitation_number,
      rg.rsvp_status,
      rg.companion_count,
      rg.avatar_url,
      rg.check_in_status,
      rg.checked_in_at,
      rg.source,
      rg.is_vip,
      rg.table_number,
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
  v_qr_payload TEXT;
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
  v_qr_payload := 'marasim:guest:' || v_guest_token::TEXT;

  INSERT INTO public.reception_guests (
    reception_token,
    name,
    phone_number,
    invitation_number,
    unique_token,
    rsvp_status,
    companion_count,
    source
  )
  VALUES (
    p_reception_token,
    v_request.name,
    v_request.phone,
    v_invitation_number,
    v_guest_token,
    'confirmed',
    0,
    'registration'
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
    'qr_payload', v_qr_payload,
    'phone', v_request.phone,
    'name', v_request.name
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_reception_guests_bulk(UUID, JSONB) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_public_registration_event_by_slug(TEXT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.submit_guest_registration_request_by_slug(TEXT, TEXT, TEXT) TO anon, authenticated, service_role;
