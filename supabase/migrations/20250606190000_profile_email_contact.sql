-- Profile contact: email column + require email or phone

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email TEXT;

UPDATE public.profiles p
SET email = NULLIF(TRIM(u.email), '')
FROM auth.users u
WHERE p.id = u.id
  AND (p.email IS NULL OR TRIM(p.email) = '');

UPDATE public.profiles p
SET phone = NULLIF(TRIM(COALESCE(p.phone, u.phone)), '')
FROM auth.users u
WHERE p.id = u.id
  AND (p.phone IS NULL OR TRIM(p.phone) = '');

UPDATE public.profiles p
SET email = NULLIF(TRIM(u.email), '')
FROM auth.users u
WHERE p.id = u.id
  AND p.email IS NULL
  AND p.phone IS NULL
  AND u.email IS NOT NULL;

UPDATE public.profiles p
SET phone = NULLIF(TRIM(u.phone), '')
FROM auth.users u
WHERE p.id = u.id
  AND p.email IS NULL
  AND p.phone IS NULL
  AND u.phone IS NOT NULL;

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_email_or_phone_required;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_email_or_phone_required
  CHECK (
    NULLIF(TRIM(COALESCE(email, '')), '') IS NOT NULL
    OR NULLIF(TRIM(COALESCE(phone, '')), '') IS NOT NULL
  );

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email TEXT;
  v_phone TEXT;
BEGIN
  v_email := NULLIF(TRIM(COALESCE(NEW.email, '')), '');
  v_phone := NULLIF(TRIM(COALESCE(NEW.phone, '')), '');

  IF v_email IS NULL AND v_phone IS NULL THEN
    RAISE EXCEPTION 'Profile requires email or phone';
  END IF;

  INSERT INTO public.profiles (id, full_name, email, phone, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email),
    v_email,
    v_phone,
    COALESCE(
      (NEW.raw_user_meta_data ->> 'role')::public.user_role,
      'host'::public.user_role
    )
  );
  RETURN NEW;
END;
$$;

COMMENT ON COLUMN public.profiles.email IS
  'Primary contact email when available (e.g. OAuth). At least one of email or phone is required.';
