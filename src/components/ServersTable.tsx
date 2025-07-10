
import { MoreHorizontal, Play, Square, AlertCircle } from "lucide-react";

const servers = [
  {
    name: "Web Server 01",
    status: "running",
    cpu: "45%",
    memory: "2.1/4 GB",
    uptime: "15d 4h",
    ip: "192.168.1.10"
  },
  {
    name: "Game Server 01",
    status: "running", 
    cpu: "78%",
    memory: "6.2/8 GB",
    uptime: "7d 12h",
    ip: "192.168.1.11"
  },
  {
    name: "Database Server",
    status: "stopped",
    cpu: "0%",
    memory: "0.5/4 GB", 
    uptime: "0h",
    ip: "192.168.1.12"
  },
  {
    name: "API Server",
    status: "warning",
    cpu: "92%",
    memory: "3.8/4 GB",
    uptime: "2d 8h",
    ip: "192.168.1.13"
  }
];

export const ServersTable = () => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return <Play className="w-4 h-4 text-green-400" />;
      case 'stopped':
        return <Square className="w-4 h-4 text-gray-400" />;
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-orange-400" />;
      default:
        return <Square className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = "px-2 py-1 rounded-full text-xs font-medium";
    switch (status) {
      case 'running':
        return `${baseClasses} bg-green-400/20 text-green-400`;
      case 'stopped':
        return `${baseClasses} bg-gray-400/20 text-gray-400`;
      case 'warning':
        return `${baseClasses} bg-orange-400/20 text-orange-400`;
      default:
        return `${baseClasses} bg-gray-400/20 text-gray-400`;
    }
  };

  return (
    <div className="forpsi-card p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-foreground">Servers</h2>
        <button className="forpsi-button-secondary text-sm">
          View All
        </button>
      </div>
      
      <div className="space-y-3">
        {servers.map((server, index) => (
          <div key={index} className="flex items-center justify-between p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
            <div className="flex items-center space-x-4">
              {getStatusIcon(server.status)}
              <div>
                <div className="font-medium text-foreground">{server.name}</div>
                <div className="text-sm text-muted-foreground">{server.ip}</div>
              </div>
            </div>
            
            <div className="flex items-center space-x-6">
              <div className="text-center">
                <div className="text-sm font-medium text-foreground">{server.cpu}</div>
                <div className="text-xs text-muted-foreground">CPU</div>
              </div>
              <div className="text-center">
                <div className="text-sm font-medium text-foreground">{server.memory}</div>
                <div className="text-xs text-muted-foreground">Memory</div>
              </div>
              <div className="text-center">
                <div className="text-sm font-medium text-foreground">{server.uptime}</div>
                <div className="text-xs text-muted-foreground">Uptime</div>
              </div>
              <div className={getStatusBadge(server.status)}>
                {server.status}
              </div>
              <button className="p-2 rounded-lg hover:bg-muted/50 transition-colors">
                <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
