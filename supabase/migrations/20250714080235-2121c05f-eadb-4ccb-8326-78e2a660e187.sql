-- Create first admin user if none exists
DO $$
DECLARE
    admin_user_id uuid;
    admin_exists boolean;
BEGIN
    -- Check if admin already exists
    SELECT EXISTS(SELECT 1 FROM public.profiles WHERE role = 'admin') INTO admin_exists;
    
    IF NOT admin_exists THEN
        -- For now, we'll create a placeholder that can be updated when the first user registers
        -- The actual admin creation will need to be done through the application
        INSERT INTO public.profiles (auth_id, email, role, first_name, last_name)
        VALUES (
            '00000000-0000-0000-0000-000000000000',
            'admin@nexus.local', 
            'admin', 
            'System', 
            'Admin'
        );
        
        RAISE NOTICE 'Placeholder admin created. First registered user should be promoted to admin.';
    END IF;
END $$;