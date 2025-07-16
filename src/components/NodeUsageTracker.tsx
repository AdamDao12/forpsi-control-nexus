interface NodeUsageTrackerProps {
  nodeId: string;
}

export const NodeUsageTracker = ({ nodeId }: NodeUsageTrackerProps) => {
  // Mock data for frontend demo
  const mockUsage = {
    totalRam: 8192,
    totalCpu: 250,
    totalDisk: 20480,
    activeServers: 3,
    totalServers: 5
  };

  return mockUsage;
};