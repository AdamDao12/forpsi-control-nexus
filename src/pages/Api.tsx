import { useState } from "react";
import { Layout } from "@/components/Layout";
import { Code, Key, Copy, Eye, EyeOff, Plus } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { AuthModal } from "@/components/AuthModal";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const Api = () => {
  const { user } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [apiKeys, setApiKeys] = useState([
    { id: 1, name: "Production API", key: "fp_prod_abcd1234efgh5678", created_at: "2024-01-15", last_used: "2024-01-20" },
    { id: 2, name: "Development API", key: "fp_dev_xyz9876def4321", created_at: "2024-01-10", last_used: "2024-01-19" }
  ]);
  const { toast } = useToast();

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "API key copied to clipboard.",
    });
  };

  if (!user) {
    return (
      <>
        <Layout>
          <div className="p-6 flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-4">Authentication Required</h2>
              <p className="text-muted-foreground mb-4">Please sign in to access API management.</p>
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">API Management</h1>
            <p className="text-muted-foreground mt-1">Manage your API keys and access (Demo)</p>
          </div>
          <Button className="flex items-center space-x-2">
            <Plus className="w-4 h-4" />
            <span>Create API Key</span>
          </Button>
        </div>

        <div className="forpsi-card p-6">
          <h3 className="text-lg font-semibold mb-4 text-foreground">Your API Keys</h3>
          <div className="space-y-4">
            {apiKeys.map((apiKey) => (
              <div key={apiKey.id} className="flex items-center justify-between p-4 bg-sidebar-accent rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <Key className="w-5 h-5 text-[hsl(var(--forpsi-cyan))]" />
                    <div>
                      <p className="font-medium text-foreground">{apiKey.name}</p>
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <span>
                          {showApiKey ? apiKey.key : apiKey.key.replace(/./g, '*').substring(0, 20) + '...'}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowApiKey(!showApiKey)}
                          className="p-1 h-auto"
                        >
                          {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(apiKey.key)}
                          className="p-1 h-auto"
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">
                    Created: {new Date(apiKey.created_at).toLocaleDateString()} • 
                    Last used: {new Date(apiKey.last_used).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="forpsi-card p-6">
          <h3 className="text-lg font-semibold mb-4 text-foreground">API Documentation</h3>
          <div className="space-y-4">
            <div className="p-4 bg-sidebar-accent rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Code className="w-5 h-5 text-[hsl(var(--forpsi-orange))]" />
                <span className="font-medium text-foreground">Base URL</span>
              </div>
              <code className="text-sm text-muted-foreground">https://api.forpsi.com/v1</code>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-sidebar-accent rounded-lg">
                <h4 className="font-medium text-foreground mb-2">Authentication</h4>
                <p className="text-sm text-muted-foreground mb-2">Include your API key in the Authorization header:</p>
                <code className="text-xs text-muted-foreground block bg-background p-2 rounded">
                  Authorization: Bearer YOUR_API_KEY
                </code>
              </div>
              
              <div className="p-4 bg-sidebar-accent rounded-lg">
                <h4 className="font-medium text-foreground mb-2">Rate Limits</h4>
                <p className="text-sm text-muted-foreground">
                  • 1000 requests per hour<br/>
                  • 10 requests per second
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Api;