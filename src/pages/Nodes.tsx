import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { Server, Plus, MoreHorizontal, Cpu, HardDrive, MemoryStick, Users, Settings } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { AuthModal } from "@/components/AuthModal";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { NodeSettings } from "@/components/NodeSettings";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface NodeUsage {
  activeServers: number;
  totalServers: number;
  allocatedRam: number;
  allocatedCpu: number;
  allocatedDisk: number;
  serverNames: string[];
}

interface Node {
  id: number;
  uuid: string;
  name: string;
  description: string;
  public: boolean;
  fqdn: string;
  scheme: string;
  memory: number;
  memory_overallocate: number;
  disk: number;
  disk_overallocate: number;
  cpu: number;
  cpu_overallocate: number;
  maintenance_mode: boolean;
  created_at: string;
  updated_at: string;
  usage?: NodeUsage;
}

const Nodes = () => {
  const { user, userProfile } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [showNodeSettings, setShowNodeSettings] = useState(false);

  const handleSyncServers = async () => {
    try {
      await supabase.functions.invoke('pelican-integration', {
        body: { action: 'sync_servers_from_pelican' }
      });
    } catch (error) {
      console.error('Failed to sync servers:', error);
    }
  };

  const { data: nodes, isLoading, error } = useQuery({
    queryKey: ['nodes'],
    queryFn: async () => {
      if (!user) return [];
      
      console.log('Fetching nodes...');
      
      try {
        const { data, error } = await supabase.functions.invoke('pelican-integration', {
          body: {
            action: 'list_nodes'
          }
        });

        console.log('Pelican response:', data);
        console.log('Pelican error:', error);

        if (error) {
          console.error('Error fetching nodes:', error);
          throw error;
        }
        
        const nodeData = data?.data || data || [];
        console.log('Node data:', nodeData);
        
        if (!Array.isArray(nodeData)) {
          console.warn('Node data is not an array:', nodeData);
          return [];
        }
        
        // Sync servers from Pelican first
        await handleSyncServers();
        
        // Sync server statuses
        await supabase.functions.invoke('pelican-integration', {
          body: { action: 'sync_all_servers' }
        });

        // Get server allocation data for each node
        const nodesWithUsage = await Promise.all(
          nodeData.map(async (node: Node) => {
            try {
              const { data: servers } = await supabase
                .from('servers')
                .select('ram_mb, cpu_pct, disk_mb, status, name')
                .eq('node_id', node.id.toString());
              
              const activeServers = servers?.filter(s => s.status === 'running').length || 0;
              const totalServers = servers?.length || 0;
              const allocatedRam = servers?.reduce((sum, s) => sum + (s.ram_mb || 0), 0) || 0;
              const allocatedCpu = servers?.reduce((sum, s) => sum + (s.cpu_pct || 0), 0) || 0;
              const allocatedDisk = servers?.reduce((sum, s) => sum + (s.disk_mb || 0), 0) || 0;
              
              return {
                ...node,
                usage: {
                  activeServers,
                  totalServers,
                  allocatedRam,
                  allocatedCpu,
                  allocatedDisk,
                  serverNames: servers?.map(s => s.name) || []
                }
              };
            } catch (serverError) {
              console.warn('Error fetching servers for node:', node.id, serverError);
              return {
                ...node,
                usage: {
                  activeServers: 0,
                  totalServers: 0,
                  allocatedRam: 0,
                  allocatedCpu: 0,
                  allocatedDisk: 0,
                  serverNames: []
                }
              };
            }
          })
        );
        
        return nodesWithUsage;
      } catch (apiError) {
        console.error('API call failed:', apiError);
        throw apiError;
      }
    },
    enabled: !!user && !!userProfile,
    refetchInterval: 30000, // Refresh every 30 seconds
    retry: 2,
  });

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
              <p className="text-muted-foreground mb-4">Please sign in to view nodes.</p>
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
            <h1 className="text-3xl font-bold text-foreground">Nodes</h1>
            <p className="text-muted-foreground mt-1">Available server nodes for deployment</p>
          </div>
        </div>

        {/* Node Grid */}
        {isLoading ? (
          <div className="text-center py-8">Loading nodes...</div>
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-red-400 mb-2">Error loading nodes: {error.message}</p>
            <Button onClick={() => window.location.reload()}>Retry</Button>
          </div>
        ) : !nodes || nodes.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No nodes available.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {nodes.map((node: Node) => (
              <div key={node.id} className="forpsi-card p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-[hsl(var(--forpsi-cyan))] rounded-lg flex items-center justify-center">
                      <Server className="w-5 h-5 text-[hsl(var(--forpsi-charcoal))]" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{node.name}</h3>
                      <div className="flex items-center space-x-2">
                        <div className={`w-2 h-2 rounded-full ${
                          node.maintenance_mode ? 'bg-yellow-400' : 'bg-green-400'
                        }`}></div>
                        <span className="text-sm text-muted-foreground">
                          {node.maintenance_mode ? 'Maintenance' : 'Online'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="p-2 hover:bg-sidebar-accent rounded-lg transition-colors">
                        <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="bg-background border-border z-50">
                      <DropdownMenuItem 
                        onClick={() => {
                          setSelectedNode(node);
                          setShowNodeSettings(true);
                        }}
                        className="cursor-pointer hover:bg-sidebar-accent"
                      >
                        <Settings className="w-4 h-4 mr-2" />
                        Settings
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground flex items-center space-x-1">
                      <MemoryStick className="w-3 h-3" />
                      <span>Memory</span>
                    </span>
                    <span className="text-foreground font-medium">
                      {node.usage?.allocatedRam || 0}MB / {(node.memory || 0).toLocaleString()}MB
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground flex items-center space-x-1">
                      <HardDrive className="w-3 h-3" />
                      <span>Disk</span>
                    </span>
                    <span className="text-foreground font-medium">
                      {node.usage?.allocatedDisk || 0}MB / {(node.disk || 0).toLocaleString()}MB
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground flex items-center space-x-1">
                      <Cpu className="w-3 h-3" />
                      <span>CPU</span>
                    </span>
                    <span className="text-foreground font-medium">
                      {node.usage?.allocatedCpu || 0}% / {node.cpu || 0}%
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground flex items-center space-x-1">
                      <Users className="w-3 h-3" />
                      <span>Servers</span>
                    </span>
                    <span className="text-foreground font-medium">
                      {node.usage?.activeServers || 0} active
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">FQDN</span>
                    <span className="text-foreground font-medium text-xs">{node.fqdn}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Overallocation</span>
                    <span className="text-foreground font-medium text-xs">
                      RAM: {node.memory_overallocate || 0}% | CPU: {node.cpu_overallocate || 0}% | Disk: {node.disk_overallocate || 0}%
                    </span>
                  </div>
                </div>

                {node.description && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <p className="text-sm text-muted-foreground">{node.description}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      
      <NodeSettings
        isOpen={showNodeSettings}
        onClose={() => setShowNodeSettings(false)}
        node={selectedNode}
        onNodeUpdated={() => {
          // Refresh nodes data
        }}
      />
    </Layout>
  );
};

export default Nodes;