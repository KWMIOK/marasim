-- On hosted Supabase, pgcrypto (gen_salt/crypt) lives in the extensions schema.
-- Functions that hash passcodes/OTPs must include extensions in search_path.

ALTER FUNCTION public.store_reception_staff_otp(UUID, TEXT, TEXT, TEXT, TIMESTAMPTZ)
  SET search_path TO public, extensions;

ALTER FUNCTION public.verify_reception_staff_otp(UUID, TEXT, TEXT, TEXT, TEXT)
  SET search_path TO public, extensions;

ALTER FUNCTION public.login_reception_staff_emergency(UUID, TEXT, TEXT, TEXT, TEXT)
  SET search_path TO public, extensions;

ALTER FUNCTION public.set_reception_emergency_passcode(UUID, UUID, TEXT)
  SET search_path TO public, extensions;

ALTER FUNCTION public.create_reception_session(UUID, TEXT, DATE, TEXT, TEXT, UUID, BOOLEAN, INTEGER, UUID, TEXT, TEXT, TEXT, DOUBLE PRECISION, DOUBLE PRECISION, TEXT)
  SET search_path TO public, extensions;
