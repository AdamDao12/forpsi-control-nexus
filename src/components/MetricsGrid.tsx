
import { Server, Activity, Users, HelpCircle } from "lucide-react";

const metrics = [
  {
    title: "Active Servers",
    value: "12",
    change: "+2",
    changeType: "positive" as const,
    icon: Server,
    color: "bg-[hsl(var(--forpsi-cyan))]"
  },
  {
    title: "CPU Usage",
    value: "68%",
    change: "-5%",
    changeType: "positive" as const,
    icon: Activity,
    color: "bg-[hsl(var(--forpsi-blue))]"
  },
  {
    title: "Active Users",
    value: "1,247",
    change: "+127",
    changeType: "positive" as const,
    icon: Users,
    color: "bg-green-500"
  },
  {
    title: "Open Tickets",
    value: "3",
    change: "-2",
    changeType: "positive" as const,
    icon: HelpCircle,
    color: "bg-orange-500"
  }
];

export const MetricsGrid = () => {
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
