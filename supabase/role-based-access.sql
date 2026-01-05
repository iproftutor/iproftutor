-- ============================================================================
-- Role-Based Access Control Setup for iProf Tutor
-- ============================================================================
-- This script sets up the role-based access system with four roles:
-- - student (default)
-- - parent
-- - teacher
-- - admin
--
-- Run this SQL in your Supabase SQL Editor (production database)
-- ============================================================================

BEGIN;

-- Step 1: Create enum type for user roles
CREATE TYPE public.user_role AS ENUM ('student', 'parent', 'teacher', 'admin');

-- Step 2: Create profiles table
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  role public.user_role NOT NULL DEFAULT 'student',
  full_name text,
  avatar_url text,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Step 3: Create index for faster role lookups
CREATE INDEX profiles_role_idx ON public.profiles (role);

-- Step 4: Create function to handle new user signups
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Create a default profile for the new user
  -- Default role is 'student', but you can customize this based on user_metadata
  INSERT INTO public.profiles (id, role, full_name, created_at, updated_at)
  VALUES (
    NEW.id,
    COALESCE(
      (NEW.raw_user_meta_data->>'role')::public.user_role,
      'student'
    ),
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    now(),
    now()
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Step 5: Create trigger to automatically create profiles on user signup
CREATE TRIGGER create_profile_for_new_user
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_auth_user();

-- Step 6: Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Step 7: Create RLS policies

-- Policy: Allow users to SELECT their own profile, admins can SELECT any profile
CREATE POLICY "profiles_select_own_or_admin" ON public.profiles
  FOR SELECT
  USING (
    auth.uid() = id
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- Policy: Allow users to UPDATE their own profile, admins can UPDATE any profile
CREATE POLICY "profiles_update_own_or_admin" ON public.profiles
  FOR UPDATE
  USING (
    auth.uid() = id
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  )
  WITH CHECK (
    auth.uid() = id
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- Policy: Allow users to INSERT their own profile (for direct client inserts)
CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Policy: Allow admins to DELETE any profile
CREATE POLICY "profiles_delete_admin_only" ON public.profiles
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- Step 8: Create function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Step 9: Create trigger to automatically update updated_at
CREATE TRIGGER set_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

COMMIT;

-- ============================================================================
-- Post-Installation Notes
-- ============================================================================
--
-- 1. New users will automatically get a 'student' role by default
--
-- 2. To manually create an admin user, run:
--    UPDATE public.profiles SET role = 'admin' 
--    WHERE id = 'user-uuid-here';
--
-- 3. To set role during signup (server-side), pass it in user_metadata:
--    supabase.auth.signUp({
--      email: 'user@example.com',
--      password: 'password',
--      options: {
--        data: {
--          role: 'teacher',
--          full_name: 'John Doe'
--        }
--      }
--    })
--
-- 4. The app will automatically route users based on their role:
--    - student  → /student/dashboard
--    - parent   → /parents/dashboard
--    - teacher  → /teachers/dashboard
--    - admin    → /admin/dashboard
--
-- ============================================================================
