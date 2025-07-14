import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface ServerCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onServerCreated: () => void;
}

export const ServerCreationModal = ({ isOpen, onClose, onServerCreated }: ServerCreationModalProps) => {
  const [formData, setFormData] = useState({
    name: '',
    location: 'Prague',
    memory: 1024,
    cpu: 100,
    disk: 2048,
    nodeId: '',
    eggId: 1
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Fetch available nodes
  const { data: nodes } = useQuery({
    queryKey: ['nodes-for-creation'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('pelican-integration', {
        body: { action: 'list_nodes' }
      });
      if (error) throw error;
      return data?.data || [];
    },
    enabled: isOpen,
  });

  // Fetch available callouts (game templates)
  const { data: callouts } = useQuery({
    queryKey: ['callouts-for-creation'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('callouts')
        .select('*')
        .eq('is_active', true)
        .order('label');
      if (error) throw error;
      return data || [];
    },
    enabled: isOpen,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // First create server record in database
      const { data: newServer, error: dbError } = await supabase
        .from('servers')
        .insert({
          user_id: (await supabase.auth.getUser()).data.user?.id,
          name: formData.name,
          location: formData.location,
          status: 'creating',
          ram_mb: formData.memory,
          cpu_pct: formData.cpu,
          disk_mb: formData.disk,
          node_id: formData.nodeId
        })
        .select()
        .single();

      if (dbError) throw dbError;

      // Then call Pelican integration to create the actual server
      const { data, error } = await supabase.functions.invoke('pelican-integration', {
        body: {
          action: 'create_server',
          serverData: {
            ...formData,
            server_id: newServer.id,
            egg_id: formData.eggId,
            node_id: formData.nodeId
          },
          userId: (await supabase.auth.getUser()).data.user?.id
        }
      });

      if (error) throw error;

      toast({
        title: "Server Created",
        description: "Your server is being created and will be available shortly.",
      });
      
      onServerCreated();
      onClose();
      setFormData({
        name: '',
        location: 'Prague',
        memory: 1024,
        cpu: 100,
        disk: 2048,
        nodeId: '',
        eggId: 1
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create server",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background border border-border rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Create New Server</h3>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Server Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                placeholder="My Game Server"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Location</label>
              <select
                value={formData.location}
                onChange={(e) => setFormData({...formData, location: e.target.value})}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
              >
                <option value="Prague">Prague</option>
                <option value="Brno">Brno</option>
                <option value="Ostrava">Ostrava</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Node *</label>
            <select
              value={formData.nodeId}
              onChange={(e) => setFormData({...formData, nodeId: e.target.value})}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
              required
            >
              <option value="">Select a node</option>
              {nodes?.map((node: any) => (
                <option key={node.id} value={node.id.toString()}>
                  {node.name} ({node.fqdn}) - RAM: {node.memory}MB, CPU: {node.cpu}%
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Game Template</label>
            <select
              value={formData.eggId}
              onChange={(e) => setFormData({...formData, eggId: parseInt(e.target.value)})}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
            >
              {callouts?.map((callout: any) => (
                <option key={callout.id} value={callout.egg_id}>
                  {callout.label} (RAM: {callout.default_ram}MB, CPU: {callout.default_cpu}%, Disk: {callout.default_disk}MB)
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Memory (MB)</label>
              <input
                type="number"
                value={formData.memory}
                onChange={(e) => setFormData({...formData, memory: parseInt(e.target.value)})}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                min="512"
                max="8192"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">CPU (%)</label>
              <input
                type="number"
                value={formData.cpu}
                onChange={(e) => setFormData({...formData, cpu: parseInt(e.target.value)})}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                min="50"
                max="500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Disk (MB)</label>
              <input
                type="number"
                value={formData.disk}
                onChange={(e) => setFormData({...formData, disk: parseInt(e.target.value)})}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                min="1024"
                max="10240"
              />
            </div>
          </div>
          
          <div className="flex space-x-3 pt-4">
            <Button
              type="submit"
              disabled={isLoading || !formData.name || !formData.nodeId}
              className="flex-1"
            >
              {isLoading ? 'Creating Server...' : 'Create Server'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};