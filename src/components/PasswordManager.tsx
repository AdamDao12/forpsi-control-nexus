import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { X, Key, Mail } from "lucide-react";

interface PasswordManagerProps {
  user: any;
  isOpen: boolean;
  onClose: () => void;
}

export const PasswordManager = ({ user, isOpen, onClose }: PasswordManagerProps) => {
  const [action, setAction] = useState<'change' | 'reset' | null>(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast({
        title: "Error",
        description: "New passwords don't match",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Error", 
        description: "Password must be at least 6 characters",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Mock password change
      await new Promise(resolve => setTimeout(resolve, 1000));

      toast({
        title: "Success",
        description: "Password updated successfully (demo)",
      });
      
      onClose();
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setAction(null);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    setIsLoading(true);

    try {
      // Mock password reset
      await new Promise(resolve => setTimeout(resolve, 1000));

      toast({
        title: "Reset Email Sent",
        description: "Check your email for password reset instructions (demo)",
      });
      
      onClose();
      setAction(null);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background border border-border rounded-lg p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Password Management</h3>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
        
        {!action ? (
          <div className="space-y-4">
            <p className="text-muted-foreground text-sm">
              Choose how you'd like to manage the password for: {user.email}
            </p>
            
            <div className="space-y-3">
              <Button
                onClick={() => setAction('change')}
                className="w-full flex items-center space-x-2"
                variant="outline"
              >
                <Key className="w-4 h-4" />
                <span>Change Password</span>
              </Button>
              
              <Button
                onClick={() => setAction('reset')}
                className="w-full flex items-center space-x-2"
                variant="outline"
              >
                <Mail className="w-4 h-4" />
                <span>Send Reset Email</span>
              </Button>
            </div>
          </div>
        ) : action === 'change' ? (
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                placeholder="Enter new password"
                required
                minLength={6}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                placeholder="Confirm new password"
                required
                minLength={6}
              />
            </div>
            
            <div className="flex space-x-3 pt-4">
              <Button
                type="submit"
                disabled={isLoading || !newPassword || !confirmPassword}
                className="flex-1"
              >
                {isLoading ? 'Updating...' : 'Update Password'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setAction(null)}
                className="flex-1"
              >
                Back
              </Button>
            </div>
          </form>
        ) : action === 'reset' ? (
          <div className="space-y-4">
            <p className="text-muted-foreground text-sm">
              Send a password reset email to: <strong>{user.email}</strong>
            </p>
            
            <div className="flex space-x-3 pt-4">
              <Button
                onClick={handlePasswordReset}
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? 'Sending...' : 'Send Reset Email'}
              </Button>
              <Button
                variant="outline"
                onClick={() => setAction(null)}
                className="flex-1"
              >
                Back
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};