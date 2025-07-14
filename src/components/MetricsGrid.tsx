
import { Server, Activity, Users, HelpCircle, DollarSign } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface MetricsGridProps {
  data?: any;
}

export const MetricsGrid = ({ data }: MetricsGridProps) => {
  const { user, userProfile } = useAuth();

  const { data: metricsData, isLoading } = useQuery({
    queryKey: ['metrics-data'],
    queryFn: async () => {
      if (!user) return null;
      
      if (userProfile?.role === 'admin') {
        // Admin sees system-wide metrics
        const { data, error } = await supabase.functions.invoke('admin-operations', {
          body: { action: 'get_metrics' }
        });
        
        if (error) throw error;
        return data;
      } else {
        // Regular users see their own metrics
        const [serversResponse, ordersResponse, ticketsResponse] = await Promise.all([
          supabase.from('servers').select('*').eq('user_id', user.id),
          supabase.from('orders').select('*').eq('user_id', user.id),
          supabase.from('tickets').select('*').eq('user_id', user.id).eq('status', 'open')
        ]);

        return {
          realTime: {
            totalServers: serversResponse.data?.length || 0,
            activeUsers: 1,
            totalOrders: ordersResponse.data?.length || 0,
            totalRevenue: ordersResponse.data?.reduce((sum, order) => sum + (order.amount || 0), 0) || 0,
            openTickets: ticketsResponse.data?.length || 0
          }
        };
      }
    },
    enabled: !!user && !!userProfile,
    refetchInterval: 30000,
  });

  const finalData = data || metricsData;

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1,2,3,4].map((i) => (
          <div key={i} className="forpsi-card p-6 animate-pulse">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 bg-muted rounded-xl"></div>
              <div className="w-8 h-4 bg-muted rounded"></div>
            </div>
            <div className="mt-4">
              <div className="w-16 h-8 bg-muted rounded"></div>
              <div className="w-20 h-4 bg-muted rounded mt-2"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  const isAdmin = userProfile?.role === 'admin';
  const realTimeData = finalData?.realTime || {};

  const metrics = [
    {
      title: isAdmin ? "Total Servers" : "My Servers",
      value: realTimeData.totalServers?.toString() || "0",
      change: "+1",
      changeType: "positive" as const,
      icon: Server,
      color: "bg-[hsl(var(--forpsi-cyan))]"
    },
    {
      title: isAdmin ? "Active Users" : "Active Orders",
      value: isAdmin ? realTimeData.activeUsers?.toString() || "0" : realTimeData.totalOrders?.toString() || "0",
      change: isAdmin ? "+5" : "+0",
      changeType: "positive" as const,
      icon: Users,
      color: "bg-[hsl(var(--forpsi-blue))]"
    },
    {
      title: isAdmin ? "Total Revenue" : "Total Spent",
      value: `$${realTimeData.totalRevenue?.toFixed(2) || "0.00"}`,
      change: "+12%",
      changeType: "positive" as const,
      icon: DollarSign,
      color: "bg-green-500"
    },
    {
      title: "Open Tickets",
      value: (realTimeData.openTickets || 0).toString(),
      change: "-1",
      changeType: "positive" as const,
      icon: HelpCircle,
      color: "bg-orange-500"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {metrics.map((metric, index) => {
        const Icon = metric.icon;
        return (
          <div key={index} className="forpsi-card p-6">
            <div className="flex items-center justify-between">
              <div className={`p-3 rounded-xl ${metric.color}`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              <div className={`text-sm font-medium ${
                metric.changeType === 'positive' ? 'text-green-400' : 'text-red-400'
              }`}>
                {metric.change}
              </div>
            </div>
            <div className="mt-4">
              <div className="text-2xl font-bold text-foreground">{metric.value}</div>
              <div className="text-sm text-muted-foreground">{metric.title}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
