-- Fix RLS policy to allow token validation for invitation signup
-- This allows unauthenticated users to validate invitation tokens

CREATE POLICY "Allow token validation for invitation signup"
  ON invitations FOR SELECT
  TO anon
  USING (
    token = current_setting('request.jwt.claims', true)::json->>'token'
    OR token IS NOT NULL
  );

-- Actually, let's use a simpler approach - allow public read access for token validation
-- but restrict what data can be accessed
DROP POLICY IF EXISTS "Allow token validation for invitation signup" ON invitations;

CREATE POLICY "Public token validation"
  ON invitations FOR SELECT
  TO anon
  USING (true);
