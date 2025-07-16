
import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { User, Mail, Calendar, Shield, Save, RefreshCw } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { AuthModal } from "@/components/AuthModal";
// Mock profile page - no backend needed
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const Profile = () => {
  const { user, userProfile, signOut, refetchProfile } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    first_name: '',
    last_name: '',
    email: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    if (!user) {
      setShowAuthModal(true);
    } else if (userProfile) {
      setProfileData({
        first_name: userProfile.first_name || '',
        last_name: userProfile.last_name || '',
        email: userProfile.email || user.email || ''
      });
    }
  }, [user, userProfile]);

  const handleSaveProfile = async () => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: profileData.first_name,
          last_name: profileData.last_name
        })
        .eq('auth_id', user?.id);

      if (error) throw error;

      setIsEditing(false);
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
      });

      // Refresh the profile data
      await refetchProfile();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    }
  };

  if (!user) {
    return (
      <>
        <Layout>
          <div className="p-6 flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-4">Authentication Required</h2>
              <p className="text-muted-foreground mb-4">Please sign in to access your profile.</p>
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
            <h1 className="text-3xl font-bold text-foreground">Profile</h1>
            <p className="text-muted-foreground mt-1">Manage your account settings</p>
          </div>
          <div className="flex space-x-3">
            <button 
              onClick={refetchProfile}
              className="forpsi-button-secondary flex items-center space-x-2"
              title="Refresh profile data"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </button>
            {isEditing ? (
              <>
                <button 
                  onClick={handleSaveProfile}
                  className="forpsi-button-primary flex items-center space-x-2"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Changes</span>
                </button>
                <button 
                  onClick={() => setIsEditing(false)}
                  className="forpsi-button-secondary"
                >
                  Cancel
                </button>
              </>
            ) : (
              <button 
                onClick={() => setIsEditing(true)}
                className="forpsi-button-secondary"
              >
                Edit Profile
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Card */}
          <div className="lg:col-span-2">
            <div className="forpsi-card p-6">
              <div className="flex items-center space-x-6 mb-6">
                <div className="w-20 h-20 bg-[hsl(var(--forpsi-cyan))] rounded-full flex items-center justify-center">
                  <span className="text-[hsl(var(--forpsi-charcoal))] font-bold text-2xl">
                    {((profileData.first_name || '') + ' ' + (profileData.last_name || '')).trim().split(' ').map(n => n[0] || 'U').join('') || user.email?.[0]?.toUpperCase()}
                  </span>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-foreground">
                    {profileData.first_name && profileData.last_name 
                      ? `${profileData.first_name} ${profileData.last_name}` 
                      : 'Complete your profile'}
                  </h2>
                  <p className="text-muted-foreground">{profileData.email}</p>
                  <div className="flex items-center space-x-2 mt-2">
                    <Shield className="w-4 h-4 text-[hsl(var(--forpsi-cyan))]" />
                    <span className="text-sm font-medium text-[hsl(var(--forpsi-cyan))] capitalize">
                      {userProfile?.role || 'user'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">First Name</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={profileData.first_name}
                        onChange={(e) => setProfileData({...profileData, first_name: e.target.value})}
                        className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                        placeholder="Enter your first name"
                      />
                    ) : (
                      <div className="flex items-center space-x-2 p-3 bg-muted rounded-lg">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <span className="text-foreground">{profileData.first_name || 'Not set'}</span>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Last Name</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={profileData.last_name}
                        onChange={(e) => setProfileData({...profileData, last_name: e.target.value})}
                        className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                        placeholder="Enter your last name"
                      />
                    ) : (
                      <div className="flex items-center space-x-2 p-3 bg-muted rounded-lg">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <span className="text-foreground">{profileData.last_name || 'Not set'}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Email Address</label>
                  <div className="flex items-center space-x-2 p-3 bg-muted rounded-lg">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span className="text-foreground">{profileData.email}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Email cannot be changed from the profile page</p>
                </div>
              </div>
            </div>
          </div>

          {/* Account Info */}
          <div className="space-y-6">
            <div className="forpsi-card p-6">
              <h3 className="text-lg font-semibold mb-4">Account Information</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-sm">Status</span>
                  <span className="text-green-400 font-medium text-sm">
                    {userProfile?.status || 'Active'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-sm">Role</span>
                  <span className="text-foreground font-medium text-sm capitalize">
                    {userProfile?.role || 'User'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-sm">Member Since</span>
                  <span className="text-foreground font-medium text-sm">
                    {userProfile?.created_at ? new Date(userProfile.created_at).toLocaleDateString() : 'Unknown'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground text-sm">Last Login</span>
                  <span className="text-foreground font-medium text-sm">
                    {userProfile?.last_login ? new Date(userProfile.last_login).toLocaleDateString() : 'Never'}
                  </span>
                </div>
              </div>
            </div>

            <div className="forpsi-card p-6">
              <h3 className="text-lg font-semibold mb-4">Account Actions</h3>
              <div className="space-y-3">
                <button 
                  onClick={signOut}
                  className="w-full forpsi-button-secondary"
                >
                  Sign Out
                </button>
                <button className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors rounded-lg px-4 py-2 font-medium">
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Profile;
