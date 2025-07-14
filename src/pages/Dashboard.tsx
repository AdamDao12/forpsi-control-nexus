
import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { MetricsGrid } from "@/components/MetricsGrid";
import { ActivityFeed } from "@/components/ActivityFeed";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

const Dashboard = () => {
  const { user, userProfile } = useAuth();

  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['dashboard-metrics'],
    queryFn: async () => {
      if (!user) return null;
      
      if (userProfile?.role === 'admin') {
        const { data, error } = await supabase.functions.invoke('admin-operations', {
          body: { action: 'get_metrics' }
        });
        
        if (error) throw error;
        return data;
      } else {
        // For regular users, get their own data
        const [serversResponse, ordersResponse] = await Promise.all([
          supabase.from('servers').select('*').eq('user_id', user.id),
          supabase.from('orders').select('*').eq('user_id', user.id)
        ]);

        return {
          realTime: {
            totalServers: serversResponse.data?.length || 0,
            activeUsers: 1,
            totalOrders: ordersResponse.data?.length || 0,
            totalRevenue: ordersResponse.data?.reduce((sum, order) => sum + (order.ram || 0), 0) || 0
          },
          metrics: []
        };
      }
    },
    enabled: !!user && !!userProfile,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  if (!user) {
    return (
      <Layout>
        <div className="p-6 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Please sign in to access the dashboard</h2>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            {userProfile?.role === 'admin' ? 'Admin Dashboard' : 'Dashboard'}
          </h1>
          <p className="text-muted-foreground mt-1">
            Welcome back, {userProfile?.first_name || user.email}
          </p>
        </div>

        {isLoading ? (
          <div className="text-center py-8">Loading dashboard...</div>
        ) : (
          <>
            <MetricsGrid />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ActivityFeed />
              <div className="forpsi-card p-6">
                <h3 className="text-xl font-semibold mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <a href="/servers" className="block p-3 bg-muted hover:bg-muted/80 rounded-lg transition-colors">
                    <div className="font-medium">Manage Servers</div>
                    <div className="text-sm text-muted-foreground">Create and manage your game servers</div>
                  </a>
                  <a href="/orders" className="block p-3 bg-muted hover:bg-muted/80 rounded-lg transition-colors">
                    <div className="font-medium">View Orders</div>
                    <div className="text-sm text-muted-foreground">Check your billing and order history</div>
                  </a>
                  <a href="/support" className="block p-3 bg-muted hover:bg-muted/80 rounded-lg transition-colors">
                    <div className="font-medium">Get Support</div>
                    <div className="text-sm text-muted-foreground">Create a support ticket for help</div>
                  </a>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
};

export default Dashboard;
