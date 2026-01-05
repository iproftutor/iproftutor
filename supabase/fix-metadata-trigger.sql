-- Fix: Update the trigger to copy ALL user metadata to profiles.metadata
-- This ensures parent_email and other signup data is preserved

BEGIN;

-- Drop and recreate the trigger function to include metadata
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Create a default profile for the new user
  -- Copy role, full_name, and ALL raw_user_meta_data to metadata field
  INSERT INTO public.profiles (id, role, full_name, metadata, created_at, updated_at)
  VALUES (
    NEW.id,
    COALESCE(
      (NEW.raw_user_meta_data->>'role')::public.user_role,
      'student'
    ),
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.raw_user_meta_data, -- Copy all metadata including parent_email
    now(),
    now()
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

COMMIT;
