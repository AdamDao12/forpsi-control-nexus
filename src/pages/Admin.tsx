
import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { Shield, Users, Server, ShoppingCart, Settings, Plus, Edit, Trash2, RefreshCw, Eye, UserCheck, Activity } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { AuthModal } from "@/components/AuthModal";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

const Admin = () => {
  const { user, userProfile } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [showCreateCallout, setShowCreateCallout] = useState(false);
  const [calloutForm, setCalloutForm] = useState({
    label: '',
    description: '',
    default_ram: 1024,
    default_cpu: 100,
    default_disk: 2048,
    egg_id: 1,
    docker_image: 'quay.io/pelican-dev/yolks:nodejs_18',
    startup_command: 'npm start'
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: adminData, isLoading } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: async () => {
      if (!user || userProfile?.role !== 'admin') return null;
      
      const { data, error } = await supabase.functions.invoke('admin-operations', {
        body: { action: 'get_metrics' }
      });

      if (error) throw error;
      return data;
    },
    enabled: !!user && userProfile?.role === 'admin',
  });

  // Query for different tab data
  const { data: tabData, isLoading: tabLoading } = useQuery({
    queryKey: ['admin-tab-data', activeTab],
    queryFn: async () => {
      if (!user || userProfile?.role !== 'admin') return null;
      
      const actions: Record<string, string> = {
        nodes: 'get_pelican_nodes',
        users: 'get_all_users',
        servers: 'get_all_servers',
        orders: 'get_orders'
      };

      const action = actions[activeTab];
      if (!action) return null;

      const { data, error } = await supabase.functions.invoke('admin-operations', {
        body: { action }
      });
      
      if (error) throw error;
      return data;
    },
    enabled: !!user && userProfile?.role === 'admin' && ['nodes', 'users', 'servers', 'orders'].includes(activeTab),
  });

  const { data: callouts } = useQuery({
    queryKey: ['admin-callouts'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('callouts-management', {
        body: { action: 'get_callouts' }
      });
      
      if (error) throw error;
      return data.callouts || [];
    },
    enabled: !!user && userProfile?.role === 'admin',
  });

  const createCalloutMutation = useMutation({
    mutationFn: async (calloutData: any) => {
      const { data, error } = await supabase.functions.invoke('callouts-management', {
        body: {
          action: 'create_callout',
          calloutData
        }
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-callouts'] });
      setShowCreateCallout(false);
      setCalloutForm({
        label: '',
        description: '',
        default_ram: 1024,
        default_cpu: 100,
        default_disk: 2048,
        egg_id: 1,
        docker_image: 'quay.io/pelican-dev/yolks:nodejs_18',
        startup_command: 'npm start'
      });
      toast({
        title: "Callout Created",
        description: "Server preset has been created successfully.",
      });
    },
  });

  const syncForpsiMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('admin-operations', {
        body: { action: 'sync_forpsi_orders' }
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Sync Complete",
        description: "Forpsi orders have been synchronized.",
      });
    },
  });

  const handleCreateCallout = (e: React.FormEvent) => {
    e.preventDefault();
    createCalloutMutation.mutate(calloutForm);
  };

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

  return (
    <Layout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Admin Panel</h1>
            <p className="text-muted-foreground mt-1">System administration and management</p>
          </div>
          <button 
            onClick={() => syncForpsiMutation.mutate()}
            className="forpsi-button-secondary flex items-center space-x-2"
            disabled={syncForpsiMutation.isPending}
          >
            <Settings className="w-4 h-4" />
            <span>{syncForpsiMutation.isPending ? 'Syncing...' : 'Sync Forpsi'}</span>
          </button>
        </div>

        {/* Admin Tabs */}
        <div className="border-b border-border">
          <nav className="flex space-x-8">
            {['overview', 'nodes', 'callouts', 'users', 'servers', 'orders'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab
                    ? 'border-[hsl(var(--forpsi-cyan))] text-[hsl(var(--forpsi-cyan))]'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="forpsi-card p-6">
              <div className="flex items-center space-x-3">
                <Server className="w-8 h-8 text-[hsl(var(--forpsi-cyan))]" />
                <div>
                  <div className="text-2xl font-bold">{adminData?.realTime?.totalServers || 0}</div>
                  <div className="text-muted-foreground text-sm">Total Servers</div>
                </div>
              </div>
            </div>
            <div className="forpsi-card p-6">
              <div className="flex items-center space-x-3">
                <Users className="w-8 h-8 text-[hsl(var(--forpsi-cyan))]" />
                <div>
                  <div className="text-2xl font-bold">{adminData?.realTime?.activeUsers || 0}</div>
                  <div className="text-muted-foreground text-sm">Active Users</div>
                </div>
              </div>
            </div>
            <div className="forpsi-card p-6">
              <div className="flex items-center space-x-3">
                <ShoppingCart className="w-8 h-8 text-[hsl(var(--forpsi-cyan))]" />
                <div>
                  <div className="text-2xl font-bold">{adminData?.realTime?.totalOrders || 0}</div>
                  <div className="text-muted-foreground text-sm">Total Orders</div>
                </div>
              </div>
            </div>
            <div className="forpsi-card p-6">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white font-bold">€</div>
                <div>
                  <div className="text-2xl font-bold">€{adminData?.realTime?.totalRevenue || 0}</div>
                  <div className="text-muted-foreground text-sm">Total Revenue</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'callouts' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Server Presets (Callouts)</h2>
              <button 
                onClick={() => setShowCreateCallout(true)}
                className="forpsi-button-primary flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Create Preset</span>
              </button>
            </div>

            {showCreateCallout && (
              <div className="forpsi-card p-6">
                <h3 className="text-lg font-semibold mb-4">Create Server Preset</h3>
                <form onSubmit={handleCreateCallout} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Label *</label>
                    <input
                      type="text"
                      value={calloutForm.label}
                      onChange={(e) => setCalloutForm({...calloutForm, label: e.target.value})}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Description</label>
                    <input
                      type="text"
                      value={calloutForm.description}
                      onChange={(e) => setCalloutForm({...calloutForm, description: e.target.value})}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">RAM (MB)</label>
                    <input
                      type="number"
                      value={calloutForm.default_ram}
                      onChange={(e) => setCalloutForm({...calloutForm, default_ram: parseInt(e.target.value)})}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">CPU (%)</label>
                    <input
                      type="number"
                      value={calloutForm.default_cpu}
                      onChange={(e) => setCalloutForm({...calloutForm, default_cpu: parseInt(e.target.value)})}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Disk (MB)</label>
                    <input
                      type="number"
                      value={calloutForm.default_disk}
                      onChange={(e) => setCalloutForm({...calloutForm, default_disk: parseInt(e.target.value)})}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Egg ID</label>
                    <input
                      type="number"
                      value={calloutForm.egg_id}
                      onChange={(e) => setCalloutForm({...calloutForm, egg_id: parseInt(e.target.value)})}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-2">Docker Image</label>
                    <input
                      type="text"
                      value={calloutForm.docker_image}
                      onChange={(e) => setCalloutForm({...calloutForm, docker_image: e.target.value})}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-2">Startup Command</label>
                    <input
                      type="text"
                      value={calloutForm.startup_command}
                      onChange={(e) => setCalloutForm({...calloutForm, startup_command: e.target.value})}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                    />
                  </div>
                  <div className="md:col-span-2 flex space-x-3">
                    <button
                      type="submit"
                      disabled={createCalloutMutation.isPending}
                      className="forpsi-button-primary"
                    >
                      {createCalloutMutation.isPending ? 'Creating...' : 'Create Preset'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowCreateCallout(false)}
                      className="forpsi-button-secondary"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {callouts?.map((callout: any) => (
                <div key={callout.id} className="forpsi-card p-4">
                  <h3 className="font-semibold mb-2">{callout.label}</h3>
                  <p className="text-sm text-muted-foreground mb-3">{callout.description}</p>
                  <div className="text-xs space-y-1 text-muted-foreground">
                    <div>RAM: {callout.default_ram}MB</div>
                    <div>CPU: {callout.default_cpu}%</div>
                    <div>Disk: {callout.default_disk}MB</div>
                    <div>Egg ID: {callout.egg_id}</div>
                  </div>
                  <div className="flex justify-end space-x-2 mt-3">
                    <button className="p-1 hover:bg-muted rounded">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button className="p-1 hover:bg-muted rounded text-red-400">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Nodes Tab */}
        {activeTab === 'nodes' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Pelican Nodes</h2>
              <Button 
                onClick={() => queryClient.invalidateQueries({ queryKey: ['admin-tab-data'] })}
                variant="outline"
                size="sm"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
            
            {tabLoading ? (
              <div className="text-center py-8">Loading nodes...</div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {tabData?.nodes?.map((node: any) => (
                  <div key={node.attributes?.id || node.id} className="forpsi-card p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold">{node.attributes?.name || node.name}</h3>
                        <p className="text-sm text-muted-foreground">{node.attributes?.fqdn || node.fqdn}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={node.status === 'free' ? 'default' : 'secondary'}>
                          {node.status === 'free' ? 'VOLNÝ' : 'OBSAZENÝ'}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Memory:</span>
                        <span>{node.attributes?.memory || 'N/A'} MB</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Disk:</span>
                        <span>{node.attributes?.disk || 'N/A'} MB</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Location:</span>
                        <span>{node.attributes?.location || 'N/A'}</span>
                      </div>
                    </div>

                    {node.reservation && (
                      <div className="mt-4 p-3 bg-muted rounded-lg">
                        <div className="text-sm">
                          <div className="font-medium">Reserved by:</div>
                          <div className="text-muted-foreground">
                            {node.reservation.profiles?.first_name} {node.reservation.profiles?.last_name}
                          </div>
                          <div className="text-muted-foreground text-xs">
                            Order: {node.reservation.orders?.order_id}
                          </div>
                        </div>
                      </div>
                    )}

                    {node.status === 'free' && (
                      <div className="mt-4">
                        <Button 
                          size="sm" 
                          className="w-full"
                          onClick={() => {
                            // TODO: Implement node reservation
                            toast({
                              title: "Feature Coming Soon",
                              description: "Node reservation will be implemented",
                            });
                          }}
                        >
                          Reserve Node
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">User Management</h2>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add User
              </Button>
            </div>

            {tabLoading ? (
              <div className="text-center py-8">Loading users...</div>
            ) : (
              <div className="forpsi-card">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left p-4">Name</th>
                        <th className="text-left p-4">Email</th>
                        <th className="text-left p-4">Role</th>
                        <th className="text-left p-4">Status</th>
                        <th className="text-left p-4">Created</th>
                        <th className="text-left p-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tabData?.users?.map((user: any) => (
                        <tr key={user.auth_id} className="border-b border-border">
                          <td className="p-4">
                            {user.first_name && user.last_name 
                              ? `${user.first_name} ${user.last_name}` 
                              : 'N/A'
                            }
                          </td>
                          <td className="p-4">{user.email}</td>
                          <td className="p-4">
                            <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                              {user.role}
                            </Badge>
                          </td>
                          <td className="p-4">
                            <Badge variant="outline">{user.status}</Badge>
                          </td>
                          <td className="p-4 text-sm text-muted-foreground">
                            {new Date(user.created_at).toLocaleDateString()}
                          </td>
                          <td className="p-4">
                            <div className="flex space-x-2">
                              <Button size="sm" variant="outline">
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button size="sm" variant="outline">
                                <Eye className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Servers Tab */}
        {activeTab === 'servers' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Server Management</h2>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Deploy Server
              </Button>
            </div>

            {tabLoading ? (
              <div className="text-center py-8">Loading servers...</div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {tabData?.servers?.map((server: any) => (
                  <div key={server.id} className="forpsi-card p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold">{server.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {server.profiles?.first_name} {server.profiles?.last_name}
                        </p>
                      </div>
                      <Badge variant={server.status === 'running' ? 'default' : 'secondary'}>
                        {server.status}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">RAM:</span>
                        <span>{server.ram_mb || 'N/A'} MB</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">CPU:</span>
                        <span>{server.cpu_pct || 'N/A'}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Disk:</span>
                        <span>{server.disk_mb || 'N/A'} MB</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Location:</span>
                        <span>{server.location}</span>
                      </div>
                    </div>

                    <div className="mt-4 flex space-x-2">
                      <Button size="sm" variant="outline" className="flex-1">
                        <Activity className="w-4 h-4 mr-1" />
                        Console
                      </Button>
                      <Button size="sm" variant="outline">
                        <Settings className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Order Management</h2>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Manual Order
              </Button>
            </div>

            {tabLoading ? (
              <div className="text-center py-8">Loading orders...</div>
            ) : (
              <div className="forpsi-card">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left p-4">Order ID</th>
                        <th className="text-left p-4">Customer</th>
                        <th className="text-left p-4">Service</th>
                        <th className="text-left p-4">Amount</th>
                        <th className="text-left p-4">Status</th>
                        <th className="text-left p-4">Created</th>
                        <th className="text-left p-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tabData?.orders?.map((order: any) => (
                        <tr key={order.id} className="border-b border-border">
                          <td className="p-4 font-mono text-sm">{order.order_id}</td>
                          <td className="p-4">
                            {order.profiles?.first_name && order.profiles?.last_name 
                              ? `${order.profiles.first_name} ${order.profiles.last_name}` 
                              : order.profiles?.email || 'N/A'
                            }
                          </td>
                          <td className="p-4">{order.service}</td>
                          <td className="p-4">${order.amount}</td>
                          <td className="p-4">
                            <Badge variant={order.status === 'paid' ? 'default' : order.status === 'pending' ? 'secondary' : 'destructive'}>
                              {order.status}
                            </Badge>
                          </td>
                          <td className="p-4 text-sm text-muted-foreground">
                            {new Date(order.created_at).toLocaleDateString()}
                          </td>
                          <td className="p-4">
                            <div className="flex space-x-2">
                              <Button size="sm" variant="outline">
                                <Eye className="w-4 h-4" />
                              </Button>
                              {order.status === 'pending' && (
                                <Button size="sm" variant="outline">
                                  <UserCheck className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {(isLoading || tabLoading) && (
          <div className="text-center py-8">Loading admin data...</div>
        )}
      </div>
    </Layout>
  );
};

export default Admin;
