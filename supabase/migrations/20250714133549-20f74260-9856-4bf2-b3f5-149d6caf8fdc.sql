-- Update profiles table to match user requirements
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS pelican_user_id integer;

-- Update orders table structure to match requirements
ALTER TABLE public.orders DROP COLUMN IF EXISTS forpsi_order_id;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS package text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS ram integer;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS cpu integer;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS disk integer;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS paid boolean DEFAULT false;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS expires_at date;
ALTER TABLE public.orders ALTER COLUMN id TYPE bigint;

-- Create nodes table to match user requirements
CREATE TABLE IF NOT EXISTS public.nodes (
  id integer PRIMARY KEY,
  name text,
  location_id integer,
  reserved_by uuid REFERENCES public.profiles(auth_id),
  created_at timestamp DEFAULT now()
);

-- Update servers table to match requirements  
ALTER TABLE public.servers ALTER COLUMN id TYPE integer USING id::text::integer;
ALTER TABLE public.servers ADD COLUMN IF NOT EXISTS node_id_int integer REFERENCES public.nodes(id);

-- Enable RLS on nodes table
ALTER TABLE public.nodes ENABLE ROW LEVEL SECURITY;

-- Create policies for nodes table
CREATE POLICY "Admins can manage nodes" ON public.nodes
  FOR ALL USING (EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE auth_id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Users can view available nodes" ON public.nodes
  FOR SELECT USING (reserved_by IS NULL OR reserved_by = auth.uid());

-- Update orders policies to work with new structure
DROP POLICY IF EXISTS "Users can create their own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can view their own orders" ON public.orders;

CREATE POLICY "Users can create their own orders" ON public.orders
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view their own orders" ON public.orders
  FOR SELECT USING (user_id = auth.uid());

-- Update servers policies to work with integer ids
DROP POLICY IF EXISTS "Users can manage their own servers" ON public.servers;
DROP POLICY IF EXISTS "Users can view their own servers" ON public.servers;

CREATE POLICY "Users can manage their own servers" ON public.servers
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Users can view their own servers" ON public.servers
  FOR SELECT USING (user_id = auth.uid());

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_pelican_user_id ON public.profiles(pelican_user_id);
CREATE INDEX IF NOT EXISTS idx_nodes_reserved_by ON public.nodes(reserved_by);
CREATE INDEX IF NOT EXISTS idx_servers_node_id_int ON public.servers(node_id_int);