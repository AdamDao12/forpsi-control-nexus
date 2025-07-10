
import { Layout } from "@/components/Layout";
import { Users as UsersIcon, Plus, Edit, Trash2, Shield } from "lucide-react";

const users = [
  { id: 1, name: "John Doe", email: "john@example.com", role: "Admin", status: "active", lastLogin: "2024-01-15" },
  { id: 2, name: "Jane Smith", email: "jane@example.com", role: "User", status: "active", lastLogin: "2024-01-14" },
  { id: 3, name: "Mike Johnson", email: "mike@example.com", role: "Manager", status: "inactive", lastLogin: "2024-01-10" },
  { id: 4, name: "Sarah Wilson", email: "sarah@example.com", role: "User", status: "active", lastLogin: "2024-01-13" },
];

const Users = () => {
  const getRoleColor = (role: string) => {
    switch (role) {
      case 'Admin': return 'bg-red-500';
      case 'Manager': return 'bg-blue-500';
      case 'User': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <Layout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Users</h1>
            <p className="text-muted-foreground mt-1">Manage user accounts and permissions</p>
          </div>
          <button className="forpsi-button-primary flex items-center space-x-2">
            <Plus className="w-4 h-4" />
            <span>Add User</span>
          </button>
        </div>

        {/* Users Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {users.map((user) => (
            <div key={user.id} className="forpsi-card p-6">
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-12 h-12 bg-[hsl(var(--forpsi-cyan))] rounded-full flex items-center justify-center">
                  <span className="text-[hsl(var(--forpsi-charcoal))] font-bold text-lg">
                    {user.name.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">{user.name}</h3>
                  <p className="text-muted-foreground text-sm">{user.email}</p>
                </div>
              </div>
              
              <div className="space-y-3 mb-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground text-sm">Role</span>
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${getRoleColor(user.role)}`}></div>
                    <span className="text-foreground font-medium text-sm">{user.role}</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground text-sm">Status</span>
                  <span className={`text-sm font-medium ${user.status === 'active' ? 'text-green-400' : 'text-red-400'}`}>
                    {user.status}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground text-sm">Last Login</span>
                  <span className="text-foreground font-medium text-sm">{user.lastLogin}</span>
                </div>
              </div>

              <div className="flex space-x-2 pt-4 border-t border-border">
                <button className="flex-1 bg-muted hover:bg-muted/80 text-foreground transition-colors rounded-lg px-3 py-2 font-medium flex items-center justify-center space-x-2">
                  <Edit className="w-4 h-4" />
                  <span>Edit</span>
                </button>
                <button className="flex-1 bg-muted hover:bg-muted/80 text-foreground transition-colors rounded-lg px-3 py-2 font-medium flex items-center justify-center space-x-2">
                  <Shield className="w-4 h-4" />
                  <span>Permissions</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default Users;
