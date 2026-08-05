-- Fix infinite recursion in RLS policies.
--
-- The policies added in 20260727210000_add_roles.sql used
--   EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = '...')
-- inside policies ON public.profiles itself.  Every SELECT on profiles triggers
-- those policies, which SELECT profiles again → infinite recursion → 500 error.
--
-- The correct pattern is to call get_user_role() which is SECURITY DEFINER and
-- therefore bypasses RLS when it queries profiles internally.

-- ── profiles ────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "admins read all profiles"       ON public.profiles;
DROP POLICY IF EXISTS "super_admin update all profiles" ON public.profiles;

-- Admins/super-admins can read every profile row
CREATE POLICY "admins read all profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (get_user_role() IN ('admin', 'super_admin'));

-- Only super-admins can update any profile row (e.g. change roles)
CREATE POLICY "super_admin update all profiles" ON public.profiles
  FOR UPDATE TO authenticated
  USING      (get_user_role() = 'super_admin')
  WITH CHECK (get_user_role() = 'super_admin');

-- ── incidents ────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "admins read all incidents"   ON public.incidents;
DROP POLICY IF EXISTS "admins update all incidents" ON public.incidents;

CREATE POLICY "admins read all incidents" ON public.incidents
  FOR SELECT TO authenticated
  USING (get_user_role() IN ('admin', 'super_admin'));

CREATE POLICY "admins update all incidents" ON public.incidents
  FOR UPDATE TO authenticated
  USING      (get_user_role() IN ('admin', 'super_admin'))
  WITH CHECK (get_user_role() IN ('admin', 'super_admin'));

-- ── evidence ─────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "admins read all evidence" ON public.evidence;

CREATE POLICY "admins read all evidence" ON public.evidence
  FOR SELECT TO authenticated
  USING (get_user_role() IN ('admin', 'super_admin'));

-- ── complaints ───────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "admins read all complaints" ON public.complaints;

CREATE POLICY "admins read all complaints" ON public.complaints
  FOR SELECT TO authenticated
  USING (get_user_role() IN ('admin', 'super_admin'));
