import { useState } from "react";
import { Layout } from "@/components/Layout";
import { Server, Plus, MoreHorizontal, Cpu, HardDrive, MemoryStick, Users, Settings } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { AuthModal } from "@/components/AuthModal";
import { Button } from "@/components/ui/button";
import { NodeSettings } from "@/components/NodeSettings";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const Nodes = () => {
  const { user, userProfile } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [showNodeSettings, setShowNodeSettings] = useState(false);

  // Mock data for demo
  const mockNodes = [
    {
      id: 1,
      name: "Node Prague",
      fqdn: "node1.forpsi.com",
      description: "Primary datacenter node",
      memory: { used: 16384, total: 32768 },
      disk: { used: 120000, total: 500000 },
      cpu: { used: 65, total: 100 },
      servers: 8,
      maintenance_mode: false,
      public: true,
      location_id: 1,
      scheme: "https",
      behind_proxy: false,
      daemon_listen: 8080,
      daemon_sftp: 2022
    },
    {
      id: 2,
      name: "Node Brno", 
      fqdn: "node2.forpsi.com",
      description: "Secondary datacenter node",
      memory: { used: 8192, total: 16384 },
      disk: { used: 80000, total: 250000 },
      cpu: { used: 45, total: 100 },
      servers: 5,
      maintenance_mode: false,
      public: true,
      location_id: 2,
      scheme: "https",
      behind_proxy: false,
      daemon_listen: 8080,
      daemon_sftp: 2022
    }
  ];

  if (!user) {
    return (
      <>
        <Layout>
          <div className="p-6 flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-4">Authentication Required</h2>
              <p className="text-muted-foreground mb-4">Please sign in to access node management.</p>
              <Button onClick={() => setShowAuthModal(true)}>Sign In</Button>
            </div>
          </div>
        </Layout>
        <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
      </>
    );
  }

  const isAdmin = userProfile?.role === 'admin';

  return (
    <Layout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Nodes</h1>
            <p className="text-muted-foreground mt-1">
              {isAdmin ? 'Manage server nodes and their configurations (Demo)' : 'View available server nodes (Demo)'}
            </p>
          </div>
          {isAdmin && (
            <Button className="flex items-center space-x-2">
              <Plus className="w-4 h-4" />
              <span>Add Node</span>
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {mockNodes.map((node) => (
            <div key={node.id} className="forpsi-card p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-[hsl(var(--forpsi-cyan))]/10 rounded-lg">
                    <Server className="w-6 h-6 text-[hsl(var(--forpsi-cyan))]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{node.name}</h3>
                    <p className="text-sm text-muted-foreground">{node.fqdn}</p>
                  </div>
                </div>
                {isAdmin && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-background border-border">
                      <DropdownMenuItem 
                        onClick={() => {
                          setSelectedNode(node);
                          setShowNodeSettings(true);
                        }}
                        className="hover:bg-sidebar-accent"
                      >
                        <Settings className="w-4 h-4 mr-2" />
                        Settings
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Servers:</span>
                    <span className="font-medium text-foreground">{node.servers}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${
                      node.maintenance_mode ? 'bg-yellow-400' : 'bg-green-400'
                    }`}></div>
                    <span className="text-sm text-muted-foreground">
                      {node.maintenance_mode ? 'Maintenance' : 'Online'}
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <div className="flex items-center space-x-1">
                        <MemoryStick className="w-3 h-3" />
                        <span>Memory</span>
                      </div>
                      <span>{((node.memory.used / node.memory.total) * 100).toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-[hsl(var(--forpsi-blue))] h-2 rounded-full transition-all duration-300"
                        style={{ width: `${(node.memory.used / node.memory.total) * 100}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>{(node.memory.used / 1024).toFixed(1)} GB</span>
                      <span>{(node.memory.total / 1024).toFixed(1)} GB</span>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <div className="flex items-center space-x-1">
                        <HardDrive className="w-3 h-3" />
                        <span>Storage</span>
                      </div>
                      <span>{((node.disk.used / node.disk.total) * 100).toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-[hsl(var(--forpsi-orange))] h-2 rounded-full transition-all duration-300"
                        style={{ width: `${(node.disk.used / node.disk.total) * 100}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>{(node.disk.used / 1024).toFixed(1)} GB</span>
                      <span>{(node.disk.total / 1024).toFixed(1)} GB</span>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <div className="flex items-center space-x-1">
                        <Cpu className="w-3 h-3" />
                        <span>CPU Usage</span>
                      </div>
                      <span>{node.cpu.used}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-[hsl(var(--forpsi-green))] h-2 rounded-full transition-all duration-300"
                        style={{ width: `${node.cpu.used}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {showNodeSettings && selectedNode && (
          <NodeSettings
            node={selectedNode}
            isOpen={showNodeSettings}
            onClose={() => {
              setShowNodeSettings(false);
              setSelectedNode(null);
            }}
            onNodeUpdated={() => {
              // Mock node update
              setShowNodeSettings(false);
              setSelectedNode(null);
            }}
          />
        )}
      </div>
    </Layout>
  );
};

export default Nodes;