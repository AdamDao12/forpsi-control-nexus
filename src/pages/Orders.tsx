
import { Layout } from "@/components/Layout";
import { ShoppingCart, Eye, Download } from "lucide-react";

const orders = [
  { id: "#ORD-001", service: "VPS Basic", amount: "$29.99", status: "completed", date: "2024-01-15", period: "Monthly" },
  { id: "#ORD-002", service: "Game Server Pro", amount: "$59.99", status: "pending", date: "2024-01-14", period: "Monthly" },
  { id: "#ORD-003", service: "Web Hosting", amount: "$15.99", status: "completed", date: "2024-01-12", period: "Annual" },
  { id: "#ORD-004", service: "Database Server", amount: "$89.99", status: "processing", date: "2024-01-10", period: "Monthly" },
];

const Orders = () => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-400';
      case 'pending': return 'bg-yellow-400';
      case 'processing': return 'bg-blue-400';
      default: return 'bg-gray-400';
    }
  };

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
                    <td className="py-4 px-6 font-medium text-foreground">{order.id}</td>
                    <td className="py-4 px-6 text-foreground">{order.service}</td>
                    <td className="py-4 px-6 font-medium text-foreground">{order.amount}</td>
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-2">
                        <div className={`w-2 h-2 rounded-full ${getStatusColor(order.status)}`}></div>
                        <span className="text-foreground capitalize">{order.status}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-muted-foreground">{order.date}</td>
                    <td className="py-4 px-6 text-muted-foreground">{order.period}</td>
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
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Orders;
