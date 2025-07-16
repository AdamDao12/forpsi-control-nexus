import { useState } from "react";
import { Layout } from "@/components/Layout";
import { MetricsGrid } from "@/components/MetricsGrid";
import { ActivityFeed } from "@/components/ActivityFeed";
import { useAuth } from "@/hooks/useAuth";

const Dashboard = () => {
  const { user, userProfile } = useAuth();

  // Mock data for demo
  const mockDashboardData = {
    realTime: {
      totalServers: 12,
      activeUsers: 24,
      totalOrders: 8,
      totalRevenue: 1250.00,
      openTickets: 3
    }
  };

  return (
    <Layout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back{userProfile ? `, ${userProfile.first_name}` : ''}! Here's your overview.
          </p>
        </div>
        
        <MetricsGrid data={mockDashboardData} />
        <ActivityFeed />
      </div>
    </Layout>
  );
};

export default Dashboard;