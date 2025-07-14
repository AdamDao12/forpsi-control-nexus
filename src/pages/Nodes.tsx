import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { Server, Plus, MoreHorizontal, Cpu, HardDrive, MemoryStick, Users } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { AuthModal } from "@/components/AuthModal";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";

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

  const { data: nodes, isLoading } = useQuery({
    queryKey: ['nodes'],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase.functions.invoke('pelican-integration', {
        body: {
          action: 'list_nodes'
        }
      });

      if (error) {
        console.error('Error fetching nodes:', error);
        throw error;
      }
      
      const nodeData = data?.data || [];
      
      // Get server allocation data for each node
      const nodesWithUsage = await Promise.all(
        nodeData.map(async (node: Node) => {
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
        })
      );
      
      return nodesWithUsage;
    },
    enabled: !!user && !!userProfile,
    refetchInterval: 30000, // Refresh every 30 seconds
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
                  <button className="p-2 hover:bg-sidebar-accent rounded-lg transition-colors">
                    <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground flex items-center space-x-1">
                      <MemoryStick className="w-3 h-3" />
                      <span>Memory</span>
                    </span>
                    <span className="text-foreground font-medium">
                      {node.usage?.allocatedRam || 0}MB / {node.memory}MB
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground flex items-center space-x-1">
                      <HardDrive className="w-3 h-3" />
                      <span>Disk</span>
                    </span>
                    <span className="text-foreground font-medium">
                      {node.usage?.allocatedDisk || 0}MB / {node.disk}MB
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground flex items-center space-x-1">
                      <Cpu className="w-3 h-3" />
                      <span>CPU</span>
                    </span>
                    <span className="text-foreground font-medium">
                      {node.usage?.allocatedCpu || 0}% / {node.cpu}%
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground flex items-center space-x-1">
                      <Users className="w-3 h-3" />
                      <span>Servers</span>
                    </span>
                    <span className="text-foreground font-medium">
                      {node.usage?.activeServers || 0} / {node.usage?.totalServers || 0}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">FQDN</span>
                    <span className="text-foreground font-medium text-xs">{node.fqdn}</span>
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
    </Layout>
  );
};

export default Nodes;