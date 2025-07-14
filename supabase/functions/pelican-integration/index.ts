
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

    const { action, serverData, userId, calloutId } = await req.json()

    // Get Pelican API configuration
    const pelicanApiUrl = Deno.env.get('PELICAN_API_URL') || 'http://81.2.233.110/api/application'
    const pelicanApiKey = Deno.env.get('PELICAN_API_KEY')

    console.log('Pelican API URL:', pelicanApiUrl)
    console.log('Action requested:', action)
    console.log('User ID:', user.id)

    if (!pelicanApiKey) {
      return new Response(JSON.stringify({ error: 'Pelican API key missing' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    let pelicanResponse

    if (action === 'create_server') {
      let serverConfig = serverData

      // If calloutId is provided, get the callout configuration
      if (calloutId) {
        const { data: callout } = await supabase
          .from('callouts')
          .select('*')
          .eq('id', calloutId)
          .eq('is_active', true)
          .single()

        if (callout) {
          serverConfig = {
            name: serverData.name,
            memory: callout.default_ram,
            cpu: callout.default_cpu,
            disk: callout.default_disk,
            egg_id: callout.egg_id,
            docker_image: callout.docker_image,
            startup: callout.startup_command,
            environment: callout.environment || {},
            node_id: callout.node_id
          }
        }
      }

      // Create server in Pelican panel
      pelicanResponse = await fetch(`${pelicanApiUrl}/servers`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${pelicanApiKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          name: serverConfig.name,
          user: userId,
          egg: serverConfig.egg_id || 1,
          docker_image: serverConfig.docker_image || 'quay.io/pelican-dev/yolks:nodejs_18',
          startup: serverConfig.startup || 'npm start',
          environment: serverConfig.environment || {},
          limits: {
            memory: serverConfig.memory || 1024,
            swap: 0,
            disk: serverConfig.disk || 2048,
            io: 500,
            cpu: serverConfig.cpu || 100
          },
          feature_limits: {
            databases: 2,
            allocations: 1,
            backups: 3
          },
          allocation: {
            default: serverConfig.port || 25565
          }
        })
      })

      const pelicanData = await pelicanResponse.json()
      
      if (pelicanResponse.ok) {
        // Update server record with Pelican server ID and configuration
        await supabase
          .from('servers')
          .update({ 
            pelican_server_id: pelicanData.attributes.id.toString(),
            status: 'installing',
            ram_mb: serverConfig.memory || 1024,
            cpu_pct: serverConfig.cpu || 100,
            disk_mb: serverConfig.disk || 2048,
            egg_id: serverConfig.egg_id || 1
          })
          .eq('id', serverData.server_id)
      }

      return new Response(JSON.stringify(pelicanData), {
        status: pelicanResponse.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (action === 'list_nodes') {
      console.log('Fetching nodes from:', `${pelicanApiUrl}/nodes`)
      
      // List all nodes from Pelican
      pelicanResponse = await fetch(`${pelicanApiUrl}/nodes`, {
        headers: {
          'Authorization': `Bearer ${pelicanApiKey}`,
          'Accept': 'application/json'
        }
      })

      const responseData = await pelicanResponse.json()
      console.log('Pelican nodes response:', JSON.stringify(responseData, null, 2))
      console.log('Response status:', pelicanResponse.status)

      return new Response(JSON.stringify(responseData), {
        status: pelicanResponse.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (action === 'list_servers') {
      console.log('Fetching servers from:', `${pelicanApiUrl}/servers`)
      
      // List all servers from Pelican
      pelicanResponse = await fetch(`${pelicanApiUrl}/servers`, {
        headers: {
          'Authorization': `Bearer ${pelicanApiKey}`,
          'Accept': 'application/json'
        }
      })

      const responseData = await pelicanResponse.json()
      console.log('Pelican servers response:', JSON.stringify(responseData, null, 2))

      return new Response(JSON.stringify(responseData), {
        status: pelicanResponse.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (action === 'get_server_status') {
      // Get server status from Pelican
      pelicanResponse = await fetch(`${pelicanApiUrl}/servers/${serverData.pelican_server_id}`, {
        headers: {
          'Authorization': `Bearer ${pelicanApiKey}`,
          'Accept': 'application/json'
        }
      })

      const pelicanData = await pelicanResponse.json()
      
      if (pelicanResponse.ok) {
        const server = pelicanData.attributes
        // Update server status in database
        await supabase
          .from('servers')
          .update({ 
            status: server.status || 'unknown',
            cpu_usage: server.resources?.cpu ? `${Math.round(server.resources.cpu)}%` : '0%',
            memory_usage: server.resources?.memory ? `${Math.round(server.resources.memory / 1024 / 1024)}MB` : '0MB',
            uptime: server.resources?.uptime ? `${Math.floor(server.resources.uptime / 86400)} days` : '0 days'
          })
          .eq('pelican_server_id', serverData.pelican_server_id)
      }

      return new Response(JSON.stringify(pelicanData), {
        status: pelicanResponse.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (action === 'control_server') {
      // Control server power (start/stop/restart)
      const powerAction = serverData.power_action // 'start', 'stop', 'restart'
      
      pelicanResponse = await fetch(`http://81.2.233.110/api/client/servers/${serverData.pelican_server_id}/power`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${pelicanApiKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          signal: powerAction
        })
      })

      if (pelicanResponse.ok) {
        // Update server status optimistically
        let newStatus = 'unknown'
        switch (powerAction) {
          case 'start':
            newStatus = 'starting'
            break
          case 'stop':
            newStatus = 'stopping'
            break
          case 'restart':
            newStatus = 'starting'
            break
        }

        await supabase
          .from('servers')
          .update({ status: newStatus })
          .eq('pelican_server_id', serverData.pelican_server_id)
      }

      return new Response(JSON.stringify({ success: pelicanResponse.ok }), {
        status: pelicanResponse.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (action === 'delete_server') {
      // Delete server from Pelican
      pelicanResponse = await fetch(`${pelicanApiUrl}/servers/${serverData.pelican_server_id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${pelicanApiKey}`,
          'Accept': 'application/json'
        }
      })

      if (pelicanResponse.ok) {
        // Delete server record from database
        await supabase
          .from('servers')
          .delete()
          .eq('pelican_server_id', serverData.pelican_server_id)
      }

      return new Response(JSON.stringify({ success: pelicanResponse.ok }), {
        status: pelicanResponse.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('Pelican integration error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
