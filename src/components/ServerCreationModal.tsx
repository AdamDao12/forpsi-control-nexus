import { useState, useMemo } from "react";
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
  console.log('🔧 ServerCreationModal render - isOpen:', isOpen);
  
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

  // Fetch available nodes with better error handling
  const { data: nodes = [], isLoading: nodesLoading } = useQuery({
    queryKey: ['nodes-for-creation'],
    queryFn: async () => {
      console.log('🔧 Fetching nodes for modal...');
      try {
        const { data, error } = await supabase.functions.invoke('pelican-integration', {
          body: { action: 'list_nodes' }
        });
        console.log('🔧 Modal nodes response:', data);
        console.log('🔧 Modal nodes error:', error);
        
        if (error) {
          console.error('❌ Node fetch error:', error);
          throw error;
        }
        
        // Handle different response structures
        const nodesList = data?.data || data || [];
        console.log('🔧 Processed nodes list:', nodesList);
        
        // Ensure each node has proper id structure
        return nodesList.map((node: any) => ({
          ...node,
          id: node.id || node.attributes?.id,
          name: node.name || node.attributes?.name,
          fqdn: node.fqdn || node.attributes?.fqdn
        }));
      } catch (error) {
        console.error('❌ Failed to fetch nodes:', error);
        return [];
      }
    },
    enabled: isOpen,
    retry: 2,
    staleTime: 30000, // Cache for 30 seconds
  });

  // Fetch available nests with eggs (games) with fallback to direct eggs
  const { data: nests = [], isLoading: nestsLoading } = useQuery({
    queryKey: ['nests-for-creation'],
    queryFn: async () => {
      console.log('🥚 Fetching nests with eggs from Pelican...');
      try {
        const { data, error } = await supabase.functions.invoke('pelican-integration', {
          body: { action: 'list_nests' }
        });
        console.log('🥚 Nests response:', data);
        console.log('🥚 Nests error:', error);
        if (error) throw error;
        return data?.data || data || [];
      } catch (error) {
        console.warn('Failed to fetch nests, trying eggs directly:', error);
        // Fallback to direct eggs endpoint
        try {
          const { data: eggsData, error: eggsError } = await supabase.functions.invoke('pelican-integration', {
            body: { action: 'list_eggs' }
          });
          if (eggsError) throw eggsError;
          console.log('🎮 Fallback eggs response:', eggsData);
          // Transform eggs data to match nests structure
          return [{
            attributes: { name: 'Available Games' },
            relationships: { eggs: { data: eggsData?.data || [] } }
          }];
        } catch (fallbackError) {
          console.error('Both nests and eggs failed:', fallbackError);
          return [];
        }
      }
    },
    enabled: isOpen,
  });

  // Extract all eggs from all nests
  const eggs = useMemo(() => {
    if (!nests) return [];
    
    const allEggs: any[] = [];
    nests.forEach((nest: any) => {
      if (nest.relationships?.eggs?.data) {
        nest.relationships.eggs.data.forEach((egg: any) => {
          allEggs.push({
            ...egg,
            nestName: nest.attributes.name // Add nest name for context
          });
        });
      }
    });
    
    console.log('🎮 All eggs extracted:', allEggs);
    return allEggs;
  }, [nests]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('🚀 Form submit started');
    console.log('🚀 Form data:', formData);
    setIsLoading(true);

    try {
      // Get current user
      console.log('🔑 Getting current user...');
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        console.error('❌ User authentication failed:', userError);
        throw new Error('User not authenticated');
      }
      console.log('✅ User authenticated:', user.id);

      // First create server record in database
      console.log('💾 Creating server record in database...');
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

      if (dbError) {
        console.error('❌ Database error:', dbError);
        throw dbError;
      }
      console.log('✅ Server record created:', newServer);

      // Then call Pelican integration to create the actual server
      console.log('🐦 Calling create-server function...');
      const { data, error } = await supabase.functions.invoke('create-server', {
        body: {
          order_id: 1, // We'll create a dummy order for now
          egg_id: formData.eggId,
          node_id: parseInt(formData.nodeId)
        }
      });

      console.log('🐦 Create-server response:', data);
      console.log('🐦 Create-server error:', error);

      if (error) {
        console.error('❌ Create-server error:', error);
        // Update server status to failed
        await supabase
          .from('servers')
          .update({ status: 'failed' })
          .eq('id', newServer.id);
        throw new Error(`Server creation failed: ${error.message || 'Unknown error'}`);
      }

      if (!data?.ok) {
        console.error('❌ Create-server API error:', data);
        // Update server status to failed
        await supabase
          .from('servers')
          .update({ status: 'failed' })
          .eq('id', newServer.id);
        throw new Error(`Server creation failed: ${data?.error || 'Unknown error from create-server'}`);
      }

      console.log('✅ Server created successfully:', data);

      toast({
        title: "Server Created", 
        description: data.name ? `Server "${data.name}" is being created.` : "Your server is being created and will be available shortly.",
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
      console.error('💥 Server creation failed:', error);
      console.error('💥 Error stack:', error.stack);
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
      <DialogContent className="sm:max-w-[600px] bg-background border-border">
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
                  {nodes.map((node: any) => {
                    const nodeId = node.id || node.attributes?.id;
                    const nodeName = node.name || node.attributes?.name;
                    const nodeFqdn = node.fqdn || node.attributes?.fqdn;
                    
                    return (
                      <SelectItem key={nodeId} value={nodeId?.toString()} className="hover:bg-sidebar-accent">
                        {nodeName} ({nodeFqdn})
                      </SelectItem>
                    );
                  })}
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
                  <SelectValue placeholder={nestsLoading ? "Loading games..." : "Select a game template"} />
                </SelectTrigger>
                <SelectContent className="bg-background border-border z-50">
                  {eggs.map((egg: any) => (
                    <SelectItem key={egg.id || egg.attributes?.id} value={(egg.id || egg.attributes?.id || '').toString()} className="hover:bg-sidebar-accent">
                      {egg.nestName ? `${egg.nestName} - ${egg.attributes?.name || egg.name}` : (egg.attributes?.name || egg.name)}
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