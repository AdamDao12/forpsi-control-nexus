import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ServerCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onServerCreated: () => void;
}

export const ServerCreationModal = ({ isOpen, onClose, onServerCreated }: ServerCreationModalProps) => {
  console.log('ServerCreationModal render - isOpen:', isOpen);
  
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    memory: 1024,
    cpu: 100,
    disk: 2048,
    nodeId: "",
    eggId: 1,
    location: "default"
  });

  // Fetch available nodes
  const { data: nodes = [], isLoading: nodesLoading } = useQuery({
    queryKey: ['nodes-for-creation'],
    queryFn: async () => {
      console.log('Fetching nodes for modal...');
      try {
        const { data, error } = await supabase.functions.invoke('pelican-integration', {
          body: { action: 'list_nodes' }
        });
        console.log('Modal nodes response:', data);
        console.log('Modal nodes error:', error);
        if (error) throw error;
        return data?.data || data || [];
      } catch (error) {
        console.error('Failed to fetch nodes:', error);
        return [];
      }
    },
    enabled: isOpen,
  });

  // Fetch available callouts (game templates)
  const { data: callouts = [] } = useQuery({
    queryKey: ['callouts-for-creation'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('callouts')
          .select('*')
          .eq('is_active', true)
          .order('label');
        if (error) throw error;
        return data || [];
      } catch (error) {
        console.error('Failed to fetch callouts:', error);
        return [];
      }
    },
    enabled: isOpen,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submit started');
    console.log('Form data:', formData);
    setIsLoading(true);

    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('User not authenticated');
      }

      // First create server record in database
      const { data: newServer, error: dbError } = await supabase
        .from('servers')
        .insert({
          user_id: user.id,
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
          userId: user.id
        }
      });

      if (error) throw error;

      toast({
        title: "Server Created",
        description: "Your server is being created and will be available shortly.",
      });
      
      onServerCreated();
      onClose();
      
      // Reset form
      setFormData({
        name: "",
        memory: 1024,
        cpu: 100,
        disk: 2048,
        nodeId: "",
        eggId: 1,
        location: "default"
      });
    } catch (error: any) {
      console.error('Server creation failed:', error);
      toast({
        title: "Server Creation Failed",
        description: error.message || "Failed to create server. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] bg-background border-border z-[100]">
        <DialogHeader>
          <DialogTitle className="text-foreground">Create New Server</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Server Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter server name"
                required
                className="bg-background border-border"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="node">Node</Label>
              <Select 
                value={formData.nodeId} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, nodeId: value }))}
                required
              >
                <SelectTrigger className="bg-background border-border">
                  <SelectValue placeholder={nodesLoading ? "Loading nodes..." : "Select a node"} />
                </SelectTrigger>
                <SelectContent className="bg-background border-border z-50">
                  {nodes.map((node: any) => (
                    <SelectItem key={node.id} value={node.id.toString()} className="hover:bg-sidebar-accent">
                      {node.name} ({node.fqdn})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="game">Game Template</Label>
              <Select 
                value={formData.eggId.toString()} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, eggId: parseInt(value) }))}
                required
              >
                <SelectTrigger className="bg-background border-border">
                  <SelectValue placeholder="Select a game template" />
                </SelectTrigger>
                <SelectContent className="bg-background border-border z-50">
                  {callouts.map((callout: any) => (
                    <SelectItem key={callout.id} value={callout.egg_id.toString()} className="hover:bg-sidebar-accent">
                      {callout.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="memory">Memory (MB)</Label>
                <Input
                  id="memory"
                  type="number"
                  value={formData.memory}
                  onChange={(e) => setFormData(prev => ({ ...prev, memory: parseInt(e.target.value) }))}
                  min="512"
                  max="16384"
                  className="bg-background border-border"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cpu">CPU (%)</Label>
                <Input
                  id="cpu"
                  type="number"
                  value={formData.cpu}
                  onChange={(e) => setFormData(prev => ({ ...prev, cpu: parseInt(e.target.value) }))}
                  min="50"
                  max="500"
                  className="bg-background border-border"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="disk">Disk (MB)</Label>
                <Input
                  id="disk"
                  type="number"
                  value={formData.disk}
                  onChange={(e) => setFormData(prev => ({ ...prev, disk: parseInt(e.target.value) }))}
                  min="1024"
                  max="102400"
                  className="bg-background border-border"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                placeholder="Server location"
                className="bg-background border-border"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !formData.name || !formData.nodeId}>
              {isLoading ? "Creating..." : "Create Server"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};