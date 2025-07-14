import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface NodeUsageTrackerProps {
  nodeId: string;
}

export const NodeUsageTracker = ({ nodeId }: NodeUsageTrackerProps) => {
  const { data: nodeUsage } = useQuery({
    queryKey: ['node-usage', nodeId],
    queryFn: async () => {
      // Get servers allocated to this node
      const { data: servers, error } = await supabase
        .from('servers')
        .select('ram_mb, cpu_pct, disk_mb, status')
        .eq('node_id', nodeId);

      if (error) throw error;

      // Calculate total usage
      const totalRam = servers?.reduce((sum, server) => sum + (server.ram_mb || 0), 0) || 0;
      const totalCpu = servers?.reduce((sum, server) => sum + (server.cpu_pct || 0), 0) || 0;
      const totalDisk = servers?.reduce((sum, server) => sum + (server.disk_mb || 0), 0) || 0;
      const activeServers = servers?.filter(s => s.status === 'running').length || 0;

      return {
        totalRam,
        totalCpu,
        totalDisk,
        activeServers,
        totalServers: servers?.length || 0
      };
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  return nodeUsage;
};