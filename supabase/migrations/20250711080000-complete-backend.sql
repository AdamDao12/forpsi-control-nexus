
-- Add missing columns to servers table
ALTER TABLE public.servers ADD COLUMN IF NOT EXISTS ram_mb INTEGER DEFAULT 1024;
ALTER TABLE public.servers ADD COLUMN IF NOT EXISTS cpu_pct INTEGER DEFAULT 100;
ALTER TABLE public.servers ADD COLUMN IF NOT EXISTS disk_mb INTEGER DEFAULT 2048;
ALTER TABLE public.servers ADD COLUMN IF NOT EXISTS node_id TEXT;
ALTER TABLE public.servers ADD COLUMN IF NOT EXISTS egg_id INTEGER DEFAULT 1;

-- Update servers status enum to include more states
ALTER TABLE public.servers DROP CONSTRAINT IF EXISTS servers_status_check;
ALTER TABLE public.servers ADD CONSTRAINT servers_status_check 
  CHECK (status IN ('running', 'stopped', 'maintenance', 'creating', 'starting', 'stopping', 'installing'));

-- Create support tickets table
CREATE TABLE IF NOT EXISTS public.tickets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  assigned_to UUID REFERENCES public.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create callouts (server presets) table
CREATE TABLE IF NOT EXISTS public.callouts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  label TEXT NOT NULL,
  description TEXT,
  default_ram INTEGER NOT NULL DEFAULT 1024,
  default_cpu INTEGER NOT NULL DEFAULT 100,
  default_disk INTEGER NOT NULL DEFAULT 2048,
  egg_id INTEGER NOT NULL DEFAULT 1,
  node_id TEXT,
  docker_image TEXT DEFAULT 'quay.io/pelican-dev/yolks:nodejs_18',
  startup_command TEXT DEFAULT 'npm start',
  environment JSONB DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create system metrics table for dashboard
CREATE TABLE IF NOT EXISTS public.system_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  metric_type TEXT NOT NULL,
  value NUMERIC NOT NULL,
  metadata JSONB DEFAULT '{}',
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.callouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_metrics ENABLE ROW LEVEL SECURITY;

-- Tickets policies
CREATE POLICY "Users can view their own tickets" ON public.tickets
  FOR SELECT USING (
    user_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid())
  );

CREATE POLICY "Users can create their own tickets" ON public.tickets
  FOR INSERT WITH CHECK (
    user_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid())
  );

CREATE POLICY "Admins can view all tickets" ON public.tickets
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE auth_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can manage all tickets" ON public.tickets
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE auth_id = auth.uid() AND role = 'admin')
  );

-- Callouts policies (admin only)
CREATE POLICY "Admins can manage callouts" ON public.callouts
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE auth_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Users can view active callouts" ON public.callouts
  FOR SELECT USING (is_active = true);

-- System metrics policies (admin only)
CREATE POLICY "Admins can manage system metrics" ON public.system_metrics
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.users WHERE auth_id = auth.uid() AND role = 'admin')
  );

-- Add orders policies for users to create orders
CREATE POLICY "Users can create their own orders" ON public.orders
  FOR INSERT WITH CHECK (
    user_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid())
  );

-- Update triggers for new tables
CREATE TRIGGER update_tickets_updated_at BEFORE UPDATE ON public.tickets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_callouts_updated_at BEFORE UPDATE ON public.callouts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default admin user if not exists (will be created on first auth)
-- Insert some default callouts
INSERT INTO public.callouts (label, description, default_ram, default_cpu, default_disk, egg_id, docker_image, startup_command) VALUES
('Minecraft Server', 'Standard Minecraft server with 2GB RAM', 2048, 150, 4096, 1, 'quay.io/pelican-dev/yolks:java_17', 'java -Xms128M -Xmx{{SERVER_MEMORY}}M -jar server.jar'),
('Node.js Application', 'Node.js web application server', 1024, 100, 2048, 5, 'quay.io/pelican-dev/yolks:nodejs_18', 'npm start'),
('Python Application', 'Python web application server', 1024, 100, 2048, 15, 'quay.io/pelican-dev/yolks:python_3.9', 'python main.py'),
('CS:GO Server', 'Counter-Strike: Global Offensive game server', 4096, 200, 8192, 25, 'quay.io/pelican-dev/yolks:source', './srcds_run -game csgo +map de_dust2')
ON CONFLICT DO NOTHING;

-- Insert some sample system metrics
INSERT INTO public.system_metrics (metric_type, value, metadata) VALUES
('total_servers', 0, '{"description": "Total number of servers"}'),
('active_users', 0, '{"description": "Number of active users"}'),
('total_orders', 0, '{"description": "Total number of orders"}'),
('revenue_monthly', 0, '{"description": "Monthly revenue in EUR"}')
ON CONFLICT DO NOTHING;
