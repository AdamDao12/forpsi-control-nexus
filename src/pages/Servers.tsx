
import { Layout } from "@/components/Layout";
import { Server, Plus, Power, Settings, MoreHorizontal } from "lucide-react";

const servers = [
  { id: 1, name: "Web Server 01", status: "running", cpu: "45%", memory: "2.1GB", location: "Prague", uptime: "15 days" },
  { id: 2, name: "Database Server", status: "running", cpu: "23%", memory: "4.8GB", location: "Brno", uptime: "45 days" },
  { id: 3, name: "Game Server 01", status: "stopped", cpu: "0%", memory: "0GB", location: "Prague", uptime: "0 days" },
  { id: 4, name: "API Server", status: "running", cpu: "67%", memory: "1.2GB", location: "Ostrava", uptime: "8 days" },
];

const Servers = () => {
  return (
    <Layout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Servers</h1>
            <p className="text-muted-foreground mt-1">Manage your server instances</p>
          </div>
          <button className="forpsi-button-primary flex items-center space-x-2">
            <Plus className="w-4 h-4" />
            <span>Create Server</span>
          </button>
        </div>

        {/* Server Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {servers.map((server) => (
            <div key={server.id} className="forpsi-card p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-[hsl(var(--forpsi-cyan))] rounded-lg flex items-center justify-center">
                    <Server className="w-5 h-5 text-[hsl(var(--forpsi-charcoal))]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{server.name}</h3>
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${server.status === 'running' ? 'bg-green-400' : 'bg-red-400'}`}></div>
                      <span className="text-sm text-muted-foreground capitalize">{server.status}</span>
                    </div>
                  </div>
                </div>
                <button className="p-2 hover:bg-sidebar-accent rounded-lg transition-colors">
                  <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">CPU Usage</span>
                  <span className="text-foreground font-medium">{server.cpu}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Memory</span>
                  <span className="text-foreground font-medium">{server.memory}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Location</span>
                  <span className="text-foreground font-medium">{server.location}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Uptime</span>
                  <span className="text-foreground font-medium">{server.uptime}</span>
                </div>
              </div>

              <div className="flex space-x-2 mt-4 pt-4 border-t border-border">
                <button className="flex-1 forpsi-button-secondary flex items-center justify-center space-x-2">
                  <Power className="w-4 h-4" />
                  <span>{server.status === 'running' ? 'Stop' : 'Start'}</span>
                </button>
                <button className="flex-1 bg-muted hover:bg-muted/80 text-foreground transition-colors rounded-lg px-4 py-2 font-medium flex items-center justify-center space-x-2">
                  <Settings className="w-4 h-4" />
                  <span>Configure</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default Servers;
