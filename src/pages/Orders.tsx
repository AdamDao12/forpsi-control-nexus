
import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { ShoppingCart, Eye, Download } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { AuthModal } from "@/components/AuthModal";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";

const Orders = () => {
  const { user, userProfile } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);

  const { data: orders, isLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching orders:', error);
        throw error;
      }
      return data;
    },
    enabled: !!user,
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-400';
      case 'pending': return 'bg-yellow-400';
      case 'processing': return 'bg-blue-400';
      case 'cancelled': return 'bg-red-400';
      default: return 'bg-gray-400';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatAmount = (amount: number) => {
    return `$${amount.toFixed(2)}`;
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
              <p className="text-muted-foreground mb-4">Please sign in to access your orders.</p>
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
            <p className="text-muted-foreground mt-1">View your order history and invoices</p>
          </div>
          <button className="forpsi-button-primary flex items-center space-x-2">
            <ShoppingCart className="w-4 h-4" />
            <span>New Order</span>
          </button>
        </div>

        {/* Orders Table */}
        <div className="forpsi-card">
          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="text-center py-8">Loading orders...</div>
            ) : !orders || orders.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No orders found.</p>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-4 px-6 font-medium text-muted-foreground">Order ID</th>
                    <th className="text-left py-4 px-6 font-medium text-muted-foreground">Service</th>
                    <th className="text-left py-4 px-6 font-medium text-muted-foreground">Amount</th>
                    <th className="text-left py-4 px-6 font-medium text-muted-foreground">Status</th>
                    <th className="text-left py-4 px-6 font-medium text-muted-foreground">Date</th>
                    <th className="text-left py-4 px-6 font-medium text-muted-foreground">Period</th>
                    <th className="text-left py-4 px-6 font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                      <td className="py-4 px-6 font-medium text-foreground">{order.order_id}</td>
                      <td className="py-4 px-6 text-foreground">{order.service}</td>
                      <td className="py-4 px-6 font-medium text-foreground">{formatAmount(order.amount)}</td>
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-2">
                          <div className={`w-2 h-2 rounded-full ${getStatusColor(order.status)}`}></div>
                          <span className="text-foreground capitalize">{order.status}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-muted-foreground">{formatDate(order.created_at)}</td>
                      <td className="py-4 px-6 text-muted-foreground capitalize">{order.period}</td>
                      <td className="py-4 px-6">
                        <div className="flex space-x-2">
                          <button className="p-2 hover:bg-sidebar-accent rounded-lg transition-colors">
                            <Eye className="w-4 h-4 text-muted-foreground" />
                          </button>
                          <button className="p-2 hover:bg-sidebar-accent rounded-lg transition-colors">
                            <Download className="w-4 h-4 text-muted-foreground" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Orders;
