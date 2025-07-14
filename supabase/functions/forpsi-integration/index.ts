
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

    const url = new URL(req.url)
    const action = url.searchParams.get('action') || 'webhook'

    // Handle Forpsi webhook (no auth required)
    if (action === 'webhook') {
      const webhookData = await req.json()
      
      console.log('Received Forpsi webhook:', webhookData)

      // Verify webhook secret (if provided)
      const webhookSecret = req.headers.get('X-Forpsi-Signature')
      if (webhookSecret) {
        console.log('Webhook signature:', webhookSecret)
      }

      // Process the webhook data
      const {
        order_id,
        customer_email,
        customer_first_name,
        customer_last_name,
        service_type,
        package_name,
        resources,
        payment_status,
        payment_amount,
        period,
        expiration_date
      } = webhookData

      // Create user account if doesn't exist
      let userId = null
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('auth_id')
        .eq('email', customer_email)
        .single()

      if (!existingProfile) {
        // Generate password
        const password = generateRandomPassword()
        
        // Create user in Supabase Auth
        const { data: newUser, error: authError } = await supabase.auth.admin.createUser({
          email: customer_email,
          password: password,
          email_confirm: true
        })

        if (authError) {
          console.error('Failed to create user:', authError)
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
            email: customer_email,
            first_name: customer_first_name,
            last_name: customer_last_name,
            role: 'user'
          })

        if (profileError) {
          console.error('Failed to create profile:', profileError)
          return new Response(JSON.stringify({ error: profileError.message }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          })
        }

        userId = newUser.user.id

        // Create user in Pelican
        const pelicanUserResponse = await fetch(`${Deno.env.get('PELICAN_API_URL')}/api/application/users`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${Deno.env.get('PELICAN_API_KEY')}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            email: customer_email,
            username: customer_email.split('@')[0],
            first_name: customer_first_name,
            last_name: customer_last_name,
            password: password
          })
        })

        if (pelicanUserResponse.ok) {
          const pelicanUserData = await pelicanUserResponse.json()
          console.log('Created Pelican user:', pelicanUserData)
        }
      } else {
        userId = existingProfile.auth_id
      }

      // Create or update order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .upsert({
          user_id: userId,
          order_id: order_id,
          service: package_name,
          amount: payment_amount,
          period: period,
          status: payment_status === 'paid' ? 'paid' : 'pending',
          forpsi_order_id: order_id
        })
        .select()
        .single()

      if (orderError) {
        console.error('Failed to create order:', orderError)
        return new Response(JSON.stringify({ error: orderError.message }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      // If order is paid, trigger automatic provisioning
      if (payment_status === 'paid') {
        await autoProvisionServer(supabase, order, userId, resources)
      }

      return new Response(JSON.stringify({ success: true, order }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // For other actions, require authentication
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Authorization required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user } } = await supabase.auth.getUser(token)

    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { action: reqAction, orderData } = await req.json()
    const finalAction = reqAction || action

    // Get Forpsi API key
    const { data: apiKeyData } = await supabase
      .from('api_keys')
      .select('api_key')
      .eq('service', 'forpsi')
      .eq('is_active', true)
      .single()

    if (!apiKeyData) {
      return new Response(JSON.stringify({ error: 'Forpsi API key not configured' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    let forpsiResponse

    if (action === 'create_order') {
      // Create order in Forpsi system
      forpsiResponse = await fetch(`${Deno.env.get('FORPSI_API_URL')}/api/orders`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKeyData.api_key}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          service: orderData.service,
          amount: orderData.amount,
          period: orderData.period,
          customer_email: user.email,
          customer_id: user.id
        })
      })

      const forpsiData = await forpsiResponse.json()
      
      if (forpsiResponse.ok) {
        // Update order record with Forpsi order ID
        await supabase
          .from('orders')
          .update({ 
            forpsi_order_id: forpsiData.order_id,
            status: forpsiData.status || 'processing'
          })
          .eq('id', orderData.order_id)
      }

      return new Response(JSON.stringify(forpsiData), {
        status: forpsiResponse.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (action === 'sync_orders') {
      // Sync order statuses from Forpsi
      const { data: orders } = await supabase
        .from('orders')
        .select('id, forpsi_order_id')
        .not('forpsi_order_id', 'is', null)

      for (const order of orders || []) {
        try {
          const orderResponse = await fetch(`${Deno.env.get('FORPSI_API_URL')}/api/orders/${order.forpsi_order_id}`, {
            headers: {
              'Authorization': `Bearer ${apiKeyData.api_key}`,
              'Accept': 'application/json'
            }
          })

          if (orderResponse.ok) {
            const orderData = await orderResponse.json()
            await supabase
              .from('orders')
              .update({ status: orderData.status })
              .eq('id', order.id)
          }
        } catch (error) {
          console.error(`Error syncing order ${order.id}:`, error)
        }
      }

      return new Response(JSON.stringify({ message: 'Orders synced successfully' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

// Helper function to auto-provision server
async function autoProvisionServer(supabase: any, order: any, userId: string, resources: any) {
  try {
    console.log('Starting auto-provisioning for order:', order.id)

    // Find a free node
    const { data: reservations } = await supabase
      .from('node_reservations')
      .select('node_id')

    const reservedNodeIds = reservations?.map((r: any) => r.node_id) || []

    // Get available nodes from Pelican
    const pelicanResponse = await fetch(`${Deno.env.get('PELICAN_API_URL')}/api/application/nodes`, {
      headers: {
        'Authorization': `Bearer ${Deno.env.get('PELICAN_API_KEY')}`,
        'Accept': 'application/json'
      }
    })

    if (!pelicanResponse.ok) {
      console.error('Failed to fetch nodes from Pelican')
      return
    }

    const pelicanData = await pelicanResponse.json()
    const availableNodes = pelicanData.data.filter((node: any) => 
      !reservedNodeIds.includes(node.attributes.id.toString())
    )

    if (availableNodes.length === 0) {
      console.error('No available nodes for provisioning')
      return
    }

    // Select the first available node
    const selectedNode = availableNodes[0]
    
    // Reserve the node
    await supabase
      .from('node_reservations')
      .insert({
        node_id: selectedNode.attributes.id.toString(),
        user_id: userId,
        order_id: order.id
      })

    // Update node description in Pelican
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('first_name, last_name, email')
      .eq('auth_id', userId)
      .single()

    if (userProfile) {
      const description = `Auto-provisioned for ${userProfile.first_name} ${userProfile.last_name} (${userProfile.email})`
      
      await fetch(`${Deno.env.get('PELICAN_API_URL')}/api/application/nodes/${selectedNode.attributes.id}`, {
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

    // Create server via Pelican integration
    await supabase.functions.invoke('pelican-integration', {
      body: {
        action: 'create_server',
        serverData: {
          name: `${userProfile?.first_name || 'User'}'s Server`,
          server_id: order.id,
          memory: resources?.memory || 1024,
          cpu: resources?.cpu || 100,
          disk: resources?.disk || 2048
        },
        userId: userId
      }
    })

    console.log('Auto-provisioning completed for order:', order.id)

  } catch (error) {
    console.error('Auto-provisioning failed:', error)
  }
}

// Helper function to generate random password
function generateRandomPassword(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let password = ''
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}
