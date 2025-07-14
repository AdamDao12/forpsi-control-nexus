
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  Server, 
  ShoppingCart, 
  Users, 
  User, 
  HelpCircle, 
  Menu,
  ChevronLeft,
  Settings,
  Code,
  LogOut,
  Database
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/" },
  { icon: Server, label: "Servers", path: "/servers" },
  { icon: Database, label: "Nodes", path: "/nodes" },
  { icon: ShoppingCart, label: "Orders", path: "/orders" },
  { icon: Users, label: "Users", path: "/users" },
  { icon: User, label: "Profile", path: "/profile" },
  { icon: HelpCircle, label: "Support", path: "/support" },
  { icon: Settings, label: "Admin", path: "/admin" },
  { icon: Code, label: "API", path: "/api" },
];

export const Sidebar = ({ collapsed, onToggle }: SidebarProps) => {
  const location = useLocation();
  const { user, userProfile, signOut } = useAuth();

  return (
    <div className={`fixed left-0 top-0 h-full bg-sidebar-background border-r border-sidebar-border transition-all duration-300 z-50 ${collapsed ? 'w-16' : 'w-64'}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
        {!collapsed && (
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-[hsl(var(--forpsi-cyan))] rounded-lg flex items-center justify-center">
              <span className="text-[hsl(var(--forpsi-charcoal))] font-bold text-sm">F</span>
            </div>
            <span className="text-lg font-semibold text-sidebar-foreground">Forpsi</span>
          </div>
        )}
        <button
          onClick={onToggle}
          className="p-1.5 rounded-lg hover:bg-sidebar-accent transition-colors"
        >
          {collapsed ? (
            <Menu className="w-5 h-5 text-sidebar-foreground" />
          ) : (
            <ChevronLeft className="w-5 h-5 text-sidebar-foreground" />
          )}
        </button>
      </div>

      {/* Menu Items */}
      <nav className="mt-4 px-2">
        {menuItems.map((item, index) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={index}
              to={item.path}
              className={`w-full flex items-center space-x-3 px-3 py-3 rounded-xl mb-1 transition-all duration-200 group ${
                isActive
                  ? 'bg-[hsl(var(--forpsi-cyan))] text-[hsl(var(--forpsi-charcoal))]'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-[hsl(var(--forpsi-charcoal))]' : 'text-sidebar-foreground'}`} />
              {!collapsed && (
                <span className="font-medium">{item.label}</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div className="absolute bottom-4 left-4 right-4 space-y-3">
          {/* User Info */}
          {user && (
            <div className="bg-sidebar-accent rounded-xl p-3">
              <div className="text-xs text-sidebar-foreground/70 mb-1">Signed in as</div>
              <div className="text-sm text-sidebar-foreground font-medium">
                {userProfile?.first_name} {userProfile?.last_name}
              </div>
              <div className="text-xs text-sidebar-foreground/70">{user.email}</div>
              <div className="text-xs text-sidebar-foreground/70">Role: {userProfile?.role || 'Loading...'}</div>
              <button
                onClick={signOut}
                className="mt-2 w-full flex items-center space-x-2 text-xs text-sidebar-foreground/70 hover:text-sidebar-foreground transition-colors"
              >
                <LogOut className="w-3 h-3" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
          
          {/* Status */}
          <div className="bg-sidebar-accent rounded-xl p-3">
            <div className="text-xs text-sidebar-foreground/70 mb-1">Status</div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span className="text-sm text-sidebar-foreground">All Systems Operational</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
