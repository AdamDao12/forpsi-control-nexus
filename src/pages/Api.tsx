
import { useEffect, useState } from "react";
import { Layout } from "@/components/Layout";
import { Code, Key, Copy, Eye, EyeOff, Plus } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { AuthModal } from "@/components/AuthModal";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const Api = () => {
  const { user, userProfile } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showApiKeys, setShowApiKeys] = useState<{[key: string]: boolean}>({});
  const { toast } = useToast();

  const { data: apiKeys, isLoading } = useQuery({
    queryKey: ['api-keys'],
    queryFn: async () => {
      if (!user || userProfile?.role !== 'admin') return [];
      
      const { data, error } = await supabase
        .from('api_keys')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching API keys:', error);
        return [];
      }
      return data;
    },
    enabled: !!user && userProfile?.role === 'admin',
  });

  const toggleShowKey = (keyId: string) => {
    setShowApiKeys(prev => ({
      ...prev,
      [keyId]: !prev[keyId]
    }));
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "API key copied to clipboard.",
    });
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
              <p className="text-muted-foreground mb-4">Please sign in to access the API console.</p>
              <Button onClick={() => setShowAuthModal(true)}>Sign In</Button>
            </div>
          </div>
        </Layout>
        <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
      </>
    );
  }

  if (userProfile?.role !== 'admin') {
    return (
      <Layout>
        <div className="p-6 flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Key className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-4">Admin Access Required</h2>
            <p className="text-muted-foreground">Only administrators can access the API console.</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">API Console</h1>
            <p className="text-muted-foreground mt-1">Manage API keys and integrations</p>
          </div>
          <button className="forpsi-button-primary flex items-center space-x-2">
            <Plus className="w-4 h-4" />
            <span>Add API Key</span>
          </button>
        </div>

        {/* API Documentation */}
        <div className="forpsi-card p-6">
          <h3 className="text-xl font-semibold mb-4 flex items-center space-x-2">
            <Code className="w-5 h-5" />
            <span>API Documentation</span>
          </h3>
          <div className="prose max-w-none">
            <div className="bg-muted p-4 rounded-lg mb-4">
              <h4 className="text-lg font-medium mb-2">Base URL</h4>
              <code className="text-[hsl(var(--forpsi-cyan))]">
                {window.location.origin}/api/v1
              </code>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-medium mb-2">Authentication</h4>
                <p className="text-sm text-muted-foreground mb-2">Include your API key in the Authorization header:</p>
                <code className="text-xs block bg-background p-2 rounded">
                  Authorization: Bearer YOUR_API_KEY
                </code>
              </div>
              
              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-medium mb-2">Content Type</h4>
                <p className="text-sm text-muted-foreground mb-2">All requests should include:</p>
                <code className="text-xs block bg-background p-2 rounded">
                  Content-Type: application/json
                </code>
              </div>
            </div>

            <div className="mt-6">
              <h4 className="text-lg font-medium mb-3">Available Endpoints</h4>
              <div className="space-y-3">
                <div className="border border-border rounded-lg p-3">
                  <div className="flex items-center space-x-3 mb-2">
                    <span className="bg-blue-500 text-white px-2 py-1 rounded text-xs font-mono">GET</span>
                    <code>/servers</code>
                  </div>
                  <p className="text-sm text-muted-foreground">List all servers for the authenticated user</p>
                </div>
                
                <div className="border border-border rounded-lg p-3">
                  <div className="flex items-center space-x-3 mb-2">
                    <span className="bg-green-500 text-white px-2 py-1 rounded text-xs font-mono">POST</span>
                    <code>/servers</code>
                  </div>
                  <p className="text-sm text-muted-foreground">Create a new server instance</p>
                </div>
                
                <div className="border border-border rounded-lg p-3">
                  <div className="flex items-center space-x-3 mb-2">
                    <span className="bg-blue-500 text-white px-2 py-1 rounded text-xs font-mono">GET</span>
                    <code>/orders</code>
                  </div>
                  <p className="text-sm text-muted-foreground">List all orders for the authenticated user</p>
                </div>
                
                <div className="border border-border rounded-lg p-3">
                  <div className="flex items-center space-x-3 mb-2">
                    <span className="bg-green-500 text-white px-2 py-1 rounded text-xs font-mono">POST</span>
                    <code>/support</code>
                  </div>
                  <p className="text-sm text-muted-foreground">Create a new support ticket</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* API Keys Management */}
        <div className="forpsi-card p-6">
          <h3 className="text-xl font-semibold mb-4 flex items-center space-x-2">
            <Key className="w-5 h-5" />
            <span>External API Keys</span>
          </h3>
          
          {isLoading ? (
            <div className="text-center py-8">Loading API keys...</div>
          ) : !apiKeys || apiKeys.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No API keys configured yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {apiKeys.map((key) => (
                <div key={key.id} className="border border-border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${key.is_active ? 'bg-green-400' : 'bg-red-400'}`}></div>
                      <h4 className="font-medium capitalize">{key.service}</h4>
                      <span className="text-xs bg-muted px-2 py-1 rounded">
                        {key.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => toggleShowKey(key.id)}
                        className="p-2 hover:bg-muted rounded-lg transition-colors"
                      >
                        {showApiKeys[key.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => copyToClipboard(key.api_key)}
                        className="p-2 hover:bg-muted rounded-lg transition-colors"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="bg-background p-3 rounded font-mono text-sm">
                    {showApiKeys[key.id] 
                      ? key.api_key 
                      : '•'.repeat(32) + key.api_key.slice(-8)
                    }
                  </div>
                  
                  {key.description && (
                    <p className="text-sm text-muted-foreground mt-2">{key.description}</p>
                  )}
                  
                  <div className="text-xs text-muted-foreground mt-2">
                    Created: {new Date(key.created_at).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Example Usage */}
        <div className="forpsi-card p-6">
          <h3 className="text-xl font-semibold mb-4">Example Usage</h3>
          <div className="bg-background p-4 rounded-lg">
            <pre className="text-sm overflow-x-auto">
{`// Create a new server
fetch('${window.location.origin}/api/v1/servers', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'My Game Server',
    calloutId: 'preset-id',
    location: 'Prague'
  })
})
.then(response => response.json())
.then(data => console.log(data));`}
            </pre>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Api;
