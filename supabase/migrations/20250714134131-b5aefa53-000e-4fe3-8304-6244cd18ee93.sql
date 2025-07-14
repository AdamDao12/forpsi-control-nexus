-- Insert sample nodes that match typical Pelican node structure
INSERT INTO public.nodes (id, name, location_id, created_at) VALUES
(1, 'Main-Server-1', 1, now()),
(5, 'Game-Node-DE', 2, now()),
(6, 'VPS-Node-US', 3, now())
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name,
  location_id = EXCLUDED.location_id;

-- Make sure admin user exists and can manage orders
INSERT INTO public.orders (user_id, package, ram, cpu, disk, paid, expires_at)
SELECT 
  auth_id as user_id,
  'Admin Test Package' as package,
  4096 as ram,
  400 as cpu,
  8192 as disk,
  true as paid,
  CURRENT_DATE + INTERVAL '60 days' as expires_at
FROM public.profiles 
WHERE role = 'admin'
LIMIT 1
ON CONFLICT DO NOTHING;