import { Server, Activity, Users, HelpCircle, DollarSign } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface MetricsGridProps {
  data?: any;
}

export const MetricsGrid = ({ data }: MetricsGridProps) => {
  const { user, userProfile } = useAuth();

  // Mock data for demo
  const mockData = {
    realTime: {
      totalServers: 12,
      activeUsers: 24,
      totalOrders: 8,
      totalRevenue: 1250.00,
      openTickets: 3
    }
  };

  const isAdmin = userProfile?.role === 'admin';
  const realTimeData = data?.realTime || mockData.realTime;

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