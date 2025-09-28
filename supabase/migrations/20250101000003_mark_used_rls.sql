-- Allow anonymous users to mark invitations as used during signup
CREATE POLICY "Anonymous mark invitation used"
  ON invitations FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (used = true);
