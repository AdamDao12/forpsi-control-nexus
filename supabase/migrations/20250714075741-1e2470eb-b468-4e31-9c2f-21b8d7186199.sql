-- Fix infinite recursion in profiles table policies (part 2)
-- First, drop the problematic policies if they exist
DROP POLICY IF EXISTS "Admins can view all users" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- Create new non-recursive policies
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth_id = auth.uid());

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth_id = auth.uid());

-- Create a security definer function to check admin role safely
CREATE OR REPLACE FUNCTION public.is_admin_user(user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.profiles 
    WHERE auth_id = user_id 
    AND role = 'admin'
  );
$$;

-- Use the function in admin policy to avoid recursion
CREATE POLICY "Admins can view all users" 
ON public.profiles 
FOR SELECT 
USING (public.is_admin_user(auth.uid()));

-- Add node reservations table for tracking node assignments
CREATE TABLE IF NOT EXISTS public.node_reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  node_id text NOT NULL,
  user_id uuid NOT NULL REFERENCES public.profiles(auth_id),
  order_id uuid NOT NULL REFERENCES public.orders(id),
  reserved_at timestamp with time zone DEFAULT now(),
  status text DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')),
  UNIQUE(node_id, user_id)
);

-- Enable RLS on node_reservations
ALTER TABLE public.node_reservations ENABLE ROW LEVEL SECURITY;

-- Policies for node_reservations
CREATE POLICY "Admins can manage node reservations" 
ON public.node_reservations 
FOR ALL 
USING (public.is_admin_user(auth.uid()));

CREATE POLICY "Users can view their own reservations" 
ON public.node_reservations 
FOR SELECT 
USING (user_id = auth.uid());