
import { Layout } from "@/components/Layout";
import { HelpCircle, MessageSquare, FileText, Phone, Mail, Clock } from "lucide-react";

const tickets = [
  { id: "#TIC-001", subject: "Server connectivity issues", status: "open", priority: "high", created: "2024-01-15", updated: "2024-01-15" },
  { id: "#TIC-002", subject: "Billing question", status: "resolved", priority: "low", created: "2024-01-14", updated: "2024-01-14" },
  { id: "#TIC-003", subject: "Performance optimization", status: "in-progress", priority: "medium", created: "2024-01-13", updated: "2024-01-15" },
];

const Support = () => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-red-400';
      case 'in-progress': return 'bg-yellow-400';
      case 'resolved': return 'bg-green-400';
      default: return 'bg-gray-400';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-400';
      case 'medium': return 'text-yellow-400';
      case 'low': return 'text-green-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <Layout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Support</h1>
          <p className="text-muted-foreground mt-1">Get help and manage support tickets</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick Actions */}
          <div className="lg:col-span-1 space-y-6">
            <div className="forpsi-card p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button className="w-full forpsi-button-primary flex items-center justify-center space-x-2">
                  <MessageSquare className="w-4 h-4" />
                  <span>New Ticket</span>
                </button>
                <button className="w-full bg-muted hover:bg-muted/80 text-foreground transition-colors rounded-lg px-4 py-2 font-medium flex items-center justify-center space-x-2">
                  <FileText className="w-4 h-4" />
                  <span>Documentation</span>
                </button>
                <button className="w-full bg-muted hover:bg-muted/80 text-foreground transition-colors rounded-lg px-4 py-2 font-medium flex items-center justify-center space-x-2">
                  <HelpCircle className="w-4 h-4" />
                  <span>FAQ</span>
                </button>
              </div>
            </div>

            <div className="forpsi-card p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Contact Information</h3>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Phone className="w-5 h-5 text-[hsl(var(--forpsi-cyan))]" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Phone Support</p>
                    <p className="text-sm text-muted-foreground">+420 800 123 456</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Mail className="w-5 h-5 text-[hsl(var(--forpsi-cyan))]" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Email Support</p>
                    <p className="text-sm text-muted-foreground">support@forpsi.com</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Clock className="w-5 h-5 text-[hsl(var(--forpsi-cyan))]" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Business Hours</p>
                    <p className="text-sm text-muted-foreground">Mon-Fri 9:00-18:00 CET</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Support Tickets */}
          <div className="lg:col-span-2">
            <div className="forpsi-card p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Recent Tickets</h3>
              <div className="space-y-4">
                {tickets.map((ticket) => (
                  <div key={ticket.id} className="border border-border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <span className="font-medium text-foreground">{ticket.id}</span>
                        <div className="flex items-center space-x-2">
                          <div className={`w-2 h-2 rounded-full ${getStatusColor(ticket.status)}`}></div>
                          <span className="text-sm text-muted-foreground capitalize">{ticket.status}</span>
                        </div>
                      </div>
                      <span className={`text-sm font-medium capitalize ${getPriorityColor(ticket.priority)}`}>
                        {ticket.priority}
                      </span>
                    </div>
                    <h4 className="font-medium text-foreground mb-2">{ticket.subject}</h4>
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Created: {ticket.created}</span>
                      <span>Updated: {ticket.updated}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Support;
