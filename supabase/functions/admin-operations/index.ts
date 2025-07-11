
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

    // Check if user is admin
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

    const { action, data } = await req.json()

    switch (action) {
      case 'get_metrics':
        const { data: metrics } = await supabase
          .from('system_metrics')
          .select('*')
          .order('recorded_at', { ascending: false })

        // Get real-time counts
        const { count: serverCount } = await supabase
          .from('servers')
          .select('*', { count: 'exact', head: true })

        const { count: userCount } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true })

        const { count: orderCount } = await supabase
          .from('orders')
          .select('*', { count: 'exact', head: true })

        const { data: revenueData } = await supabase
          .from('orders')
          .select('amount')
          .eq('status', 'completed')

        const totalRevenue = revenueData?.reduce((sum, order) => sum + order.amount, 0) || 0

        return new Response(JSON.stringify({
          metrics,
          realTime: {
            totalServers: serverCount || 0,
            activeUsers: userCount || 0,
            totalOrders: orderCount || 0,
            totalRevenue
          }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

      case 'get_all_users':
        const { data: allUsers } = await supabase
          .from('users')
          .select('*')
          .order('created_at', { ascending: false })

        return new Response(JSON.stringify({ users: allUsers }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

      case 'update_user_role':
        await supabase
          .from('users')
          .update({ role: data.role })
          .eq('id', data.userId)

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

      case 'get_all_servers':
        const { data: allServers } = await supabase
          .from('servers')
          .select(`
            *,
            users (
              first_name,
              last_name,
              email
            )
          `)
          .order('created_at', { ascending: false })

        return new Response(JSON.stringify({ servers: allServers }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

      case 'sync_forpsi_orders':
        // Trigger Forpsi sync
        const syncResponse = await supabase.functions.invoke('forpsi-integration', {
          body: { action: 'sync_orders' }
        })

        return new Response(JSON.stringify({ success: true, data: syncResponse.data }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

      default:
        return new Response(JSON.stringify({ error: 'Invalid action' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    }

  } catch (error) {
    console.error('Admin operations error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
