-- Create the first admin user manually
DO $$
DECLARE
    admin_user_id uuid;
BEGIN
    -- First, let's create the admin user in the auth.users table through the admin API
    -- We'll do this via a different approach since we can't directly insert into auth.users
    
    -- For now, let's ensure we have the infrastructure ready
    -- The actual user creation needs to be done through Supabase Auth API
    
    -- Let's check if we can create a temporary admin marker
    INSERT INTO public.profiles (auth_id, email, role, first_name, last_name, created_at, updated_at)
    SELECT 
        gen_random_uuid(),
        'setup@nexus.temp',
        'setup',
        'Setup',
        'Required',
        now(),
        now()
    WHERE NOT EXISTS (
        SELECT 1 FROM public.profiles WHERE email = 'setup@nexus.temp'
    );
    
    RAISE NOTICE 'Setup marker created. Admin user needs to be created through Auth API.';
END $$;