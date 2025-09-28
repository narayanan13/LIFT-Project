-- Add role field to invitations table
ALTER TABLE invitations ADD COLUMN role text DEFAULT 'user' CHECK (role IN ('admin', 'user'));

-- Update existing invitations to have 'user' role (alumni)
UPDATE invitations SET role = 'user' WHERE role IS NULL;

-- Make role NOT NULL after setting defaults
ALTER TABLE invitations ALTER COLUMN role SET NOT NULL;
