-- Vendor & crew management: master pass QR codes with group headcounts

CREATE TABLE IF NOT EXISTS public.reception_vendor_teams (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reception_token   UUID NOT NULL REFERENCES public.reception_sessions (token) ON DELETE CASCADE,
  team_name         TEXT NOT NULL,
  vendor_type       TEXT NOT NULL,
  lead_phone        TEXT NOT NULL,
  allowed_headcount INTEGER NOT NULL CHECK (allowed_headcount > 0 AND allowed_headcount <= 500),
  checked_in_count  INTEGER NOT NULL DEFAULT 0 CHECK (checked_in_count >= 0),
  master_token      UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  revoked_at        TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT reception_vendor_checked_in_lte_allowed CHECK (checked_in_count <= allowed_headcount)
);

CREATE INDEX IF NOT EXISTS reception_vendor_teams_token_idx
  ON public.reception_vendor_teams (reception_token);
CREATE INDEX IF NOT EXISTS reception_vendor_teams_master_token_idx
  ON public.reception_vendor_teams (master_token);

ALTER TABLE public.reception_vendor_teams ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.create_reception_vendor_team(
  p_reception_token UUID,
  p_host_profile_id UUID,
  p_team_name TEXT,
  p_vendor_type TEXT,
  p_lead_phone TEXT,
  p_allowed_headcount INTEGER
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_session public.reception_sessions%ROWTYPE;
  v_team public.reception_vendor_teams%ROWTYPE;
  v_headcount INTEGER;
BEGIN
  SELECT * INTO v_session FROM public.reception_sessions WHERE token = p_reception_token;
  IF NOT FOUND THEN
    RETURN json_build_object('ok', false, 'error', 'invalid_session');
  END IF;

  IF p_host_profile_id IS NULL OR v_session.host_profile_id IS DISTINCT FROM p_host_profile_id THEN
    RETURN json_build_object('ok', false, 'error', 'forbidden');
  END IF;

  IF NULLIF(TRIM(p_team_name), '') IS NULL
     OR NULLIF(TRIM(p_vendor_type), '') IS NULL
     OR NULLIF(TRIM(p_lead_phone), '') IS NULL THEN
    RETURN json_build_object('ok', false, 'error', 'missing_fields');
  END IF;

  v_headcount := GREATEST(1, LEAST(COALESCE(p_allowed_headcount, 0), 500));

  INSERT INTO public.reception_vendor_teams (
    reception_token,
    team_name,
    vendor_type,
    lead_phone,
    allowed_headcount
  )
  VALUES (
    p_reception_token,
    TRIM(p_team_name),
    TRIM(p_vendor_type),
    TRIM(p_lead_phone),
    v_headcount
  )
  RETURNING * INTO v_team;

  RETURN json_build_object(
    'ok', true,
    'team', json_build_object(
      'id', v_team.id,
      'team_name', v_team.team_name,
      'vendor_type', v_team.vendor_type,
      'lead_phone', v_team.lead_phone,
      'allowed_headcount', v_team.allowed_headcount,
      'checked_in_count', v_team.checked_in_count,
      'master_token', v_team.master_token,
      'created_at', v_team.created_at
    )
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.list_reception_vendor_teams_for_host(
  p_reception_token UUID,
  p_host_profile_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_session public.reception_sessions%ROWTYPE;
  v_total_teams INTEGER;
  v_total_allowed INTEGER;
  v_total_checked_in INTEGER;
BEGIN
  SELECT * INTO v_session FROM public.reception_sessions WHERE token = p_reception_token;
  IF NOT FOUND THEN
    RETURN json_build_object('ok', false, 'error', 'invalid_session');
  END IF;

  IF p_host_profile_id IS NULL OR v_session.host_profile_id IS DISTINCT FROM p_host_profile_id THEN
    RETURN json_build_object('ok', false, 'error', 'forbidden');
  END IF;

  SELECT
    COUNT(*)::INTEGER,
    COALESCE(SUM(allowed_headcount), 0)::INTEGER,
    COALESCE(SUM(checked_in_count), 0)::INTEGER
  INTO v_total_teams, v_total_allowed, v_total_checked_in
  FROM public.reception_vendor_teams
  WHERE reception_token = p_reception_token
    AND revoked_at IS NULL;

  RETURN json_build_object(
    'ok', true,
    'total_teams', v_total_teams,
    'total_allowed', v_total_allowed,
    'total_checked_in', v_total_checked_in,
    'teams', COALESCE(
      (
        SELECT json_agg(
          json_build_object(
            'id', vt.id,
            'team_name', vt.team_name,
            'vendor_type', vt.vendor_type,
            'lead_phone', vt.lead_phone,
            'allowed_headcount', vt.allowed_headcount,
            'checked_in_count', vt.checked_in_count,
            'master_token', vt.master_token,
            'created_at', vt.created_at
          )
          ORDER BY vt.created_at ASC
        )
        FROM public.reception_vendor_teams vt
        WHERE vt.reception_token = p_reception_token
          AND vt.revoked_at IS NULL
      ),
      '[]'::JSON
    )
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.revoke_reception_vendor_team(
  p_team_id UUID,
  p_host_profile_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_team public.reception_vendor_teams%ROWTYPE;
  v_session public.reception_sessions%ROWTYPE;
BEGIN
  SELECT * INTO v_team FROM public.reception_vendor_teams WHERE id = p_team_id;
  IF NOT FOUND THEN
    RETURN json_build_object('ok', false, 'error', 'not_found');
  END IF;

  SELECT * INTO v_session FROM public.reception_sessions WHERE token = v_team.reception_token;
  IF p_host_profile_id IS NULL OR v_session.host_profile_id IS DISTINCT FROM p_host_profile_id THEN
    RETURN json_build_object('ok', false, 'error', 'forbidden');
  END IF;

  UPDATE public.reception_vendor_teams
  SET revoked_at = NOW(), updated_at = NOW()
  WHERE id = p_team_id;

  RETURN json_build_object('ok', true);
END;
$$;

CREATE OR REPLACE FUNCTION public.get_vendor_master_pass(p_master_token UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_team public.reception_vendor_teams%ROWTYPE;
  v_session public.reception_sessions%ROWTYPE;
BEGIN
  SELECT * INTO v_team
  FROM public.reception_vendor_teams
  WHERE master_token = p_master_token
    AND revoked_at IS NULL;

  IF NOT FOUND THEN
    RETURN json_build_object('ok', false, 'error', 'not_found');
  END IF;

  SELECT * INTO v_session FROM public.reception_sessions WHERE token = v_team.reception_token;

  RETURN json_build_object(
    'ok', true,
    'pass', json_build_object(
      'team_name', v_team.team_name,
      'vendor_type', v_team.vendor_type,
      'allowed_headcount', v_team.allowed_headcount,
      'checked_in_count', v_team.checked_in_count,
      'master_token', v_team.master_token,
      'event_display_name', v_session.event_display_name,
      'event_date', v_session.event_date
    )
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_vendor_team_for_scan(p_master_token UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_team public.reception_vendor_teams%ROWTYPE;
BEGIN
  SELECT * INTO v_team
  FROM public.reception_vendor_teams
  WHERE master_token = p_master_token
    AND revoked_at IS NULL;

  IF NOT FOUND THEN
    RETURN json_build_object('ok', false, 'error', 'not_found');
  END IF;

  RETURN json_build_object(
    'ok', true,
    'team', json_build_object(
      'id', v_team.id,
      'reception_token', v_team.reception_token,
      'team_name', v_team.team_name,
      'vendor_type', v_team.vendor_type,
      'allowed_headcount', v_team.allowed_headcount,
      'checked_in_count', v_team.checked_in_count,
      'master_token', v_team.master_token
    )
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.adjust_vendor_checked_in(
  p_master_token UUID,
  p_delta INTEGER
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_team public.reception_vendor_teams%ROWTYPE;
  v_new_count INTEGER;
BEGIN
  IF p_delta IS NULL OR p_delta = 0 THEN
    RETURN json_build_object('ok', false, 'error', 'invalid_delta');
  END IF;

  SELECT * INTO v_team
  FROM public.reception_vendor_teams
  WHERE master_token = p_master_token
    AND revoked_at IS NULL
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN json_build_object('ok', false, 'error', 'not_found');
  END IF;

  v_new_count := v_team.checked_in_count + p_delta;

  IF v_new_count < 0 THEN
    RETURN json_build_object('ok', false, 'error', 'already_zero');
  END IF;

  IF v_new_count > v_team.allowed_headcount THEN
    RETURN json_build_object('ok', false, 'error', 'limit_exceeded');
  END IF;

  UPDATE public.reception_vendor_teams
  SET checked_in_count = v_new_count, updated_at = NOW()
  WHERE id = v_team.id;

  RETURN json_build_object(
    'ok', true,
    'checked_in_count', v_new_count,
    'allowed_headcount', v_team.allowed_headcount
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.check_in_all_vendor_remaining(p_master_token UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_team public.reception_vendor_teams%ROWTYPE;
BEGIN
  SELECT * INTO v_team
  FROM public.reception_vendor_teams
  WHERE master_token = p_master_token
    AND revoked_at IS NULL
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN json_build_object('ok', false, 'error', 'not_found');
  END IF;

  UPDATE public.reception_vendor_teams
  SET checked_in_count = allowed_headcount, updated_at = NOW()
  WHERE id = v_team.id;

  RETURN json_build_object(
    'ok', true,
    'checked_in_count', v_team.allowed_headcount,
    'allowed_headcount', v_team.allowed_headcount
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_reception_vendor_team(UUID, UUID, TEXT, TEXT, TEXT, INTEGER) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.list_reception_vendor_teams_for_host(UUID, UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.revoke_reception_vendor_team(UUID, UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_vendor_master_pass(UUID) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_vendor_team_for_scan(UUID) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.adjust_vendor_checked_in(UUID, INTEGER) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.check_in_all_vendor_remaining(UUID) TO anon, authenticated, service_role;
