import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('Creating admin user...')

    // Create admin user
    const adminEmail = 'admin@nexus.com'
    const adminPassword = 'admin123'

    // First check if admin already exists
    const { data: existingProfiles } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'admin')

    if (existingProfiles && existingProfiles.length > 0) {
      return new Response(JSON.stringify({ 
        message: 'Admin already exists',
        credentials: {
          email: adminEmail,
          password: adminPassword
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    console.log('Creating new admin user in auth...')

    const { data: newUser, error: authError } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true,
      user_metadata: {
        first_name: 'Admin',
        last_name: 'User'
      }
    })

    if (authError) {
      console.error('Auth error:', authError)
      return new Response(JSON.stringify({ error: authError.message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    console.log('Created auth user:', newUser.user.id)

    // Create admin profile
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        auth_id: newUser.user.id,
        email: adminEmail,
        first_name: 'Admin',
        last_name: 'User',
        role: 'admin'
      })

    if (profileError) {
      console.error('Profile error:', profileError)
      return new Response(JSON.stringify({ error: profileError.message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    console.log('Admin profile created successfully')

    return new Response(JSON.stringify({ 
      success: true,
      credentials: {
        email: adminEmail,
        password: adminPassword
      },
      message: 'Admin user created successfully'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Create admin error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})