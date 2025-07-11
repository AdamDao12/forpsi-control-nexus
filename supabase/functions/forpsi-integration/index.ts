
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

    const { action, orderData } = await req.json()

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
