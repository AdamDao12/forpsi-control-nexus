
import { Layout } from "@/components/Layout";
import { User, Mail, Phone, MapPin, Calendar, Key, CreditCard } from "lucide-react";

const Profile = () => {
  return (
    <Layout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Profile</h1>
          <p className="text-muted-foreground mt-1">Manage your account settings and preferences</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Card */}
          <div className="lg:col-span-1">
            <div className="forpsi-card p-6">
              <div className="text-center">
                <div className="w-24 h-24 bg-[hsl(var(--forpsi-cyan))] rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-[hsl(var(--forpsi-charcoal))] font-bold text-2xl">JD</span>
                </div>
                <h3 className="text-xl font-semibold text-foreground">John Doe</h3>
                <p className="text-muted-foreground">Premium Customer</p>
                <div className="flex items-center justify-center space-x-2 mt-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span className="text-sm text-muted-foreground">Online</span>
                </div>
              </div>
              
              <div className="mt-6 space-y-4">
                <div className="flex items-center space-x-3 text-sm">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span className="text-foreground">john.doe@example.com</span>
                </div>
                <div className="flex items-center space-x-3 text-sm">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <span className="text-foreground">+420 123 456 789</span>
                </div>
                <div className="flex items-center space-x-3 text-sm">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <span className="text-foreground">Prague, Czech Republic</span>
                </div>
                <div className="flex items-center space-x-3 text-sm">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="text-foreground">Member since Jan 2023</span>
                </div>
              </div>
            </div>
          </div>

          {/* Settings */}
          <div className="lg:col-span-2 space-y-6">
            {/* Account Settings */}
            <div className="forpsi-card p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Account Settings</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">First Name</label>
                  <input 
                    type="text" 
                    defaultValue="John"
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-[hsl(var(--forpsi-cyan))] focus:border-transparent text-foreground"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Last Name</label>
                  <input 
                    type="text" 
                    defaultValue="Doe"
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-[hsl(var(--forpsi-cyan))] focus:border-transparent text-foreground"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Email</label>
                  <input 
                    type="email" 
                    defaultValue="john.doe@example.com"
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-[hsl(var(--forpsi-cyan))] focus:border-transparent text-foreground"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Phone</label>
                  <input 
                    type="tel" 
                    defaultValue="+420 123 456 789"
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-[hsl(var(--forpsi-cyan))] focus:border-transparent text-foreground"
                  />
                </div>
              </div>
              <button className="forpsi-button-primary mt-4">Save Changes</button>
            </div>

            {/* Security Settings */}
            <div className="forpsi-card p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center space-x-2">
                <Key className="w-5 h-5" />
                <span>Security</span>
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Current Password</label>
                  <input 
                    type="password" 
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-[hsl(var(--forpsi-cyan))] focus:border-transparent text-foreground"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">New Password</label>
                  <input 
                    type="password" 
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-[hsl(var(--forpsi-cyan))] focus:border-transparent text-foreground"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Confirm New Password</label>
                  <input 
                    type="password" 
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-[hsl(var(--forpsi-cyan))] focus:border-transparent text-foreground"
                  />
                </div>
              </div>
              <button className="forpsi-button-secondary mt-4">Update Password</button>
            </div>

            {/* Billing Information */}
            <div className="forpsi-card p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center space-x-2">
                <CreditCard className="w-5 h-5" />
                <span>Billing Information</span>
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Address</label>
                  <input 
                    type="text" 
                    defaultValue="123 Main Street"
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-[hsl(var(--forpsi-cyan))] focus:border-transparent text-foreground"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">City</label>
                    <input 
                      type="text" 
                      defaultValue="Prague"
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-[hsl(var(--forpsi-cyan))] focus:border-transparent text-foreground"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">ZIP Code</label>
                    <input 
                      type="text" 
                      defaultValue="10000"
                      className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:ring-2 focus:ring-[hsl(var(--forpsi-cyan))] focus:border-transparent text-foreground"
                    />
                  </div>
                </div>
              </div>
              <button className="forpsi-button-primary mt-4">Update Billing</button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Profile;
