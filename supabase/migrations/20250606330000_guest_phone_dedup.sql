-- Normalize phone digits for deduplication + idempotent public registration

CREATE OR REPLACE FUNCTION public.normalize_phone_digits(p_phone TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT NULLIF(regexp_replace(COALESCE(p_phone, ''), '[^0-9]', '', 'g'), '');
$$;

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
  v_phone_digits TEXT;
  v_source TEXT;
  v_is_vip BOOLEAN;
  v_table_number TEXT;
  v_companion_count INT;
  v_guest_token UUID;
  v_invitation_number TEXT;
  v_seq INTEGER;
  v_results JSONB := '[]'::JSONB;
  v_skipped JSONB := '[]'::JSONB;
  v_seen_phones TEXT[] := ARRAY[]::TEXT[];
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

    v_phone_digits := public.normalize_phone_digits(v_phone);

    IF v_phone_digits IS NULL THEN
      CONTINUE;
    END IF;

    IF v_phone_digits = ANY(v_seen_phones) THEN
      v_skipped := v_skipped || jsonb_build_array(
        jsonb_build_object('name', v_name, 'phone', v_phone, 'reason', 'duplicate_in_batch')
      );
      CONTINUE;
    END IF;

    IF EXISTS (
      SELECT 1
      FROM public.reception_guests rg
      WHERE rg.reception_token = p_reception_token
        AND public.normalize_phone_digits(rg.phone_number) = v_phone_digits
    ) THEN
      v_skipped := v_skipped || jsonb_build_array(
        jsonb_build_object('name', v_name, 'phone', v_phone, 'reason', 'duplicate_existing')
      );
      CONTINUE;
    END IF;

    v_seen_phones := array_append(v_seen_phones, v_phone_digits);

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
    'created_count', jsonb_array_length(v_results),
    'skipped_duplicates', v_skipped,
    'skipped_count', jsonb_array_length(v_skipped)
  );
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
  v_phone_digits TEXT;
  v_request public.guest_registration_requests;
BEGIN
  IF v_name IS NULL OR v_phone IS NULL THEN
    RETURN json_build_object('success', FALSE, 'error', 'invalid_input');
  END IF;

  v_phone_digits := public.normalize_phone_digits(v_phone);

  IF v_phone_digits IS NULL THEN
    RETURN json_build_object('success', FALSE, 'error', 'invalid_input');
  END IF;

  SELECT token INTO v_reception_token
  FROM public.reception_sessions
  WHERE public_registration_token = p_public_token;

  IF v_reception_token IS NULL THEN
    RETURN json_build_object('success', FALSE, 'error', 'invalid_token');
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.reception_guests rg
    WHERE rg.reception_token = v_reception_token
      AND public.normalize_phone_digits(rg.phone_number) = v_phone_digits
  ) THEN
    RETURN json_build_object('success', FALSE, 'error', 'already_registered');
  END IF;

  SELECT * INTO v_request
  FROM public.guest_registration_requests
  WHERE reception_token = v_reception_token
    AND public.normalize_phone_digits(phone) = v_phone_digits
  ORDER BY created_at DESC
  LIMIT 1;

  IF FOUND THEN
    IF v_request.status = 'pending' THEN
      RETURN json_build_object(
        'success', TRUE,
        'request_id', v_request.id,
        'already_submitted', TRUE
      );
    END IF;

    RETURN json_build_object('success', FALSE, 'error', 'already_submitted');
  END IF;

  INSERT INTO public.guest_registration_requests (reception_token, name, phone)
  VALUES (v_reception_token, v_name, v_phone)
  RETURNING * INTO v_request;

  RETURN json_build_object(
    'success', TRUE,
    'request_id', v_request.id,
    'already_submitted', FALSE
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
  v_qr_payload TEXT;
  v_seq INTEGER;
  v_phone_digits TEXT;
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

  v_phone_digits := public.normalize_phone_digits(v_request.phone);

  IF EXISTS (
    SELECT 1
    FROM public.reception_guests rg
    WHERE rg.reception_token = p_reception_token
      AND public.normalize_phone_digits(rg.phone_number) = v_phone_digits
  ) THEN
    UPDATE public.guest_registration_requests
    SET status = 'declined', reviewed_at = NOW()
    WHERE id = p_request_id
    RETURNING * INTO v_request;

    RETURN json_build_object('success', FALSE, 'error', 'duplicate_guest');
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

GRANT EXECUTE ON FUNCTION public.normalize_phone_digits(TEXT) TO anon, authenticated, service_role;
