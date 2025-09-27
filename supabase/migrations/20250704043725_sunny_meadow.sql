/*
  # Alumni Network Database Schema

  1. New Tables
    - `profiles` - User profiles linked to auth.users
    - `contributions` - Alumni contributions tracking
    - `expenses` - Fund expenses tracking  
    - `invitations` - Email invitation management

  2. Security
    - Enable RLS on all tables
    - Add policies for role-based access
    - Create helper functions for user role checking

  3. Features
    - Automatic profile creation on user signup
    - Comprehensive audit trails
    - Secure invitation token system
*/

-- Create a table for public profiles
CREATE TABLE IF NOT EXISTS profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL PRIMARY KEY,
  full_name text,
  email text UNIQUE,
  role text DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Set up Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by authenticated users"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins can update any profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Helper function to get user role
CREATE OR REPLACE FUNCTION get_user_role(user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_role text;
BEGIN
  SELECT role INTO user_role FROM public.profiles WHERE id = user_id;
  RETURN COALESCE(user_role, 'user');
END;
$$;

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN get_user_role(user_id) = 'admin';
END;
$$;

-- This trigger automatically creates a profile entry when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role)
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email,
    COALESCE(new.raw_user_meta_data->>'role', 'user')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Create contributions table
CREATE TABLE IF NOT EXISTS contributions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  amount numeric NOT NULL CHECK (amount > 0),
  date date NOT NULL,
  notes text,
  tags text,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Set up RLS for contributions
ALTER TABLE contributions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Contributions are viewable by authenticated users"
  ON contributions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert their own contributions"
  ON contributions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can insert contributions for any user"
  ON contributions FOR INSERT
  TO authenticated
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Users can update their own contributions"
  ON contributions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can update any contribution"
  ON contributions FOR UPDATE
  TO authenticated
  USING (is_admin(auth.uid()));

CREATE POLICY "Users can delete their own contributions"
  ON contributions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can delete any contribution"
  ON contributions FOR DELETE
  TO authenticated
  USING (is_admin(auth.uid()));

-- Create expenses table
CREATE TABLE IF NOT EXISTS expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  amount numeric NOT NULL CHECK (amount > 0),
  purpose text NOT NULL,
  description text,
  date date NOT NULL,
  category text,
  event text,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Set up RLS for expenses
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Expenses are viewable by authenticated users"
  ON expenses FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert expenses"
  ON expenses FOR INSERT
  TO authenticated
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can update expenses"
  ON expenses FOR UPDATE
  TO authenticated
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can delete expenses"
  ON expenses FOR DELETE
  TO authenticated
  USING (is_admin(auth.uid()));

-- Create invitations table
CREATE TABLE IF NOT EXISTS invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  token text UNIQUE NOT NULL,
  invited_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  used boolean DEFAULT false,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Set up RLS for invitations
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Invitations are viewable by admins"
  ON invitations FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can insert invitations"
  ON invitations FOR INSERT
  TO authenticated
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can update invitations"
  ON invitations FOR UPDATE
  TO authenticated
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can delete invitations"
  ON invitations FOR DELETE
  TO authenticated
  USING (is_admin(auth.uid()));

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_contributions_user_id ON contributions(user_id);
CREATE INDEX IF NOT EXISTS idx_contributions_date ON contributions(date);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);
CREATE INDEX IF NOT EXISTS idx_invitations_token ON invitations(token);
CREATE INDEX IF NOT EXISTS idx_invitations_email ON invitations(email);
CREATE INDEX IF NOT EXISTS idx_invitations_expires_at ON invitations(expires_at);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_contributions_updated_at ON contributions;
CREATE TRIGGER update_contributions_updated_at
  BEFORE UPDATE ON contributions
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_expenses_updated_at ON expenses;
CREATE TRIGGER update_expenses_updated_at
  BEFORE UPDATE ON expenses
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Insert demo users (only if they don't exist)
DO $$
BEGIN
  -- Insert admin user if not exists
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin@alumni.org') THEN
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      recovery_sent_at,
      last_sign_in_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      'admin@alumni.org',
      crypt('password', gen_salt('bf')),
      now(),
      now(),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{"full_name":"John Admin","role":"admin"}',
      now(),
      now(),
      '',
      '',
      '',
      ''
    );
  END IF;

  -- Insert regular user if not exists
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'user@alumni.org') THEN
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      recovery_sent_at,
      last_sign_in_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      'user@alumni.org',
      crypt('password', gen_salt('bf')),
      now(),
      now(),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{"full_name":"Jane Alumni","role":"user"}',
      now(),
      now(),
      '',
      '',
      '',
      ''
    );
  END IF;
END $$;