-- ============================================================
-- SUPABASE DATABASE SETUP FOR USER AUTHENTICATION
-- ============================================================
-- This script creates the necessary table, function, and trigger
-- to automatically sync Supabase Auth users with your public schema
-- ============================================================

-- Step 1: Create the public.usuario table
-- This table will store additional user information beyond what's in auth.users
CREATE TABLE IF NOT EXISTS public.usuario (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Step 2: Enable Row Level Security (RLS) on the usuario table
-- This is a security best practice in Supabase
ALTER TABLE public.usuario ENABLE ROW LEVEL SECURITY;

-- Step 3: Create RLS Policies
-- Allow users to read their own data
CREATE POLICY "Users can view their own profile"
  ON public.usuario
  FOR SELECT
  USING (auth.uid() = id);

-- Allow users to update their own data
CREATE POLICY "Users can update their own profile"
  ON public.usuario
  FOR UPDATE
  USING (auth.uid() = id);

-- Allow authenticated users to insert their own profile (needed for the trigger)
CREATE POLICY "Users can insert their own profile"
  ON public.usuario
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Step 4: Create the function that will be called by the trigger
-- This function extracts user metadata and inserts it into public.usuario
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.usuario (id, username, first_name, last_name, email)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'username',
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 5: Create the trigger
-- This trigger fires after a new user is created in auth.users
-- and automatically calls the handle_new_user() function
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- OPTIONAL: Create indexes for better query performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_usuario_username ON public.usuario(username);
CREATE INDEX IF NOT EXISTS idx_usuario_email ON public.usuario(email);

-- ============================================================
-- VERIFICATION QUERIES (Run these to test)
-- ============================================================
-- After creating a user, verify the data:
-- SELECT * FROM public.usuario;
-- SELECT * FROM auth.users;
