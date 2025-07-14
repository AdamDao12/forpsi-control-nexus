
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

  const log = (level: string, message: string, data?: any) => {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...data
    };
    console.log(JSON.stringify(logEntry));
  };

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

    const requestBody = await req.json()
    const { action, serverData, userId, calloutId } = requestBody

    log('INFO', 'Pelican Integration Request', { action, userId: user.id });

    // Get Pelican API configuration  
    const pelicanApiUrl = Deno.env.get('PELICAN_API_URL') || 'http://81.2.233.110/api/application'
    const pelicanApiKey = Deno.env.get('PELICAN_API_KEY')

    if (!pelicanApiKey) {
      log('ERROR', 'Pelican API key missing');
      return new Response(JSON.stringify({ error: 'Pelican API key missing' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Enhanced API request wrapper with proper error handling
    const makeApiRequest = async (url: string, options: RequestInit = {}) => {
      try {
        log('DEBUG', 'Making Pelican API request', { url, method: options.method || 'GET' });
        
        const response = await fetch(url, {
          ...options,
          headers: {
            'Authorization': `Bearer ${pelicanApiKey}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            ...options.headers
          },
          signal: AbortSignal.timeout(10000) // 10s timeout
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          log('ERROR', 'Pelican API call failed', { 
            url, 
            status: response.status, 
            statusText: response.statusText,
            error: errorText 
          });
          throw new Error(`Pelican API unreachable – check backend logs (${response.status}: ${errorText})`);
        }
        
        const data = await response.json();
        log('DEBUG', 'Pelican API response received', { url, dataLength: JSON.stringify(data).length });
        return { response, data };
        
      } catch (error) {
        log('ERROR', 'Pelican API request exception', { 
          url, 
          error: error.message,
          stack: error.stack 
        });
        
        if (error.message.includes('Pelican API unreachable')) {
          throw error;
        }
        
        throw new Error('Could not contact Pelican – see logs');
      }
    };


    if (action === 'list_nests') {
      log('INFO', 'Fetching nests with eggs from Pelican');
      
      try {
        // Get all nests with eggs included
        const { response, data } = await makeApiRequest(`${pelicanApiUrl}/nests?include=eggs`);
        
        log('INFO', 'Successfully fetched nests', { 
          nestsCount: data?.data?.length || 0 
        });

        return new Response(JSON.stringify(data), {
          status: response.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    if (action === 'list_eggs') {
      log('INFO', 'Fetching eggs from Pelican');
      
      try {
        // List all eggs (games) from Pelican
        const { response, data } = await makeApiRequest(`${pelicanApiUrl}/eggs`);
        
        log('INFO', 'Successfully fetched eggs', { 
          eggsCount: data?.data?.length || 0 
        });

        return new Response(JSON.stringify(data), {
          status: response.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    if (action === 'create_server') {
      log('INFO', 'Creating server', { serverData });
      
      try {
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

        // Validate required fields
        if (!serverConfig.name || !serverConfig.nodeId) {
          throw new Error('Missing required fields: name or nodeId');
        }

        // Get egg information to use proper docker image and startup command
        let eggData = null;
        if (serverConfig.eggId) {
          try {
            const { response: eggResponse, data: eggResponseData } = await makeApiRequest(
              `${pelicanApiUrl}/eggs/${serverConfig.eggId}`
            );
            eggData = eggResponseData.attributes;
            log('INFO', 'Retrieved egg data', { eggId: serverConfig.eggId, eggName: eggData?.name });
          } catch (error) {
            log('WARN', 'Failed to fetch egg data, using defaults', { eggId: serverConfig.eggId, error: error.message });
          }
        }

        // Create server payload matching curl request exactly
        const serverPayload = {
          "external_id": serverConfig.name,
          "name": serverConfig.name,
          "description": `Server created for ${serverConfig.name}`,
          "user": parseInt(userId),
          "egg": parseInt(serverConfig.eggId || 1),
          "docker_image": eggData?.docker_image || "ghcr.io/pelican-dev/yolks:nodejs_18",
          "startup": eggData?.startup || "if [[ -d .git ]] && [[ \"{{AUTO_UPDATE}}\" == \"1\" ]]; then git pull; fi; if [[ ! -z ${NODE_PACKAGES} ]]; then /usr/local/bin/npm install ${NODE_PACKAGES}; fi; if [[ ! -z ${UNNODE_PACKAGES} ]]; then /usr/local/bin/npm uninstall ${UNNODE_PACKAGES}; fi; if [ -f /home/container/package.json ]; then /usr/local/bin/npm install; fi; /usr/local/bin/node /home/container/{{JS_FILE}}",
          "environment": eggData?.relationships?.variables?.data?.reduce((env: any, variable: any) => {
            env[variable.attributes.env_variable] = variable.attributes.default_value || "";
            return env;
          }, {}) || {},
          "skip_scripts": true,
          "oom_killer": true,
          "start_on_completion": true,
          "limits": {
            "memory": parseInt(serverConfig.memory || 1024),
            "swap": -1,
            "disk": parseInt(serverConfig.disk || 2048),
            "io": 0,
            "threads": "string",
            "cpu": parseInt(serverConfig.cpu || 100)
          },
          "feature_limits": {
            "databases": 0,
            "allocations": 0,
            "backups": 0
          },
          "allocation": {
            "default": "string",
            "additional": []
          },
          "deploy": {
            "locations": [parseInt(serverConfig.nodeId)],
            "tags": [],
            "dedicated_ip": true,
            "port_range": []
          }
        };
        
        log('INFO', 'Server creation payload prepared', { 
          name: serverPayload.name,
          egg: serverPayload.egg,
          dockerImage: serverPayload.docker_image,
          memory: serverPayload.limits.memory,
          node: serverPayload.deploy.locations[0]
        });
        
        // Create server using enhanced request wrapper
        const { response, data: pelicanData } = await makeApiRequest(`${pelicanApiUrl}/servers`, {
          method: 'POST',
          body: JSON.stringify(serverPayload)
        });
        
        if (response.ok) {
          log('INFO', 'Server created successfully', { 
            serverId: pelicanData.attributes.id,
            serverName: pelicanData.attributes.name 
          });
          
          // Update server record with Pelican server ID and configuration
          await supabase
            .from('servers')
            .update({ 
              pelican_server_id: pelicanData.attributes.id.toString(),
              status: 'installing',
              ram_mb: serverConfig.memory || 1024,
              cpu_pct: serverConfig.cpu || 100,
              disk_mb: serverConfig.disk || 2048,
              egg_id: serverConfig.eggId || 1
            })
            .eq('id', serverData.server_id);
        }

        return new Response(JSON.stringify(pelicanData), {
          status: response.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch (error) {
        log('ERROR', 'Server creation failed', { error: error.message, stack: error.stack });
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    if (action === 'list_nodes') {
      console.log('Fetching nodes from:', `${pelicanApiUrl}/nodes`)
      
      // First get all nodes from Pelican Application API
      pelicanResponse = await fetch(`${pelicanApiUrl}/nodes`, {
        headers: {
          'Authorization': `Bearer ${pelicanApiKey}`,
          'Accept': 'application/json'
        }
      })

      const responseData = await pelicanResponse.json()
      console.log('Pelican nodes response:', JSON.stringify(responseData, null, 2))
      console.log('Response status:', pelicanResponse.status)

      // Enrich nodes with real-time system stats from Wings daemon
      if (responseData.data && Array.isArray(responseData.data)) {
        const enrichedNodes = await Promise.all(
          responseData.data.map(async (node: any) => {
            try {
              const nodeAttributes = node.attributes
              console.log(`Fetching real-time stats for node ${nodeAttributes.id} (${nodeAttributes.fqdn})`)
              
              // Get real-time system stats from Wings daemon
              const wingsUrl = `${nodeAttributes.scheme}://${nodeAttributes.fqdn}:${nodeAttributes.daemon_listen}/api/system?v=2`
              console.log(`Wings API URL: ${wingsUrl}`)
              
              // Get node-specific token from Supabase secrets
              const nodeToken = Deno.env.get(`NODE_TOKEN_${nodeAttributes.id}`)
              if (!nodeToken) {
                console.warn(`No NODE_TOKEN found for node ${nodeAttributes.id}`)
                return node
              }
              
              const statsResponse = await fetch(wingsUrl, {
                headers: {
                  'Authorization': `Bearer ${nodeToken}`,
                  'Accept': 'application/json'
                }
              })
              
              if (statsResponse.ok) {
                const systemStats = await statsResponse.json()
                console.log(`Node ${nodeAttributes.id} real-time stats:`, systemStats)
                
                // Add real-time usage to node data
                nodeAttributes.real_time_stats = {
                  memory: systemStats.memory || {},
                  cpu: systemStats.cpu || {},
                  disk: systemStats.disk || {},
                  load: systemStats.load || {},
                  uptime: systemStats.uptime || 0,
                  network: systemStats.network || {}
                }
              } else {
                console.warn(`Failed to get real-time stats for node ${nodeAttributes.id}: ${statsResponse.status}`)
                console.warn(`Response: ${await statsResponse.text()}`)
              }
            } catch (error) {
              console.error(`Failed to get real-time stats for node ${node.attributes.id}:`, error)
            }
            
            return node
          })
        )
        
        responseData.data = enrichedNodes
      }

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

    if (action === 'delete_server') {
      console.log('Deleting server:', serverData.pelican_server_id)
      
      // Delete server from Pelican
      pelicanResponse = await fetch(`${pelicanApiUrl}/servers/${serverData.pelican_server_id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${pelicanApiKey}`,
          'Accept': 'application/json'
        }
      })

      console.log('Delete response status:', pelicanResponse.status)
      
      if (pelicanResponse.ok) {
        // Also delete from database
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

    if (action === 'sync_all_servers') {
      console.log('Syncing all server statuses from Pelican...')
      
      // Get all servers from database
      const { data: dbServers } = await supabase
        .from('servers')
        .select('id, pelican_server_id, node_id')
        .not('pelican_server_id', 'is', null)

      if (dbServers) {
        for (const dbServer of dbServers) {
          try {
            // Get server status from Pelican
            const response = await fetch(`${pelicanApiUrl}/servers/${dbServer.pelican_server_id}`, {
              headers: {
                'Authorization': `Bearer ${pelicanApiKey}`,
                'Accept': 'application/json'
              }
            })

            if (response.ok) {
              const data = await response.json()
              const server = data.attributes
              
              // Update server status in database
              await supabase
                .from('servers')
                .update({ 
                  status: server.status || 'unknown',
                  cpu_usage: server.resources?.cpu ? `${Math.round(server.resources.cpu)}%` : '0%',
                  memory_usage: server.resources?.memory ? `${Math.round(server.resources.memory / 1024 / 1024)}MB` : '0MB',
                  uptime: server.resources?.uptime ? `${Math.floor(server.resources.uptime / 86400)} days` : '0 days'
                })
                .eq('id', dbServer.id)
            }
          } catch (error) {
            console.error(`Failed to sync server ${dbServer.pelican_server_id}:`, error)
          }
        }
      }

      return new Response(JSON.stringify({ success: true, synced: dbServers?.length || 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (action === 'sync_servers_from_pelican') {
      console.log('Syncing servers from Pelican to database...')
      
      // Get all servers from Pelican
      const pelicanServersResponse = await fetch(`${pelicanApiUrl}/servers`, {
        headers: {
          'Authorization': `Bearer ${pelicanApiKey}`,
          'Accept': 'application/json'
        }
      })

      if (!pelicanServersResponse.ok) {
        throw new Error('Failed to fetch servers from Pelican')
      }

      const pelicanData = await pelicanServersResponse.json()
      const pelicanServers = pelicanData.data || []

      console.log(`Found ${pelicanServers.length} servers in Pelican`)

      // Get current servers in database
      const { data: dbServers } = await supabase
        .from('servers')
        .select('pelican_server_id, id')

      const existingPelicanIds = new Set(dbServers?.map(s => s.pelican_server_id) || [])

      // Add missing servers to database
      for (const server of pelicanServers) {
        const serverId = server.attributes.id.toString()
        
        if (!existingPelicanIds.has(serverId)) {
          console.log(`Adding new server ${serverId} to database`)
          
          // Create server record in database
          await supabase
            .from('servers')
            .insert({
              name: server.attributes.name,
              pelican_server_id: serverId,
              status: server.attributes.status || 'unknown',
              ram_mb: server.attributes.limits?.memory || 1024,
              cpu_pct: server.attributes.limits?.cpu || 100,
              disk_mb: server.attributes.limits?.disk || 2048,
              node_id: server.attributes.node?.toString() || null,
              location: 'pelican-sync',
              user_id: userId // Will need to be updated by admin
            })
        }
      }

      return new Response(JSON.stringify({ 
        success: true, 
        synced: pelicanServers.length,
        new_servers: pelicanServers.length - existingPelicanIds.size 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
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
