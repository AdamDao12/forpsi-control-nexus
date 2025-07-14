-- Update both users to admin role
UPDATE public.profiles 
SET role = 'admin' 
WHERE email IN ('messov.adam@email.cz', 'admin@nexus.com');

-- Verify the update
SELECT 
  email, 
  first_name, 
  last_name, 
  role 
FROM public.profiles 
WHERE role = 'admin';