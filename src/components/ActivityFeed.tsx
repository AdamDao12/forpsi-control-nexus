
import { Clock, Server, User, AlertTriangle } from "lucide-react";

const activities = [
  {
    type: "server",
    title: "Server deployed",
    description: "Web Server 01 successfully deployed",
    time: "2 minutes ago",
    icon: Server,
    color: "text-[hsl(var(--forpsi-cyan))]"
  },
  {
    type: "user",
    title: "New user registered",
    description: "john.doe@example.com joined",
    time: "15 minutes ago", 
    icon: User,
    color: "text-green-400"
  },
  {
    type: "warning",
    title: "High CPU usage detected",
    description: "API Server CPU usage at 92%",
    time: "1 hour ago",
    icon: AlertTriangle,
    color: "text-orange-400"
  },
  {
    type: "server",
    title: "Server maintenance completed",
    description: "Game Server 01 maintenance finished",
    time: "3 hours ago",
    icon: Server,
    color: "text-[hsl(var(--forpsi-blue))]"
  }
];

export const ActivityFeed = () => {
  return (
    <div className="forpsi-card p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-foreground">Recent Activity</h2>
        <Clock className="w-5 h-5 text-muted-foreground" />
      </div>
      
      <div className="space-y-4">
        {activities.map((activity, index) => {
          const Icon = activity.icon;
          return (
            <div key={index} className="flex items-start space-x-3 p-3 rounded-xl hover:bg-muted/30 transition-colors">
              <div className={`p-2 rounded-lg bg-muted/50`}>
                <Icon className={`w-4 h-4 ${activity.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-foreground text-sm">
                  {activity.title}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  {activity.description}
                </div>
                <div className="text-xs text-muted-foreground mt-2">
                  {activity.time}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      <button className="w-full mt-4 text-sm text-[hsl(var(--forpsi-cyan))] hover:text-[hsl(191,91%,50%)] transition-colors font-medium">
        View All Activity
      </button>
    </div>
  );
};
