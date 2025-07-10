
import { MetricsGrid } from "./MetricsGrid";
import { ServersTable } from "./ServersTable";
import { ActivityFeed } from "./ActivityFeed";

export const DashboardContent = () => {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Welcome back to your Forpsi control panel</p>
        </div>
        <button className="forpsi-button-primary">
          Create Server
        </button>
      </div>

      {/* Metrics Grid */}
      <MetricsGrid />

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ServersTable />
        </div>
        <div>
          <ActivityFeed />
        </div>
      </div>
    </div>
  );
};
