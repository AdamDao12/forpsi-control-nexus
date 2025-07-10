
import { Layout } from "@/components/Layout";
import { Code, Key, Copy, Eye, EyeOff } from "lucide-react";
import { useState } from "react";

const Api = () => {
  const [showApiKey, setShowApiKey] = useState(false);
  const apiKey = "fp_live_1234567890abcdef1234567890abcdef";

  const endpoints = [
    { method: "GET", path: "/api/servers", description: "List all servers" },
    { method: "POST", path: "/api/servers", description: "Create a new server" },
    { method: "GET", path: "/api/servers/{id}", description: "Get server details" },
    { method: "PUT", path: "/api/servers/{id}", description: "Update server" },
    { method: "DELETE", path: "/api/servers/{id}", description: "Delete server" },
    { method: "GET", path: "/api/users", description: "List all users" },
    { method: "POST", path: "/api/users", description: "Create a new user" },
    { method: "GET", path: "/api/orders", description: "List all orders" },
  ];

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET': return 'text-green-400 bg-green-400/10';
      case 'POST': return 'text-blue-400 bg-blue-400/10';  
      case 'PUT': return 'text-yellow-400 bg-yellow-400/10';
      case 'DELETE': return 'text-red-400 bg-red-400/10';
      default: return 'text-gray-400 bg-gray-400/10';
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <Layout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">API Management</h1>
          <p className="text-muted-foreground mt-1">Manage API keys and explore endpoints</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* API Keys */}
          <div className="lg:col-span-1">
            <div className="forpsi-card p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center space-x-2">
                <Key className="w-5 h-5" />
                <span>API Keys</span>
              </h3>
              
              <div className="space-y-4">
                <div className="p-3 bg-muted rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-foreground">Production Key</span>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setShowApiKey(!showApiKey)}
                        className="p-1 hover:bg-sidebar-accent rounded transition-colors"
                      >
                        {showApiKey ? (
                          <EyeOff className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <Eye className="w-4 h-4 text-muted-foreground" />
                        )}
                      </button>
                      <button
                        onClick={() => copyToClipboard(apiKey)}
                        className="p-1 hover:bg-sidebar-accent rounded transition-colors"
                      >
                        <Copy className="w-4 h-4 text-muted-foreground" />
                      </button>
                    </div>
                  </div>
                  <code className="text-sm text-muted-foreground font-mono">
                    {showApiKey ? apiKey : "fp_live_" + "•".repeat(32)}
                  </code>
                  <div className="flex items-center space-x-2 mt-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span className="text-xs text-muted-foreground">Active</span>
                  </div>
                </div>

                <button className="w-full forpsi-button-primary">Generate New Key</button>
                <button className="w-full bg-muted hover:bg-muted/80 text-foreground transition-colors rounded-lg px-4 py-2 font-medium">
                  Revoke Key
                </button>
              </div>
            </div>

            <div className="forpsi-card p-6 mt-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">API Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Requests Today</span>
                  <span className="text-foreground font-medium">1,234</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Rate Limit</span>
                  <span className="text-foreground font-medium">1000/hour</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Remaining</span>
                  <span className="text-foreground font-medium">756</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Success Rate</span>
                  <span className="text-green-400 font-medium">99.2%</span>
                </div>
              </div>
            </div>
          </div>

          {/* API Endpoints */}
          <div className="lg:col-span-2">
            <div className="forpsi-card p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center space-x-2">
                <Code className="w-5 h-5" />
                <span>API Endpoints</span>
              </h3>
              
              <div className="space-y-3">
                {endpoints.map((endpoint, index) => (
                  <div key={index} className="border border-border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getMethodColor(endpoint.method)}`}>
                        {endpoint.method}
                      </span>
                      <code className="text-sm font-mono text-foreground">{endpoint.path}</code>
                    </div>
                    <p className="text-sm text-muted-foreground">{endpoint.description}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="forpsi-card p-6 mt-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Example Request</h3>
              <div className="bg-[hsl(var(--forpsi-charcoal))] rounded-lg p-4 overflow-x-auto">
                <pre className="text-sm text-green-400">
{`curl -X GET \\
  https://api.forpsi.com/v1/servers \\
  -H "Authorization: Bearer ${showApiKey ? apiKey : 'YOUR_API_KEY'}" \\
  -H "Content-Type: application/json"`}
                </pre>
              </div>
              <button
                onClick={() => copyToClipboard(`curl -X GET https://api.forpsi.com/v1/servers -H "Authorization: Bearer ${apiKey}" -H "Content-Type: application/json"`)}
                className="mt-3 text-sm text-[hsl(var(--forpsi-cyan))] hover:text-[hsl(var(--forpsi-blue))] transition-colors flex items-center space-x-1"
              >
                <Copy className="w-4 h-4" />
                <span>Copy to clipboard</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Api;
