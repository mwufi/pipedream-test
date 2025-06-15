"use client";

import { useState, useEffect } from "react";

interface App {
  id: string;
  name_slug: string;
  name: string;
  auth_type: string;
  description?: string;
  img_src?: string;
  categories?: string[];
  featured_weight?: number;
  connect?: {
    proxy_enabled: boolean;
    allowed_domains?: string[];
    base_proxy_target_url?: string;
  };
}

interface Component {
  name: string;
  version: string;
  key: string;
  description?: string;
  type?: string;
}

export default function PipedreamAppsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [apps, setApps] = useState<App[]>([]);
  const [selectedApp, setSelectedApp] = useState<App | null>(null);
  const [components, setComponents] = useState<Component[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingComponents, setLoadingComponents] = useState(false);

  // Search for apps
  const searchApps = async () => {
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/pipedream/apps?q=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();
      
      if (data.data) {
        setApps(data.data);
      }
    } catch (error) {
      console.error("Error searching apps:", error);
    } finally {
      setLoading(false);
    }
  };

  // Get components for selected app
  const getComponents = async (app: App) => {
    setSelectedApp(app);
    setLoadingComponents(true);
    
    try {
      const response = await fetch(`/api/pipedream/components/actions?app=${app.name_slug}`);
      const data = await response.json();
      
      if (data.data) {
        setComponents(data.data);
      }
    } catch (error) {
      console.error("Error fetching components:", error);
    } finally {
      setLoadingComponents(false);
    }
  };

  // Get popular apps on load
  useEffect(() => {
    const fetchPopularApps = async () => {
      setLoading(true);
      try {
        const response = await fetch("/api/pipedream/apps");
        const data = await response.json();
        
        if (data.data) {
          setApps(data.data.slice(0, 12)); // Show first 12 apps
        }
      } catch (error) {
        console.error("Error fetching apps:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchPopularApps();
  }, []);

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Pipedream App Explorer</h1>

      {/* Search Bar */}
      <div className="mb-8">
        <div className="flex gap-4">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && searchApps()}
            placeholder="Search for apps (e.g., salesforce, slack, google)"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={searchApps}
            disabled={loading || !searchQuery.trim()}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300"
          >
            {loading ? "Searching..." : "Search"}
          </button>
        </div>
      </div>

      {/* Apps Grid */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">
          {searchQuery ? `Search Results for "${searchQuery}"` : "Popular Apps"}
        </h2>
        
        {loading ? (
          <div className="text-gray-500">Loading apps...</div>
        ) : apps.length === 0 ? (
          <div className="text-gray-500">No apps found</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {apps.map((app) => (
              <div
                key={app.id}
                onClick={() => getComponents(app)}
                className="border rounded-lg p-4 hover:shadow-lg cursor-pointer transition-shadow"
              >
                <div className="flex items-start gap-3">
                  {app.img_src && (
                    <img
                      src={app.img_src}
                      alt={app.name}
                      className="w-12 h-12 rounded"
                    />
                  )}
                  <div className="flex-1">
                    <h3 className="font-semibold">{app.name}</h3>
                    <p className="text-sm text-gray-600 mb-2">{app.name_slug}</p>
                    {app.description && (
                      <p className="text-sm text-gray-500 line-clamp-2">
                        {app.description}
                      </p>
                    )}
                    <div className="mt-2 flex flex-wrap gap-1">
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                        {app.auth_type}
                      </span>
                      {app.categories?.map((cat, idx) => (
                        <span
                          key={idx}
                          className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded"
                        >
                          {cat}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Selected App Components */}
      {selectedApp && (
        <div className="border-t pt-8">
          <h2 className="text-xl font-semibold mb-4">
            Components for {selectedApp.name}
          </h2>
          
          {loadingComponents ? (
            <div className="text-gray-500">Loading components...</div>
          ) : components.length === 0 ? (
            <div className="text-gray-500">No components found</div>
          ) : (
            <div className="space-y-2">
              {components.map((component) => (
                <div
                  key={component.key}
                  className="border rounded p-3 hover:bg-gray-50"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium">{component.name}</h4>
                      <p className="text-sm text-gray-500">{component.key}</p>
                      {component.description && (
                        <p className="text-sm text-gray-600 mt-1">
                          {component.description}
                        </p>
                      )}
                    </div>
                    <span className="text-xs text-gray-400">
                      v{component.version}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Usage Instructions */}
      <div className="mt-12 p-6 bg-gray-100 rounded-lg">
        <h3 className="font-semibold mb-2">How to use this information:</h3>
        <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
          <li>Search for any app/service that you want to integrate with</li>
          <li>Click on an app to see its available components (actions/triggers)</li>
          <li>Note the <code className="bg-gray-200 px-1 rounded">name_slug</code> for use in API calls</li>
          <li>Check if <code className="bg-gray-200 px-1 rounded">proxy_enabled</code> is true for API access</li>
          <li>Use the component keys to configure specific actions</li>
        </ul>
        
        <div className="mt-4">
          <h4 className="font-semibold mb-2">Example API call:</h4>
          <pre className="bg-gray-800 text-white p-3 rounded text-xs overflow-x-auto">
{`// Search for apps
const response = await fetch('/api/pipedream/apps?q=salesforce');

// Get components for an app
const components = await fetch('/api/pipedream/components/actions?app=slack');`}
          </pre>
        </div>
      </div>
    </div>
  );
}