-- Add bio column to users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS bio TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.users.bio IS 'User bio/description, max 250 characters';
