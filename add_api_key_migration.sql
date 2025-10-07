-- Migration: Add API Key support for Chrome Extension
-- Run this in Supabase SQL Editor
-- Fixed version with correct function ordering

-- Step 1: Add api_key column to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS api_key TEXT UNIQUE;

-- Step 2: Add index for fast API key lookups
CREATE INDEX IF NOT EXISTS idx_users_api_key ON public.users(api_key);

-- Step 3: Function to generate a secure API key
CREATE OR REPLACE FUNCTION public.generate_api_key()
RETURNS TEXT 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_key TEXT;
BEGIN
  -- Generate a secure random API key (32 bytes = 64 hex characters)
  v_key := 'vgc_' || encode(gen_random_bytes(32), 'hex');
  RETURN v_key;
END;
$$;

-- Step 4: Function to create/regenerate API key for a user
CREATE OR REPLACE FUNCTION public.create_user_api_key(p_user_id UUID)
RETURNS TEXT 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_api_key TEXT;
BEGIN
  -- Generate new API key
  v_api_key := public.generate_api_key();
  
  -- Update user with new API key
  UPDATE public.users
  SET api_key = v_api_key
  WHERE id = p_user_id;
  
  RETURN v_api_key;
END;
$$;

-- Step 5: Function to get user by API key (for extension authentication)
CREATE OR REPLACE FUNCTION public.get_user_by_api_key(p_api_key TEXT)
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  subscription_tier TEXT,
  subscription_status TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    id as user_id,
    users.email,
    users.subscription_tier,
    users.subscription_status
  FROM public.users
  WHERE api_key = p_api_key
    AND subscription_status = 'active';
END;
$$;

-- Step 6: Grant execute permissions
GRANT EXECUTE ON FUNCTION public.generate_api_key() TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_user_api_key(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_by_api_key(TEXT) TO service_role;

-- Step 7: Add comments
COMMENT ON COLUMN public.users.api_key IS 'API key for Chrome extension authentication';
COMMENT ON FUNCTION public.generate_api_key() IS 'Generates a secure random API key';
COMMENT ON FUNCTION public.create_user_api_key(UUID) IS 'Creates or regenerates API key for a user';
COMMENT ON FUNCTION public.get_user_by_api_key(TEXT) IS 'Retrieves user information by API key';

-- Step 8: Test the functions (optional - you can run these to verify)
-- Uncomment to test:
-- SELECT public.generate_api_key();
-- SELECT public.create_user_api_key(auth.uid());

-- Migration complete!
-- You should see: "Success. No rows returned"
