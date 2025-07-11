
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

    const { action, serverData, userId } = await req.json()

    // Get Pelican API key
    const { data: apiKeyData } = await supabase
      .from('api_keys')
      .select('api_key')
      .eq('service', 'pelican')
      .eq('is_active', true)
      .single()

    if (!apiKeyData) {
      return new Response(JSON.stringify({ error: 'Pelican API key not configured' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    let pelicanResponse
    
    if (action === 'create_server') {
      // Create server in Pelican panel
      pelicanResponse = await fetch(`${Deno.env.get('PELICAN_API_URL')}/api/application/servers`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKeyData.api_key}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          name: serverData.name,
          user: userId,
          egg: serverData.egg || 1,
          docker_image: serverData.docker_image || 'quay.io/pelican-dev/yolks:nodejs_18',
          startup: serverData.startup || 'npm start',
          environment: serverData.environment || {},
          limits: {
            memory: serverData.memory || 512,
            swap: serverData.swap || 0,
            disk: serverData.disk || 1024,
            io: serverData.io || 500,
            cpu: serverData.cpu || 100
          },
          feature_limits: {
            databases: serverData.databases || 1,
            allocations: serverData.allocations || 1,
            backups: serverData.backups || 1
          },
          allocation: {
            default: serverData.port || 25565
          }
        })
      })

      const pelicanData = await pelicanResponse.json()
      
      if (pelicanResponse.ok) {
        // Update server record with Pelican server ID
        await supabase
          .from('servers')
          .update({ 
            pelican_server_id: pelicanData.attributes.id.toString(),
            status: 'stopped'
          })
          .eq('id', serverData.server_id)
      }

      return new Response(JSON.stringify(pelicanData), {
        status: pelicanResponse.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (action === 'get_server_status') {
      // Get server status from Pelican
      pelicanResponse = await fetch(`${Deno.env.get('PELICAN_API_URL')}/api/application/servers/${serverData.pelican_server_id}`, {
        headers: {
          'Authorization': `Bearer ${apiKeyData.api_key}`,
          'Accept': 'application/json'
        }
      })

      const pelicanData = await pelicanResponse.json()
      
      if (pelicanResponse.ok) {
        // Update server status in database
        await supabase
          .from('servers')
          .update({ 
            status: pelicanData.attributes.status,
            cpu_usage: `${pelicanData.attributes.resources?.cpu || 0}%`,
            memory_usage: `${Math.round((pelicanData.attributes.resources?.memory || 0) / 1024 / 1024)}MB`
          })
          .eq('pelican_server_id', serverData.pelican_server_id)
      }

      return new Response(JSON.stringify(pelicanData), {
        status: pelicanResponse.status,
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
