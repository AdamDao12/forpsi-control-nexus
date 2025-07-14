
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

    // Check if user is admin using the safe function
    const { data: isAdmin } = await supabase.rpc('is_admin_user', { user_id: user.id })

    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { action, data } = await req.json()

    switch (action) {
      // Order Management Actions
      case 'create_order':
        // Create user account in Supabase Auth first
        const { data: newUser, error: authError } = await supabase.auth.admin.createUser({
          email: data.email,
          password: data.password,
          email_confirm: true
        })

        if (authError) {
          return new Response(JSON.stringify({ error: authError.message }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }

        // Create profile
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            auth_id: newUser.user.id,
            email: data.email,
            first_name: data.firstName,
            last_name: data.lastName,
            role: 'user'
          })

        if (profileError) {
          return new Response(JSON.stringify({ error: profileError.message }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }

        // Create order
        const { data: order, error: orderError } = await supabase
          .from('orders')
          .insert({
            user_id: newUser.user.id,
            order_id: data.orderId,
            service: data.service,
            amount: data.amount,
            period: data.period,
            status: data.status || 'pending',
            forpsi_order_id: data.forpsiOrderId
          })
          .select()
          .single()

        if (orderError) {
          return new Response(JSON.stringify({ error: orderError.message }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }

        // Create user in Pelican if needed
        if (data.createPelicanUser) {
          const pelicanResponse = await fetch(`${Deno.env.get('PELICAN_API_URL')}/api/application/users`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${Deno.env.get('PELICAN_API_KEY')}`,
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            body: JSON.stringify({
              email: data.email,
              username: data.username || data.email.split('@')[0],
              first_name: data.firstName,
              last_name: data.lastName,
              password: data.password
            })
          })

          if (pelicanResponse.ok) {
            const pelicanData = await pelicanResponse.json()
            console.log('Created Pelican user:', pelicanData)
          }
        }

        return new Response(JSON.stringify({ success: true, order, user: newUser.user }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

      case 'get_orders':
        const { data: orders, error: ordersError } = await supabase
          .from('orders')
          .select(`
            *,
            profiles!orders_user_id_fkey (first_name, last_name, email)
          `)
          .order('created_at', { ascending: false })

        if (ordersError) {
          return new Response(JSON.stringify({ error: ordersError.message }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }

        return new Response(JSON.stringify({ orders }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

      case 'update_order_status':
        const { error: updateError } = await supabase
          .from('orders')
          .update({ status: data.status })
          .eq('id', data.orderId)

        if (updateError) {
          return new Response(JSON.stringify({ error: updateError.message }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }

        // If marked as paid, trigger automatic provisioning
        if (data.status === 'paid') {
          console.log('Order marked as paid, ready for provisioning:', data.orderId)
        }

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

      // Node Management Actions
      case 'get_pelican_nodes':
        const pelicanResponse = await fetch(`${Deno.env.get('PELICAN_API_URL')}/api/application/nodes`, {
          headers: {
            'Authorization': `Bearer ${Deno.env.get('PELICAN_API_KEY')}`,
            'Accept': 'application/json'
          }
        })

        if (!pelicanResponse.ok) {
          return new Response(JSON.stringify({ error: 'Failed to fetch nodes from Pelican' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }

        const pelicanData = await pelicanResponse.json()
        
        // Get node reservations
        const { data: reservations } = await supabase
          .from('node_reservations')
          .select(`
            *,
            profiles!node_reservations_user_id_fkey (first_name, last_name, email),
            orders!node_reservations_order_id_fkey (order_id, service)
          `)

        // Combine Pelican node data with reservation status
        const nodesWithStatus = pelicanData.data.map((node: any) => {
          const reservation = reservations?.find(r => r.node_id === node.attributes.id.toString())
          return {
            ...node,
            reservation,
            status: reservation ? 'occupied' : 'free'
          }
        })

        return new Response(JSON.stringify({ nodes: nodesWithStatus }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

      case 'reserve_node':
        // Reserve a node to a user
        const { error: reserveError } = await supabase
          .from('node_reservations')
          .insert({
            node_id: data.nodeId,
            user_id: data.userId,
            order_id: data.orderId
          })

        if (reserveError) {
          return new Response(JSON.stringify({ error: reserveError.message }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }

        // Update node description in Pelican
        const { data: userProfile } = await supabase
          .from('profiles')
          .select('first_name, last_name, email')
          .eq('auth_id', data.userId)
          .single()

        if (userProfile) {
          const description = `Owned by ${userProfile.first_name} ${userProfile.last_name} (${userProfile.email})`
          
          await fetch(`${Deno.env.get('PELICAN_API_URL')}/api/application/nodes/${data.nodeId}`, {
            method: 'PATCH',
            headers: {
              'Authorization': `Bearer ${Deno.env.get('PELICAN_API_KEY')}`,
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            body: JSON.stringify({
              description
            })
          })
        }

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

      case 'create_pelican_node':
        const createNodeResponse = await fetch(`${Deno.env.get('PELICAN_API_URL')}/api/application/nodes`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${Deno.env.get('PELICAN_API_KEY')}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            name: data.name,
            location_id: data.locationId || 1,
            fqdn: data.fqdn,
            scheme: data.scheme || 'https',
            behind_proxy: data.behindProxy || false,
            memory: data.memory,
            memory_overallocate: data.memoryOverallocate || 0,
            disk: data.disk,
            disk_overallocate: data.diskOverallocate || 0,
            daemon_listen: data.daemonListen || 8080,
            daemon_sftp: data.daemonSftp || 2022,
            description: data.description || ''
          })
        })

        const createNodeData = await createNodeResponse.json()

        return new Response(JSON.stringify(createNodeData), {
          status: createNodeResponse.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

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
          .from('profiles')
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
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false })

        return new Response(JSON.stringify({ users: allUsers }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

      case 'update_user_role':
        await supabase
          .from('profiles')
          .update({ role: data.role })
          .eq('auth_id', data.userId)

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

      case 'get_all_servers':
        const { data: allServers } = await supabase
          .from('servers')
          .select(`
            *,
            profiles!servers_user_id_fkey (
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
