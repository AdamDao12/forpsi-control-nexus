import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { Shield, Users, Server, Activity, TrendingUp } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { AuthModal } from "@/components/AuthModal";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const Admin = () => {
  const { user, userProfile } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { toast } = useToast();

  const { data: dashboardStats, isLoading: statsLoading } = useQuery({
    queryKey: ['admin-dashboard-stats'],
    queryFn: async () => {
      if (!user || userProfile?.role !== 'admin') return null;

      const { data, error } = await supabase.functions.invoke('admin-operations', {
        body: { action: 'get_dashboard_stats' }
      });

      if (error) throw error;
      return data;
    },
    enabled: !!user && userProfile?.role === 'admin',
  });

  const { data: nodes, isLoading: nodesLoading } = useQuery({
    queryKey: ['admin-nodes'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('pelican-integration', {
        body: { action: 'list_nodes' }
      });

      if (error) throw error;
      return data?.data || [];
    },
    enabled: !!user && userProfile?.role === 'admin',
  });

  const { data: allServers, isLoading: serversLoading } = useQuery({
    queryKey: ['admin-servers'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('admin-operations', {
        body: { action: 'get_all_servers' }
      });

      if (error) throw error;
      return data;
    },
    enabled: !!user && userProfile?.role === 'admin',
  });

  const isLoading = statsLoading || nodesLoading || serversLoading;

  useEffect(() => {
    if (!user) {
      setShowAuthModal(true);
    } else if (userProfile && userProfile.role !== 'admin') {
      toast({
        title: "Access Denied",
        description: "Admin access required.",
        variant: "destructive",
      });
    }
  }, [user, userProfile]);

  if (!user) {
    return (
      <>
        <Layout>
          <div className="p-6 flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-4">Authentication Required</h2>
              <p className="text-muted-foreground mb-4">Please sign in to access the admin panel.</p>
              <Button onClick={() => setShowAuthModal(true)}>Sign In</Button>
            </div>
          </div>
        </Layout>
        <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
      </>
    );
  }

  if (userProfile?.role !== 'admin') {
    return (
      <Layout>
        <div className="p-6 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Shield className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
            <p className="text-muted-foreground">Admin access required to view this page.</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (isLoading) {
    return (
      <Layout>
        <div className="p-6">
          <div className="text-center py-8">Loading admin data...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
            <p className="text-muted-foreground mt-1">System overview and management</p>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="forpsi-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Users</p>
                <p className="text-3xl font-bold text-[hsl(var(--forpsi-cyan))]">
                  {dashboardStats?.totalUsers || 0}
                </p>
              </div>
              <Users className="w-8 h-8 text-[hsl(var(--forpsi-cyan))]" />
            </div>
          </div>
          
          <div className="forpsi-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Servers</p>
                <p className="text-3xl font-bold text-[hsl(var(--forpsi-orange))]">
                  {dashboardStats?.totalServers || 0}
                </p>
              </div>
              <Server className="w-8 h-8 text-[hsl(var(--forpsi-orange))]" />
            </div>
          </div>
          
          <div className="forpsi-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Available Nodes</p>
                <p className="text-3xl font-bold text-[hsl(var(--forpsi-blue))]">
                  {nodes?.length || 0}
                </p>
              </div>
              <Activity className="w-8 h-8 text-[hsl(var(--forpsi-blue))]" />
            </div>
          </div>
          
          <div className="forpsi-card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Orders</p>
                <p className="text-3xl font-bold text-[hsl(var(--forpsi-green))]">
                  {dashboardStats?.totalOrders || 0}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-[hsl(var(--forpsi-green))]" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Servers */}
          <div className="forpsi-card p-6">
            <h3 className="text-lg font-semibold mb-4 text-foreground">Recent Servers</h3>
            <div className="space-y-4">
              {dashboardStats?.recentActivity?.map((server: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-3 bg-sidebar-accent rounded-lg">
                  <div>
                    <p className="font-medium text-foreground">{server.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(server.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      server.status === 'running' ? 'bg-green-100 text-green-800' :
                      server.status === 'stopped' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {server.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Available Nodes */}
          <div className="forpsi-card p-6">
            <h3 className="text-lg font-semibold mb-4 text-foreground">Available Nodes</h3>
            <div className="space-y-4">
              {nodes?.slice(0, 5).map((node: any) => (
                <div key={node.id} className="flex items-center justify-between p-3 bg-sidebar-accent rounded-lg">
                  <div>
                    <p className="font-medium text-foreground">{node.name}</p>
                    <p className="text-sm text-muted-foreground">{node.fqdn}</p>
                  </div>
                  <div className="text-right text-sm">
                    <div className={`w-2 h-2 rounded-full inline-block mr-2 ${
                      node.maintenance_mode ? 'bg-yellow-400' : 'bg-green-400'
                    }`}></div>
                    <span className="text-muted-foreground">
                      {node.maintenance_mode ? 'Maintenance' : 'Online'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Admin;