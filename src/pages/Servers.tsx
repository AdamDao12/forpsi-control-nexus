
import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { Server, Plus, Power, Settings, MoreHorizontal, Trash2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { AuthModal } from "@/components/AuthModal";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ServerCreationModal } from "@/components/ServerCreationModal";

interface Server {
  id: string;
  name: string;
  status: string;
  cpu_usage: string | null;
  memory_usage: string | null;
  location: string;
  uptime: string | null;
  pelican_server_id: number | null;
  created_at: string;
}

const Servers = () => {
  const { user, userProfile } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: servers, isLoading } = useQuery({
    queryKey: ['servers'],
    queryFn: async () => {
      if (!user) return [];
      
      // Fetch servers from database first
      const { data: dbServers, error: dbError } = await supabase
        .from('servers')
        .select('*')
        .order('created_at', { ascending: false });

      if (dbError) {
        console.error('Error fetching servers from DB:', dbError);
        throw dbError;
      }

      // Also fetch real-time data from Pelican API
      try {
        const { data: pelicanData, error: pelicanError } = await supabase.functions.invoke('pelican-integration', {
          body: {
            action: 'list_servers'
          }
        });

        if (!pelicanError && pelicanData?.data) {
          // Merge Pelican data with database data
          const updatedServers = dbServers.map(dbServer => {
            const pelicanServer = pelicanData.data.find((ps: any) => 
              ps.attributes.id.toString() === dbServer.pelican_server_id
            );
            
            if (pelicanServer) {
              return {
                ...dbServer,
                status: pelicanServer.attributes.status || dbServer.status,
                cpu_usage: pelicanServer.attributes.resources?.cpu ? `${Math.round(pelicanServer.attributes.resources.cpu)}%` : dbServer.cpu_usage,
                memory_usage: pelicanServer.attributes.resources?.memory ? `${Math.round(pelicanServer.attributes.resources.memory / 1024 / 1024)}MB` : dbServer.memory_usage,
                uptime: pelicanServer.attributes.resources?.uptime ? `${Math.floor(pelicanServer.attributes.resources.uptime / 86400)} days` : dbServer.uptime
              };
            }
            return dbServer;
          });
          
          return updatedServers;
        }
      } catch (error) {
        console.warn('Could not fetch Pelican data:', error);
      }

      return dbServers as Server[];
    },
    enabled: !!user,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Server creation is handled by the modal

  const toggleServerMutation = useMutation({
    mutationFn: async ({ serverId, action }: { serverId: string; action: 'start' | 'stop' }) => {
      const { data, error } = await supabase.functions.invoke('pelican-integration', {
        body: {
          action: action === 'start' ? 'start_server' : 'stop_server',
          serverData: { server_id: serverId }
        }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['servers'] });
      toast({
        title: "Server Updated",
        description: "Server status has been updated.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update server",
        variant: "destructive",
      });
    },
  });

  const handleCreateServer = () => {
    console.log('🎯 Create server button clicked');
    setShowCreateModal(true);
    console.log('🎯 Modal state set to true');
  };

  const deleteServerMutation = useMutation({
    mutationFn: async (serverId: string) => {
      const server = servers?.find(s => s.id === serverId);
      if (!server) {
        throw new Error('Server not found');
      }

      // If server has no Pelican ID, just delete from database
      if (!server.pelican_server_id) {
        const { error } = await supabase
          .from('servers')
          .delete()
          .eq('id', serverId);
        
        if (error) throw error;
        return { success: true, local_only: true };
      }

      // Delete from Pelican if it has a pelican_server_id
      const { data, error } = await supabase.functions.invoke('pelican-integration', {
        body: {
          action: 'delete_server',
          serverData: { pelican_server_id: server.pelican_server_id }
        }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['servers'] });
      toast({
        title: "Server Deleted",
        description: data?.local_only 
          ? "Server has been removed from your account." 
          : "Server has been deleted successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete server",
        variant: "destructive",
      });
    },
  });

  const handleToggleServer = (server: Server) => {
    const action = server.status === 'running' ? 'stop' : 'start';
    toggleServerMutation.mutate({ serverId: server.id, action });
  };

  const handleDeleteServer = (serverId: string) => {
    if (confirm('Are you sure you want to delete this server? This action cannot be undone.')) {
      deleteServerMutation.mutate(serverId);
    }
  };

  useEffect(() => {
    if (!user) {
      setShowAuthModal(true);
    }
  }, [user]);

  if (!user) {
    return (
      <>
        <Layout>
          <div className="p-6 flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-4">Authentication Required</h2>
              <p className="text-muted-foreground mb-4">Please sign in to access your servers.</p>
              <Button onClick={() => setShowAuthModal(true)}>Sign In</Button>
            </div>
          </div>
        </Layout>
        <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
      </>
    );
  }

  return (
    <Layout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Servers</h1>
            <p className="text-muted-foreground mt-1">Manage your server instances</p>
          </div>
          <button 
            onClick={handleCreateServer}
            className="forpsi-button-primary flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Create Server</span>
          </button>
        </div>

        {/* Server Grid */}
        {isLoading ? (
          <div className="text-center py-8">Loading servers...</div>
        ) : !servers || servers.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No servers found. Create your first server to get started!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {servers.map((server) => (
              <div key={server.id} className="forpsi-card p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-[hsl(var(--forpsi-cyan))] rounded-lg flex items-center justify-center">
                      <Server className="w-5 h-5 text-[hsl(var(--forpsi-charcoal))]" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{server.name}</h3>
                      <div className="flex items-center space-x-2">
                        <div className={`w-2 h-2 rounded-full ${
                          server.status === 'running' ? 'bg-green-400' : 
                          server.status === 'creating' ? 'bg-yellow-400' :
                          'bg-red-400'
                        }`}></div>
                        <span className="text-sm text-muted-foreground capitalize">{server.status}</span>
                      </div>
                    </div>
                  </div>
                  <button className="p-2 hover:bg-sidebar-accent rounded-lg transition-colors">
                    <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">CPU Usage</span>
                    <span className="text-foreground font-medium">{server.cpu_usage || '0%'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Memory</span>
                    <span className="text-foreground font-medium">{server.memory_usage || '0GB'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Location</span>
                    <span className="text-foreground font-medium">{server.location}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Uptime</span>
                    <span className="text-foreground font-medium">{server.uptime || '0 days'}</span>
                  </div>
                </div>

                <div className="flex space-x-2 mt-4 pt-4 border-t border-border">
                  <button 
                    onClick={() => handleToggleServer(server)}
                    disabled={toggleServerMutation.isPending || server.status === 'creating'}
                    className="flex-1 forpsi-button-secondary flex items-center justify-center space-x-2"
                  >
                    <Power className="w-4 h-4" />
                    <span>
                      {server.status === 'creating' ? 'Creating...' :
                       server.status === 'running' ? 'Stop' : 'Start'}
                    </span>
                  </button>
                  <button className="bg-muted hover:bg-muted/80 text-foreground transition-colors rounded-lg px-4 py-2 font-medium flex items-center justify-center space-x-2">
                    <Settings className="w-4 h-4" />
                    <span>Configure</span>
                  </button>
                  <button 
                    onClick={() => handleDeleteServer(server.id)}
                    disabled={deleteServerMutation.isPending}
                    className="bg-destructive hover:bg-destructive/80 text-destructive-foreground transition-colors rounded-lg px-4 py-2 font-medium flex items-center justify-center space-x-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        
        <ServerCreationModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onServerCreated={() => {
            queryClient.invalidateQueries({ queryKey: ['servers'] });
            setShowCreateModal(false);
          }}
        />
      </div>
    </Layout>
  );
};

export default Servers;
