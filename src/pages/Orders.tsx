
import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { ShoppingCart, Plus, Euro, Clock, CheckCircle, XCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { AuthModal } from "@/components/AuthModal";
// Mock orders page - no backend needed
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const Orders = () => {
  const { user, userProfile } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showCreateOrder, setShowCreateOrder] = useState(false);
  const [orderForm, setOrderForm] = useState({
    service: 'Minecraft Server',
    amount: 25.99,
    period: 'monthly'
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: orders, isLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching orders:', error);
        throw error;
      }
      return data;
    },
    enabled: !!user,
  });

  const createOrderMutation = useMutation({
    mutationFn: async (orderData: any) => {
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase.functions.invoke('create-order', {
        body: {
          package: orderData.service,
          ram: 1024,
          cpu: 100,
          disk: 2048
        }
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      setShowCreateOrder(false);
      setOrderForm({
        service: 'Minecraft Server',
        amount: 25.99,
        period: 'monthly'
      });
      toast({
        title: "Order Created",
        description: "Your order has been created successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create order",
        variant: "destructive",
      });
    },
  });

  const handleSubmitOrder = (e: React.FormEvent) => {
    e.preventDefault();
    createOrderMutation.mutate(orderForm);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'processing': return <Clock className="w-4 h-4 text-yellow-400" />;
      case 'pending': return <Clock className="w-4 h-4 text-blue-400" />;
      case 'cancelled': return <XCircle className="w-4 h-4 text-red-400" />;
      default: return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-400';
      case 'processing': return 'text-yellow-400';
      case 'pending': return 'text-blue-400';
      case 'cancelled': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  useEffect(() => {
    if (!user) {
      setShowAuthModal(true);
    }
  }, [user]);

  if (!user) {
    return (
      <>
        <Layout>
          <div className="p-6 flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-4">Authentication Required</h2>
              <p className="text-muted-foreground mb-4">Please sign in to view your orders.</p>
              <Button onClick={() => setShowAuthModal(true)}>Sign In</Button>
            </div>
          </div>
        </Layout>
        <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
      </>
    );
  }

  return (
    <Layout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Orders</h1>
            <p className="text-muted-foreground mt-1">Manage your billing and order history</p>
          </div>
          <button 
            onClick={() => setShowCreateOrder(true)}
            className="forpsi-button-primary flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>New Order</span>
          </button>
        </div>

        {/* Create Order Form */}
        {showCreateOrder && (
          <div className="forpsi-card p-6">
            <h3 className="text-xl font-semibold mb-4">Create New Order</h3>
            <form onSubmit={handleSubmitOrder} className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Service</label>
                <select
                  value={orderForm.service}
                  onChange={(e) => setOrderForm({...orderForm, service: e.target.value})}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                >
                  <option value="Minecraft Server">Minecraft Server</option>
                  <option value="VPS Hosting">VPS Hosting</option>
                  <option value="Web Hosting">Web Hosting</option>
                  <option value="Game Server">Game Server</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Amount (€)</label>
                <input
                  type="number"
                  step="0.01"
                  value={orderForm.amount}
                  onChange={(e) => setOrderForm({...orderForm, amount: parseFloat(e.target.value)})}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Period</label>
                <select
                  value={orderForm.period}
                  onChange={(e) => setOrderForm({...orderForm, period: e.target.value})}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                >
                  <option value="monthly">Monthly</option>
                  <option value="annual">Annual</option>
                </select>
              </div>
              <div className="md:col-span-3 flex space-x-3">
                <button
                  type="submit"
                  disabled={createOrderMutation.isPending}
                  className="forpsi-button-primary"
                >
                  {createOrderMutation.isPending ? 'Creating...' : 'Create Order'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateOrder(false)}
                  className="forpsi-button-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Orders List */}
        {isLoading ? (
          <div className="text-center py-8">Loading orders...</div>
        ) : !orders || orders.length === 0 ? (
          <div className="text-center py-8">
            <ShoppingCart className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No orders found. Create your first order to get started!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="forpsi-card p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-[hsl(var(--forpsi-cyan))] rounded-lg flex items-center justify-center">
                      <ShoppingCart className="w-6 h-6 text-[hsl(var(--forpsi-charcoal))]" />
                    </div>
                    <div>
                     <h3 className="font-semibold text-foreground">{order.package}</h3>
                     <p className="text-muted-foreground text-sm">#{order.id}</p>
                   </div>
                 </div>
                 <div className="text-right">
                   <div className="flex items-center space-x-2 mb-1">
                     {getStatusIcon(order.paid ? 'completed' : 'pending')}
                     <span className={`font-medium text-sm capitalize ${getStatusColor(order.paid ? 'completed' : 'pending')}`}>
                       {order.paid ? 'Paid' : 'Pending'}
                     </span>
                   </div>
                    <div className="text-muted-foreground text-sm">
                      {new Date(order.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-border">
                   <div>
                     <span className="text-muted-foreground text-sm">RAM</span>
                     <div className="flex items-center space-x-1">
                       <span className="font-medium">{order.ram}MB</span>
                     </div>
                   </div>
                   <div>
                     <span className="text-muted-foreground text-sm">CPU</span>
                     <div className="font-medium">{order.cpu}%</div>
                   </div>
                   <div>
                     <span className="text-muted-foreground text-sm">Disk</span>
                     <div className="font-medium">{order.disk}MB</div>
                   </div>
                   <div>
                     <span className="text-muted-foreground text-sm">Expires</span>
                     <div className="font-medium">{order.expires_at ? new Date(order.expires_at).toLocaleDateString() : 'Never'}</div>
                   </div>
                 </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Orders;
