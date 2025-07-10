
import { Layout } from "@/components/Layout";
import { Settings, Database, Shield, Activity, BarChart3, Users } from "lucide-react";

const Admin = () => {
  const stats = [
    { label: "Total Users", value: "1,234", icon: Users, change: "+12%" },
    { label: "Active Servers", value: "89", icon: Database, change: "+5%" },
    { label: "System Load", value: "67%", icon: Activity, change: "-3%" },
    { label: "Revenue", value: "$45,678", icon: BarChart3, change: "+18%" },
  ];

  return (
    <Layout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Admin Panel</h1>
          <p className="text-muted-foreground mt-1">System administration and management</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="forpsi-card p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-[hsl(var(--forpsi-cyan))] rounded-lg flex items-center justify-center">
                    <Icon className="w-6 h-6 text-[hsl(var(--forpsi-charcoal))]" />
                  </div>
                  <span className={`text-sm font-medium ${stat.change.startsWith('+') ? 'text-green-400' : 'text-red-400'}`}>
                    {stat.change}
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-1">{stat.value}</h3>
                <p className="text-muted-foreground text-sm">{stat.label}</p>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* System Settings */}
          <div className="forpsi-card p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center space-x-2">
              <Settings className="w-5 h-5" />
              <span>System Settings</span>
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div>
                  <p className="font-medium text-foreground">Maintenance Mode</p>
                  <p className="text-sm text-muted-foreground">System-wide maintenance</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[hsl(var(--forpsi-cyan))]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[hsl(var(--forpsi-cyan))]"></div>
                </label>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div>
                  <p className="font-medium text-foreground">Auto Backup</p>
                  <p className="text-sm text-muted-foreground">Daily automatic backups</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[hsl(var(--forpsi-cyan))]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[hsl(var(--forpsi-cyan))]"></div>
                </label>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div>
                  <p className="font-medium text-foreground">SSL Monitoring</p>
                  <p className="text-sm text-muted-foreground">Monitor SSL certificates</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" defaultChecked />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-[hsl(var(--forpsi-cyan))]/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[hsl(var(--forpsi-cyan))]"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Security & Permissions */}
          <div className="forpsi-card p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center space-x-2">
              <Shield className="w-5 h-5" />
              <span>Security & Permissions</span>
            </h3>
            <div className="space-y-4">
              <div className="p-3 bg-muted rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium text-foreground">Failed Login Attempts</p>
                  <span className="text-sm text-red-400 font-medium">23 today</span>
                </div>
                <p className="text-sm text-muted-foreground">Suspicious login activity detected</p>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium text-foreground">Active Sessions</p>
                  <span className="text-sm text-green-400 font-medium">156 users</span>
                </div>
                <p className="text-sm text-muted-foreground">Currently logged in users</p>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium text-foreground">System Updates</p>
                  <span className="text-sm text-yellow-400 font-medium">5 pending</span>
                </div>
                <p className="text-sm text-muted-foreground">Security updates available</p>
              </div>
            </div>
            <button className="w-full forpsi-button-primary mt-4">View Security Logs</button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="forpsi-card p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <button className="forpsi-button-secondary">Restart Services</button>
            <button className="forpsi-button-secondary">Clear Cache</button>
            <button className="forpsi-button-secondary">Run Backup</button>
            <button className="forpsi-button-secondary">Update System</button>
            <button className="forpsi-button-secondary">View Logs</button>
            <button className="forpsi-button-secondary">System Monitor</button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Admin;
