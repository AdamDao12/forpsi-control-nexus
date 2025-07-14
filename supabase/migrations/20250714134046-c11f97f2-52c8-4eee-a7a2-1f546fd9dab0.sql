-- Create a sample paid order for testing server creation
INSERT INTO public.orders (user_id, package, ram, cpu, disk, paid, expires_at)
SELECT 
  auth_id as user_id,
  'Minecraft Server Package' as package,
  2048 as ram,
  200 as cpu,
  4096 as disk,
  true as paid,
  CURRENT_DATE + INTERVAL '30 days' as expires_at
FROM public.profiles 
WHERE role = 'user'
LIMIT 1
ON CONFLICT DO NOTHING;

-- Update profiles to have pelican_user_id for server creation
UPDATE public.profiles 
SET pelican_user_id = 1 
WHERE pelican_user_id IS NULL;