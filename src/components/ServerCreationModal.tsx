import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface ServerCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onServerCreated: () => void;
}

export const ServerCreationModal = ({ isOpen, onClose, onServerCreated }: ServerCreationModalProps) => {
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

  // Mock data for demo
  const mockNodes = [
    { id: 1, name: "Node 1", fqdn: "node1.example.com" },
    { id: 2, name: "Node 2", fqdn: "node2.example.com" },
    { id: 3, name: "Node 3", fqdn: "node3.example.com" }
  ];

  const mockEggs = [
    { id: 1, name: "Minecraft Java", nestName: "Minecraft" },
    { id: 2, name: "Minecraft Bedrock", nestName: "Minecraft" },
    { id: 3, name: "Counter-Strike 2", nestName: "Source Engine" },
    { id: 4, name: "Garry's Mod", nestName: "Source Engine" }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Mock server creation
      await new Promise(resolve => setTimeout(resolve, 2000));

      toast({
        title: "Server Created", 
        description: `Server "${formData.name}" is being created (demo).`,
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
                  <SelectValue placeholder="Select a node" />
                </SelectTrigger>
                <SelectContent className="bg-background border-border z-50">
                  {mockNodes.map((node) => (
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
                  {mockEggs.map((egg) => (
                    <SelectItem key={egg.id} value={egg.id.toString()} className="hover:bg-sidebar-accent">
                      {egg.nestName} - {egg.name}
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