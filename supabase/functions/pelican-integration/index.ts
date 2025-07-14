
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
      log('INFO', 'Creating server with data', { serverData });
      
      try {
        // Build server configuration from form data
        const serverConfig = {
          server_name: serverData.name,
          user_id: parseInt(userId),
          egg_id: parseInt(serverData.eggId || 1),
          node_id: parseInt(serverData.nodeId),
          ram: parseInt(serverData.memory || 1024),
          disk: parseInt(serverData.disk || 2048),
          cpu: parseInt(serverData.cpu || 100),
          environment: serverData.environment || {},
          docker_image: serverData.docker_image || "ghcr.io/pterodactyl/yolks:java_17",
          startup: serverData.startup || "java -Xms128M -Xmx{{SERVER_MEMORY}}M -jar server.jar nogui"
        };

        // Validate required fields
        if (!serverConfig.server_name || !serverConfig.node_id) {
          throw new Error('Missing required fields: server_name or node_id');
        }

        // Generate external ID
        const externalId = `nexus-${serverConfig.user_id}-${crypto.randomUUID()}`;
        
        // Build payload exactly as specified in documentation
        const payload = {
          "name": serverConfig.server_name,
          "external_id": externalId,
          "description": "Created via Nexus",
          "user": serverConfig.user_id,
          "egg": serverConfig.egg_id,
          "docker_image": serverConfig.docker_image,
          "startup": serverConfig.startup,
          "environment": serverConfig.environment, // dict, not list
          "skip_scripts": false,
          "start_on_completion": true,
          "limits": {
            "memory": serverConfig.ram,
            "swap": -1,
            "disk": serverConfig.disk,
            "io": 500,
            "cpu": serverConfig.cpu
          },
          "feature_limits": { 
            "databases": 1, 
            "allocations": 1, 
            "backups": 5 
          },
          "deploy": { 
            "locations": [serverConfig.node_id], 
            "dedicated_ip": false, 
            "port_range": [] 
          }
        };

        log('INFO', 'Server creation payload', { 
          name: payload.name,
          user: payload.user,
          egg: payload.egg,
          memory: payload.limits.memory,
          locations: payload.deploy.locations
        });

        // Retry logic - max 2 retries for network errors
        let lastError: any = null;
        for (let attempt = 1; attempt <= 3; attempt++) {
          try {
            log('INFO', `Server creation attempt ${attempt}/3`);
            
            const { response, data: pelicanData } = await makeApiRequest(`${pelicanApiUrl}/servers`, {
              method: 'POST',
              body: JSON.stringify(payload)
            });

            if (response.ok) {
              log('INFO', 'Server created successfully', { 
                serverId: pelicanData.attributes.id,
                serverName: pelicanData.attributes.name,
                attempt: attempt
              });
              
              // Update server record with Pelican server ID and configuration
              await supabase
                .from('servers')
                .update({ 
                  pelican_server_id: pelicanData.attributes.id.toString(),
                  status: 'installing',
                  ram_mb: serverConfig.ram,
                  cpu_pct: serverConfig.cpu,
                  disk_mb: serverConfig.disk,
                  egg_id: serverConfig.egg_id
                })
                .eq('id', serverData.server_id);

              return new Response(JSON.stringify(pelicanData), {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              });
            } else {
              // HTTP error from Pelican
              const errorText = await response.text();
              log('ERROR', 'Pelican API error', {
                status: response.status,
                statusText: response.statusText,
                detail: errorText,
                payload: payload,
                attempt: attempt
              });
              
              if (attempt === 3) {
                return new Response(
                  JSON.stringify({ 
                    error: `Pelican returned ${response.status}. Check logs for details.`,
                    details: errorText
                  }),
                  { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                );
              }
            }
          } catch (networkError: any) {
            lastError = networkError;
            log('WARN', `Network error on attempt ${attempt}`, { 
              error: networkError.message,
              willRetry: attempt < 3
            });
            
            if (attempt < 3) {
              // Wait before retry
              await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
            }
          }
        }

        // All retries failed
        log('ERROR', 'All server creation attempts failed', { 
          error: lastError?.message,
          stack: lastError?.stack
        });
        
        return new Response(
          JSON.stringify({ error: "Pelican API unreachable after 3 attempts" }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      } catch (error: any) {
        log('ERROR', 'Server creation failed with exception', { 
          error: error.message, 
          stack: error.stack,
          serverData: serverData
        });
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    if (action === 'list_nodes') {
      log('INFO', 'Fetching nodes from Pelican');
      
      try {
        // Get all nodes from Pelican Application API
        const { response, data } = await makeApiRequest(`${pelicanApiUrl}/nodes`);
        
        log('INFO', 'Successfully fetched nodes', { 
          nodesCount: data?.data?.length || 0 
        });

        // Enrich nodes with real-time system stats from Wings daemon if available
        if (data.data && Array.isArray(data.data)) {
          const enrichedNodes = await Promise.all(
            data.data.map(async (node: any) => {
              try {
                const nodeAttributes = node.attributes;
                log('DEBUG', 'Processing node', { nodeId: nodeAttributes.id, fqdn: nodeAttributes.fqdn });
                
                // Get node-specific token from Supabase secrets
                const nodeToken = Deno.env.get(`NODE_TOKEN_${nodeAttributes.id}`);
                if (!nodeToken) {
                  log('WARN', 'No NODE_TOKEN found for node', { nodeId: nodeAttributes.id });
                  return node;
                }
                
                // Get real-time system stats from Wings daemon
                const wingsUrl = `${nodeAttributes.scheme}://${nodeAttributes.fqdn}:${nodeAttributes.daemon_listen}/api/system?v=2`;
                log('DEBUG', 'Fetching Wings stats', { wingsUrl });
                
                const statsResponse = await fetch(wingsUrl, {
                  headers: {
                    'Authorization': `Bearer ${nodeToken}`,
                    'Accept': 'application/json'
                  },
                  signal: AbortSignal.timeout(5000) // 5s timeout for Wings
                });
                
                if (statsResponse.ok) {
                  const systemStats = await statsResponse.json();
                  log('DEBUG', 'Wings stats retrieved', { nodeId: nodeAttributes.id });
                  
                  // Add real-time usage to node data
                  nodeAttributes.real_time_stats = {
                    memory: systemStats.memory || {},
                    cpu: systemStats.cpu || {},
                    disk: systemStats.disk || {},
                    load: systemStats.load || {},
                    uptime: systemStats.uptime || 0,
                    network: systemStats.network || {}
                  };
                } else {
                  log('WARN', 'Failed to get Wings stats', { 
                    nodeId: nodeAttributes.id, 
                    status: statsResponse.status 
                  });
                }
              } catch (error) {
                log('ERROR', 'Wings stats error', { 
                  nodeId: node.attributes.id, 
                  error: error.message 
                });
              }
              
              return node;
            })
          );
          
          data.data = enrichedNodes;
        }

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

    if (action === 'list_servers') {
      log('INFO', 'Fetching servers from Pelican');
      
      try {
        // List all servers from Pelican
        const { response, data } = await makeApiRequest(`${pelicanApiUrl}/servers`);
        
        log('INFO', 'Successfully fetched servers', { 
          serversCount: data?.data?.length || 0 
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

    if (action === 'get_server_status') {
      log('INFO', 'Getting server status', { pelicanServerId: serverData.pelican_server_id });
      
      try {
        // Get server status from Pelican
        const { response, data: pelicanData } = await makeApiRequest(
          `${pelicanApiUrl}/servers/${serverData.pelican_server_id}`
        );
        
        if (response.ok) {
          const server = pelicanData.attributes;
          // Update server status in database
          await supabase
            .from('servers')
            .update({ 
              status: server.status || 'unknown',
              cpu_usage: server.resources?.cpu ? `${Math.round(server.resources.cpu)}%` : '0%',
              memory_usage: server.resources?.memory ? `${Math.round(server.resources.memory / 1024 / 1024)}MB` : '0MB',
              uptime: server.resources?.uptime ? `${Math.floor(server.resources.uptime / 86400)} days` : '0 days'
            })
            .eq('pelican_server_id', serverData.pelican_server_id);
        }

        return new Response(JSON.stringify(pelicanData), {
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

    if (action === 'delete_server') {
      log('INFO', 'Deleting server', { pelicanServerId: serverData.pelican_server_id });
      
      try {
        // Delete server from Pelican
        const { response } = await makeApiRequest(
          `${pelicanApiUrl}/servers/${serverData.pelican_server_id}`,
          { method: 'DELETE' }
        );
        
        if (response.ok) {
          // Also delete from database
          await supabase
            .from('servers')
            .delete()
            .eq('pelican_server_id', serverData.pelican_server_id);
        }

        return new Response(JSON.stringify({ success: response.ok }), {
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
      log('INFO', 'Controlling server power', { pelicanServerId: serverData.pelican_server_id, action: serverData.power_action });
      
      try {
        // Control server power (start/stop/restart)
        const powerAction = serverData.power_action; // 'start', 'stop', 'restart'
        
        const { response } = await makeApiRequest(
          `http://81.2.233.110/api/client/servers/${serverData.pelican_server_id}/power`,
          {
            method: 'POST',
            body: JSON.stringify({ signal: powerAction })
          }
        );

        if (response.ok) {
          // Update server status optimistically
          let newStatus = 'unknown';
          switch (powerAction) {
            case 'start':
              newStatus = 'starting';
              break;
            case 'stop':
              newStatus = 'stopping';
              break;
            case 'restart':
              newStatus = 'starting';
              break;
          }

          await supabase
            .from('servers')
            .update({ status: newStatus })
            .eq('pelican_server_id', serverData.pelican_server_id);
        }

        return new Response(JSON.stringify({ success: response.ok }), {
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

    return new Response(JSON.stringify({ error: 'Unknown action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Pelican integration error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
