
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

    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data: { user } } = await supabase.auth.getUser(token)

    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { action, calloutData } = await req.json()

    switch (action) {
      case 'get_callouts':
        const { data: callouts } = await supabase
          .from('callouts')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: false })

        return new Response(JSON.stringify({ callouts }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

      case 'create_callout':
        // Check admin permissions
        const { data: userProfile } = await supabase
          .from('users')
          .select('role')
          .eq('auth_id', user.id)
          .single()

        if (!userProfile || userProfile.role !== 'admin') {
          return new Response(JSON.stringify({ error: 'Admin access required' }), {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }

        const { data: newCallout } = await supabase
          .from('callouts')
          .insert(calloutData)
          .select()
          .single()

        return new Response(JSON.stringify({ callout: newCallout }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

      case 'update_callout':
        // Check admin permissions
        const { data: adminProfile } = await supabase
          .from('users')
          .select('role')
          .eq('auth_id', user.id)
          .single()

        if (!adminProfile || adminProfile.role !== 'admin') {
          return new Response(JSON.stringify({ error: 'Admin access required' }), {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }

        const { data: updatedCallout } = await supabase
          .from('callouts')
          .update(calloutData)
          .eq('id', calloutData.id)
          .select()
          .single()

        return new Response(JSON.stringify({ callout: updatedCallout }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

      case 'delete_callout':
        // Check admin permissions
        const { data: deleteAdminProfile } = await supabase
          .from('users')
          .select('role')
          .eq('auth_id', user.id)
          .single()

        if (!deleteAdminProfile || deleteAdminProfile.role !== 'admin') {
          return new Response(JSON.stringify({ error: 'Admin access required' }), {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }

        await supabase
          .from('callouts')
          .update({ is_active: false })
          .eq('id', calloutData.id)

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

      default:
        return new Response(JSON.stringify({ error: 'Invalid action' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    }

  } catch (error) {
    console.error('Callouts management error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
