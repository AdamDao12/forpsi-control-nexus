import { useState, useEffect, createContext, useContext } from 'react';
import { useToast } from '@/hooks/use-toast';

interface User {
  id: string;
  email: string;
}

interface UserProfile {
  id: string;
  email: string;
  role: 'admin' | 'user';
  first_name: string;
  last_name: string;
  status?: string;
  created_at?: string;
  last_login?: string;
}

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, firstName?: string, lastName?: string) => Promise<void>;
  signOut: () => Promise<void>;
  refetchProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Simulate loading
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      // Mock sign in
      const mockUser = { id: '1', email };
      const mockProfile = {
        id: '1',
        email,
        role: 'admin' as const,
        first_name: 'Demo',
        last_name: 'User'
      };
      
      setUser(mockUser);
      setUserProfile(mockProfile);
      
      toast({
        title: "Welcome back!",
        description: "You have been successfully signed in.",
      });
    } catch (error: any) {
      toast({
        title: "Sign in failed",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const signUp = async (email: string, password: string, firstName?: string, lastName?: string) => {
    try {
      toast({
        title: "Account created!",
        description: "Your demo account has been created.",
      });
    } catch (error: any) {
      toast({
        title: "Sign up failed",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const signOut = async () => {
    try {
      setUser(null);
      setUserProfile(null);
      
      toast({
        title: "Signed out",
        description: "You have been successfully signed out.",
      });
    } catch (error: any) {
      toast({
        title: "Sign out failed",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const value = {
    user,
    userProfile,
    loading,
    signIn,
    signUp,
    signOut,
    refetchProfile: () => Promise.resolve(),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};