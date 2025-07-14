
import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { Users as UsersIcon, Plus, Edit, Trash2, Shield, Key } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { AuthModal } from "@/components/AuthModal";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { UserEditModal } from "@/components/UserEditModal";
import { PasswordManager } from "@/components/PasswordManager";

const Users = () => {
  const { user, userProfile, signOut } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [passwordUser, setPasswordUser] = useState(null);
  const { toast } = useToast();

  const { data: users, isLoading, refetch } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching users:', error);
        throw error;
      }
      return data;
    },
    enabled: !!user,
  });

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-500';
      case 'manager': return 'bg-blue-500';
      case 'user': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('auth_id', userId);

      if (error) throw error;

      toast({
        title: "User deleted",
        description: "User has been successfully deleted.",
      });
      refetch();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
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
              <p className="text-muted-foreground mb-4">Please sign in to access the users panel.</p>
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
            <h1 className="text-3xl font-bold text-foreground">Users</h1>
            <p className="text-muted-foreground mt-1">Manage user accounts and permissions</p>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-muted-foreground">
              Welcome, {userProfile?.first_name || user.email}
            </span>
            <Button variant="outline" onClick={signOut}>
              Sign Out
            </Button>
            <button className="forpsi-button-primary flex items-center space-x-2">
              <Plus className="w-4 h-4" />
              <span>Add User</span>
            </button>
          </div>
        </div>

        {/* Users Grid */}
        {isLoading ? (
          <div className="text-center py-8">Loading users...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {users?.map((user) => (
              <div key={user.auth_id} className="forpsi-card p-6">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-12 h-12 bg-[hsl(var(--forpsi-cyan))] rounded-full flex items-center justify-center">
                    <span className="text-[hsl(var(--forpsi-charcoal))] font-bold text-lg">
                      {((user.first_name || '') + ' ' + (user.last_name || '')).trim().split(' ').map(n => n[0] || 'U').join('') || user.email[0].toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">
                      {user.first_name && user.last_name 
                        ? `${user.first_name} ${user.last_name}` 
                        : user.email}
                    </h3>
                    <p className="text-muted-foreground text-sm">{user.email}</p>
                  </div>
                </div>
                
                <div className="space-y-3 mb-4">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground text-sm">Role</span>
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${getRoleColor(user.role)}`}></div>
                      <span className="text-foreground font-medium text-sm capitalize">{user.role}</span>
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
                    <span className="text-foreground font-medium text-sm">
                      {user.last_login ? formatDate(user.last_login) : 'Never'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground text-sm">Created</span>
                    <span className="text-foreground font-medium text-sm">
                      {formatDate(user.created_at)}
                    </span>
                  </div>
                </div>

                <div className="flex space-x-2 pt-4 border-t border-border">
                  <button 
                    onClick={() => setEditingUser(user)}
                    className="flex-1 bg-muted hover:bg-muted/80 text-foreground transition-colors rounded-lg px-3 py-2 font-medium flex items-center justify-center space-x-2"
                  >
                    <Edit className="w-4 h-4" />
                    <span>Edit</span>
                  </button>
                  <button 
                    onClick={() => setPasswordUser(user)}
                    className="flex-1 bg-muted hover:bg-muted/80 text-foreground transition-colors rounded-lg px-3 py-2 font-medium flex items-center justify-center space-x-2"
                  >
                    <Key className="w-4 h-4" />
                    <span>Password</span>
                  </button>
                  <button className="flex-1 bg-muted hover:bg-muted/80 text-foreground transition-colors rounded-lg px-3 py-2 font-medium flex items-center justify-center space-x-2">
                    <Shield className="w-4 h-4" />
                    <span>Permissions</span>
                  </button>
                  {userProfile?.role === 'admin' && (
                    <button 
                      onClick={() => handleDeleteUser(user.auth_id)}
                      className="flex-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors rounded-lg px-3 py-2 font-medium flex items-center justify-center space-x-2"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        
        <UserEditModal
          user={editingUser}
          isOpen={!!editingUser}
          onClose={() => setEditingUser(null)}
          onUserUpdated={refetch}
        />
        
        <PasswordManager
          user={passwordUser}
          isOpen={!!passwordUser}
          onClose={() => setPasswordUser(null)}
        />
      </div>
    </Layout>
  );
};

export default Users;
