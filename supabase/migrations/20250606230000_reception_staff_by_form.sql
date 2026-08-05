-- Lock reception access by submitted staff forms (not devices).
-- Returning staff re-enter the same details to bind a new browser/device.

ALTER TABLE public.reception_staff_devices
  DROP CONSTRAINT IF EXISTS reception_staff_devices_reception_token_device_id_key;

CREATE UNIQUE INDEX IF NOT EXISTS reception_staff_devices_token_national_id_idx
  ON public.reception_staff_devices (reception_token, national_id);

CREATE OR REPLACE FUNCTION public.check_reception_device_access(
  p_token UUID,
  p_device_id TEXT,
  p_host_device_id TEXT DEFAULT NULL,
  p_viewer_profile_id UUID DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

  IF NULLIF(TRIM(COALESCE(p_host_device_id, '')), '') IS NOT NULL
     AND EXISTS (
       SELECT 1 FROM public.reception_host_devices
       WHERE reception_token = p_token AND device_id = TRIM(p_host_device_id)
     ) THEN
    RETURN json_build_object('status', 'host');
  END IF;

  SELECT json_build_object(
    'full_name', full_name,
    'national_id', national_id,
    'phone', phone
  )
  INTO v_staff
  FROM public.reception_staff_devices
  WHERE reception_token = p_token AND device_id = TRIM(p_device_id)
  LIMIT 1;

  IF v_staff IS NOT NULL THEN
    RETURN json_build_object('status', 'registered', 'staff', v_staff);
  END IF;

  IF v_session.reception_staff_limit = 0 THEN
    RETURN json_build_object(
      'status', 'needs_registration',
      'staff_limit', 0,
      'slots_remaining', NULL
    );
  END IF;

  SELECT COUNT(*)::INTEGER INTO v_staff_count
  FROM public.reception_staff_devices
  WHERE reception_token = p_token;

  RETURN json_build_object(
    'status', 'needs_registration',
    'staff_limit', v_session.reception_staff_limit,
    'slots_remaining', GREATEST(v_session.reception_staff_limit - v_staff_count, 0)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.register_reception_staff_device(
  p_token UUID,
  p_device_id TEXT,
  p_full_name TEXT,
  p_national_id TEXT,
  p_phone TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_session public.reception_sessions%ROWTYPE;
  v_staff_count INTEGER;
  v_row public.reception_staff_devices%ROWTYPE;
  v_name TEXT := TRIM(p_full_name);
  v_national_id TEXT := TRIM(p_national_id);
  v_phone TEXT := TRIM(p_phone);
  v_device_id TEXT := TRIM(p_device_id);
BEGIN
  SELECT * INTO v_session FROM public.reception_sessions WHERE token = p_token;
  IF NOT FOUND THEN
    RETURN json_build_object('ok', false, 'error', 'invalid_session');
  END IF;

  IF NULLIF(v_device_id, '') IS NULL
     OR NULLIF(v_name, '') IS NULL
     OR NULLIF(v_national_id, '') IS NULL
     OR NULLIF(v_phone, '') IS NULL THEN
    RETURN json_build_object('ok', false, 'error', 'missing_fields');
  END IF;

  SELECT * INTO v_row
  FROM public.reception_staff_devices
  WHERE reception_token = p_token AND device_id = v_device_id;

  IF FOUND THEN
    RETURN json_build_object(
      'ok', true,
      'staff', json_build_object(
        'full_name', v_row.full_name,
        'national_id', v_row.national_id,
        'phone', v_row.phone
      )
    );
  END IF;

  SELECT * INTO v_row
  FROM public.reception_staff_devices
  WHERE reception_token = p_token AND national_id = v_national_id;

  IF FOUND THEN
    IF v_row.full_name = v_name AND v_row.phone = v_phone THEN
      UPDATE public.reception_staff_devices
      SET device_id = v_device_id
      WHERE id = v_row.id
      RETURNING * INTO v_row;

      RETURN json_build_object(
        'ok', true,
        'staff', json_build_object(
          'full_name', v_row.full_name,
          'national_id', v_row.national_id,
          'phone', v_row.phone
        )
      );
    END IF;

    RETURN json_build_object('ok', false, 'error', 'identity_mismatch');
  END IF;

  IF v_session.reception_staff_limit > 0 THEN
    SELECT COUNT(*)::INTEGER INTO v_staff_count
    FROM public.reception_staff_devices
    WHERE reception_token = p_token;

    IF v_staff_count >= v_session.reception_staff_limit THEN
      RETURN json_build_object('ok', false, 'error', 'staff_limit_reached');
    END IF;
  END IF;

  INSERT INTO public.reception_staff_devices (
    reception_token,
    device_id,
    full_name,
    national_id,
    phone
  )
  VALUES (
    p_token,
    v_device_id,
    v_name,
    v_national_id,
    v_phone
  )
  RETURNING * INTO v_row;

  RETURN json_build_object(
    'ok', true,
    'staff', json_build_object(
      'full_name', v_row.full_name,
      'national_id', v_row.national_id,
      'phone', v_row.phone
    )
  );
END;
$$;
