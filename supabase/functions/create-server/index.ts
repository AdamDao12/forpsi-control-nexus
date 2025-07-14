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

  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { 
      status: 405,
      headers: corsHeaders 
    })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const body = await req.json()
    const { order_id, egg_id, node_id } = body

    console.log('Creating server with params:', { order_id, egg_id, node_id })

    /* 1. Load order & user */
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        *,
        profiles!inner(auth_id, pelican_user_id)
      `)
      .eq('id', order_id)
      .single()

    if (orderError || !order) {
      console.error('Order fetch error:', orderError)
      return new Response('Order not found', { 
        status: 404,
        headers: corsHeaders 
      })
    }

    if (!order.paid) {
      return new Response('Order unpaid', { 
        status: 400,
        headers: corsHeaders 
      })
    }

    console.log('Order loaded:', order)

    const API = Deno.env.get('PELICAN_BASE_URL') || Deno.env.get('PELICAN_API_URL')
    const TOKEN = Deno.env.get('PELICAN_TOKEN') || Deno.env.get('PELICAN_API_KEY')

    if (!API || !TOKEN) {
      console.error('Missing Pelican configuration')
      return new Response('Pelican API not configured', { 
        status: 500,
        headers: corsHeaders 
      })
    }

    /* 2. Pick allocation (via Pelican) */
    const allocRes = await fetch(`${API}/nodes/${node_id}/allocations`, {
      headers: { 
        Accept: 'application/json', 
        Authorization: `Bearer ${TOKEN}` 
      }
    })

    if (!allocRes.ok) {
      console.error('Failed to fetch allocations:', allocRes.status)
      return new Response('Failed to fetch node allocations', { 
        status: 502,
        headers: corsHeaders 
      })
    }

    const { data: allocs } = await allocRes.json()
    console.log('Allocations fetched:', allocs?.length || 0)

    const freeAlloc = allocs?.find((a: any) => !a.attributes.assigned)
    if (!freeAlloc) {
      console.error('No free allocations found')
      return new Response('No free IP/port', { 
        status: 409,
        headers: corsHeaders 
      })
    }

    console.log('Free allocation found:', freeAlloc.attributes.id)

    /* 3. Build payload */
    const payload = {
      name: order.package + ' Server',
      user: order.profiles.pelican_user_id || 1,
      egg: egg_id,
      docker_image: 'ghcr.io/pterodactyl/yolks:java_17',
      startup: 'java -Xms128M -Xmx{{SERVER_MEMORY}}M -jar server.jar nogui',
      environment: {},
      limits: { 
        memory: order.ram, 
        disk: order.disk, 
        cpu: order.cpu, 
        swap: -1, 
        io: 500 
      },
      feature_limits: { 
        databases: 1, 
        allocations: 1, 
        backups: 3 
      },
      allocation: { default: freeAlloc.attributes.id },
      start_on_completion: true
    }

    console.log('Payload prepared:', payload)

    /* 4. POST to Pelican */
    const res = await fetch(`${API}/servers`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })

    const responseText = await res.text()
    console.log('Pelican response status:', res.status)
    console.log('Pelican response:', responseText)

    if (!res.ok) {
      console.error('Pelican error:', res.status, responseText)
      return new Response(`Pelican returned ${res.status}: ${responseText}`, { 
        status: 502,
        headers: corsHeaders 
      })
    }

    let responseData
    try {
      responseData = JSON.parse(responseText)
    } catch (e) {
      console.error('Failed to parse Pelican response:', e)
      return new Response('Invalid response from Pelican', { 
        status: 502,
        headers: corsHeaders 
      })
    }

    const attributes = responseData.attributes

    /* 5. Persist to database */
    const { error: insertError } = await supabase.from('servers').insert({
      id: attributes.id,
      user_id: order.user_id,
      node_id_int: node_id,
      egg_id: egg_id,
      name: attributes.name,
      status: attributes.status,
      pelican_server_id: attributes.id,
      ram_mb: order.ram,
      cpu_pct: order.cpu,
      disk_mb: order.disk,
      location: 'default'
    })

    if (insertError) {
      console.error('Database insert error:', insertError)
    }

    console.log('Server created successfully:', attributes.id)

    return new Response(JSON.stringify({ 
      ok: true, 
      server_id: attributes.id,
      name: attributes.name,
      status: attributes.status 
    }), { 
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error: any) {
    console.error('Edge function error:', error)
    return new Response(JSON.stringify({ 
      error: error.message || 'Internal server error' 
    }), { 
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})