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
      log('ERROR', 'Missing Pelican API key');
      return new Response(
        JSON.stringify({ error: 'Pelican API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // API request helper with enhanced error handling and logging
    const makeApiRequest = async (url: string, options: any = {}) => {
      const requestOptions = {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${pelicanApiKey}`,
          'Content-Type': 'application/json',
        },
        ...options
      };

      log('INFO', 'Making API request', { 
        url: url.replace(pelicanApiKey, '[REDACTED]'),
        method: requestOptions.method 
      });

      try {
        const response = await fetch(url, requestOptions);
        const responseText = await response.text();
        
        let data;
        try {
          data = JSON.parse(responseText);
        } catch {
          data = responseText;
        }

        log('INFO', 'API response received', { 
          status: response.status,
          ok: response.ok,
          dataLength: typeof data === 'string' ? data.length : Object.keys(data || {}).length
        });

        return { response, data };
      } catch (error) {
        log('ERROR', 'API request failed', { 
          url: url.replace(pelicanApiKey, '[REDACTED]'),
          error: error.message,
          stack: error.stack
        });
        
        throw new Error('Could not contact Pelican – see logs');
      }
    };

    // CREATE SERVER ACTION
    if (action === 'create_server') {
      const requestId = crypto.randomUUID().substring(0, 8);
      log('INFO', 'Creating server - request started', { 
        requestId,
        serverData,
        userId: user.id,
        timestamp: new Date().toISOString()
      });
      
      try {
        // Build server configuration from form data
        const serverConfig = {
          server_name: serverData.name,
          user_id: parseInt(userId) || 1, // Use actual user ID or fallback to 1
          egg_id: parseInt(serverData.eggId || 1),
          node_id: parseInt(serverData.nodeId),
          ram: parseInt(serverData.memory || 1024),
          disk: parseInt(serverData.disk || 2048),
          cpu: parseInt(serverData.cpu || 100),
          environment: serverData.environment || {},
          docker_image: serverData.docker_image || "ghcr.io/pterodactyl/yolks:java_17",
          startup: serverData.startup || "java -Xms128M -Xmx{{SERVER_MEMORY}}M -jar server.jar nogui"
        };

        log('INFO', 'Server configuration built', { requestId, serverConfig });

        // Validate required fields with better error messages
        if (!serverConfig.server_name || serverConfig.server_name.trim() === '') {
          throw new Error('Server name is required and cannot be empty');
        }
        
        if (!serverConfig.node_id || isNaN(serverConfig.node_id)) {
          throw new Error(`Invalid node ID: ${serverData.nodeId}. Please select a valid node.`);
        }

        if (serverConfig.ram < 256 || serverConfig.ram > 32768) {
          throw new Error('RAM must be between 256MB and 32GB');
        }

        if (serverConfig.disk < 512 || serverConfig.disk > 1000000) {
          throw new Error('Disk space must be between 512MB and 1TB');
        }

        if (serverConfig.cpu < 25 || serverConfig.cpu > 1000) {
          throw new Error('CPU allocation must be between 25% and 1000%');
        }

        // Generate external ID
        const externalId = `nexus-${serverConfig.user_id}-${crypto.randomUUID().substring(0, 8)}`;
        
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

        log('INFO', 'Payload prepared for Pelican API', { 
          requestId,
          payloadSummary: {
            name: payload.name,
            user: payload.user,
            egg: payload.egg,
            memory: payload.limits.memory,
            locations: payload.deploy.locations
          }
        });

        // Retry logic - max 3 attempts for network errors
        let lastError: any = null;
        for (let attempt = 1; attempt <= 3; attempt++) {
          try {
            log('INFO', `Server creation attempt ${attempt}/3`, { requestId });
            
            const { response, data: pelicanData } = await makeApiRequest(`${pelicanApiUrl}/servers`, {
              method: 'POST',
              body: JSON.stringify(payload)
            });

            log('INFO', 'Pelican API response received', { 
              requestId,
              status: response.status,
              ok: response.ok,
              attempt
            });

            if (response.ok) {
              log('INFO', 'Server created successfully', { 
                requestId,
                serverId: pelicanData.attributes?.id,
                serverName: pelicanData.attributes?.name,
                attempt: attempt
              });
              
              // Update server record with Pelican server ID and configuration
              if (serverData.server_id) {
                const updateResult = await supabase
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

                log('INFO', 'Database updated', { 
                  requestId,
                  updateError: updateResult.error?.message,
                  serverId: serverData.server_id
                });
              }

              return new Response(JSON.stringify({
                success: true,
                data: pelicanData,
                message: 'Server created successfully'
              }), {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              });
            } else {
              // HTTP error from Pelican
              const errorText = typeof pelicanData === 'string' ? pelicanData : JSON.stringify(pelicanData);
              log('ERROR', 'Pelican API error', {
                requestId,
                status: response.status,
                statusText: response.statusText,
                errorText: errorText,
                payload: payload,
                attempt: attempt
              });
              
              if (attempt === 3) {
                return new Response(JSON.stringify({ 
                  success: false,
                  error: `Pelican API error: ${response.status}`,
                  details: errorText,
                  payload: payload
                }), {
                  status: 502,
                  headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
              }
            }
          } catch (networkError: any) {
            lastError = networkError;
            log('ERROR', `Network error on attempt ${attempt}`, { 
              requestId,
              error: networkError.message,
              stack: networkError.stack,
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
          requestId,
          error: lastError?.message,
          stack: lastError?.stack
        });
        
        return new Response(JSON.stringify({ 
          success: false,
          error: "Pelican API unreachable after 3 attempts",
          details: lastError?.message
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

      } catch (error: any) {
        log('ERROR', 'Server creation failed with exception', { 
          requestId,
          error: error.message, 
          stack: error.stack,
          serverData: serverData
        });
        return new Response(JSON.stringify({ 
          success: false,
          error: error.message,
          details: 'Check function logs for more details'
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // LIST NESTS ACTION  
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

    // LIST EGGS ACTION
    if (action === 'list_eggs') {
      log('INFO', 'Fetching eggs from Pelican');
      
      try {
        // Get all eggs
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

    // LIST NODES ACTION
    if (action === 'list_nodes') {
      log('INFO', 'Fetching nodes from Pelican');
      
      try {
        // Get all nodes from Pelican Application API
        const { response, data } = await makeApiRequest(`${pelicanApiUrl}/nodes`);
        
        log('INFO', 'Successfully fetched nodes', { 
          nodesCount: data?.data?.length || 0 
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

    // LIST SERVERS ACTION
    if (action === 'list_servers') {
      log('INFO', 'Fetching servers from Pelican');
      
      try {
        // Get all servers from Pelican
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

    // TOGGLE SERVER ACTION
    if (action === 'toggle_server') {
      const { serverId, currentStatus } = serverData;
      const newAction = currentStatus === 'running' ? 'stop' : 'start';
      
      log('INFO', `${newAction.toUpperCase()} server`, { serverId, currentStatus });
      
      try {
        const { response, data } = await makeApiRequest(
          `${pelicanApiUrl}/servers/${serverId}/power`, 
          {
            method: 'POST',
            body: JSON.stringify({ signal: newAction })
          }
        );

        log('INFO', `Server ${newAction} command sent`, { 
          serverId,
          status: response.status 
        });

        return new Response(JSON.stringify({ 
          success: response.ok,
          action: newAction,
          data 
        }), {
          status: response.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } catch (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // DELETE SERVER ACTION
    if (action === 'delete_server') {
      const { serverId } = serverData;
      
      log('INFO', 'Deleting server', { serverId });
      
      try {
        const { response, data } = await makeApiRequest(
          `${pelicanApiUrl}/servers/${serverId}`, 
          { method: 'DELETE' }
        );

        log('INFO', 'Server deleted from Pelican', { 
          serverId,
          status: response.status 
        });

        return new Response(JSON.stringify({ 
          success: response.ok,
          data 
        }), {
          status: response.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } catch (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Unknown action
    log('ERROR', 'Unknown action requested', { action });
    return new Response(
      JSON.stringify({ error: `Unknown action: ${action}` }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    log('ERROR', 'Edge function error', { 
      error: error.message,
      stack: error.stack 
    });
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});