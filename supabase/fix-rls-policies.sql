-- ============================================================================
-- Fix: Remove Infinite Recursion in RLS Policies
-- ============================================================================
-- The issue: RLS policies were querying profiles table while checking 
-- permissions on profiles table, causing infinite recursion.
-- 
-- Solution: Use a simpler policy structure that doesn't cause recursion
-- ============================================================================

BEGIN;

-- Drop existing policies
DROP POLICY IF EXISTS "profiles_select_own_or_admin" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own_or_admin" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_admin_only" ON public.profiles;

-- Create new policies without recursion

-- Policy: Users can SELECT their own profile
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Policy: Users can UPDATE their own profile
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Policy: Users can INSERT their own profile (for direct client inserts)
CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Policy: Users can DELETE their own profile
CREATE POLICY "profiles_delete_own" ON public.profiles
  FOR DELETE
  USING (auth.uid() = id);

COMMIT;
