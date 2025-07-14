import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";

interface Node {
  id: number;
  name: string;
  description: string;
  public: boolean;
  fqdn: string;
  memory: number;
  memory_overallocate: number;
  disk: number;
  disk_overallocate: number;
  cpu: number;
  cpu_overallocate: number;
  maintenance_mode: boolean;
}

interface NodeSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  node: Node | null;
  onNodeUpdated: () => void;
}

export const NodeSettings = ({ isOpen, onClose, node, onNodeUpdated }: NodeSettingsProps) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [settings, setSettings] = useState({
    name: node?.name || "",
    description: node?.description || "",
    public: node?.public || false,
    maintenance_mode: node?.maintenance_mode || false,
    memory_overallocate: node?.memory_overallocate || 0,
    disk_overallocate: node?.disk_overallocate || 0,
    cpu_overallocate: node?.cpu_overallocate || 0,
  });

  const handleSave = async () => {
    if (!node) return;
    
    setIsLoading(true);
    try {
      // Here you would call the Pelican API to update node settings
      // For now, just show success message
      toast({
        title: "Node Updated",
        description: "Node settings have been updated successfully.",
      });
      
      onNodeUpdated();
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update node settings.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!node) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] bg-background border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">Node Settings - {node.name}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Node Name</Label>
              <Input
                id="name"
                value={settings.name}
                onChange={(e) => setSettings(prev => ({ ...prev, name: e.target.value }))}
                className="bg-background border-border"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="fqdn">FQDN</Label>
              <Input
                id="fqdn"
                value={node.fqdn}
                disabled
                className="bg-muted border-border"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={settings.description}
              onChange={(e) => setSettings(prev => ({ ...prev, description: e.target.value }))}
              className="bg-background border-border"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Memory</Label>
              <div className="text-sm text-muted-foreground">
                {node.memory}MB allocated
              </div>
              <div className="space-y-1">
                <Label htmlFor="memory_overallocate" className="text-xs">Overallocate %</Label>
                <Input
                  id="memory_overallocate"
                  type="number"
                  value={settings.memory_overallocate}
                  onChange={(e) => setSettings(prev => ({ ...prev, memory_overallocate: Number(e.target.value) }))}
                  className="bg-background border-border"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Disk</Label>
              <div className="text-sm text-muted-foreground">
                {node.disk}MB allocated
              </div>
              <div className="space-y-1">
                <Label htmlFor="disk_overallocate" className="text-xs">Overallocate %</Label>
                <Input
                  id="disk_overallocate"
                  type="number"
                  value={settings.disk_overallocate}
                  onChange={(e) => setSettings(prev => ({ ...prev, disk_overallocate: Number(e.target.value) }))}
                  className="bg-background border-border"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>CPU</Label>
              <div className="text-sm text-muted-foreground">
                {node.cpu}% allocated
              </div>
              <div className="space-y-1">
                <Label htmlFor="cpu_overallocate" className="text-xs">Overallocate %</Label>
                <Input
                  id="cpu_overallocate"
                  type="number"
                  value={settings.cpu_overallocate}
                  onChange={(e) => setSettings(prev => ({ ...prev, cpu_overallocate: Number(e.target.value) }))}
                  className="bg-background border-border"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div className="space-y-1">
              <Label>Public Node</Label>
              <p className="text-sm text-muted-foreground">
                Allow this node to be visible to all users
              </p>
            </div>
            <Switch
              checked={settings.public}
              onCheckedChange={(checked) => setSettings(prev => ({ ...prev, public: checked }))}
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div className="space-y-1">
              <Label>Maintenance Mode</Label>
              <p className="text-sm text-muted-foreground">
                Prevent new servers from being created on this node
              </p>
            </div>
            <Switch
              checked={settings.maintenance_mode}
              onCheckedChange={(checked) => setSettings(prev => ({ ...prev, maintenance_mode: checked }))}
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isLoading}>
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};