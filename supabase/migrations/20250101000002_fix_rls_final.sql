-- Final fix for RLS policy to allow anonymous token validation
-- This allows unauthenticated users to validate invitation tokens

-- Drop any existing conflicting policies
DROP POLICY IF EXISTS "Allow token validation for invitation signup" ON invitations;
DROP POLICY IF EXISTS "Public token validation" ON invitations;
DROP POLICY IF EXISTS "Anonymous users can validate invitation tokens" ON invitations;
DROP POLICY IF EXISTS "Anonymous token validation" ON invitations;

-- Add policy for anonymous token validation
CREATE POLICY "Anonymous token validation"
  ON invitations FOR SELECT
  TO anon
  USING (true);
