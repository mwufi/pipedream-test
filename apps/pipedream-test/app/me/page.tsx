"use client";

import { useState, useEffect } from "react";
import { createFrontendClient } from "@pipedream/sdk/browser";

interface Account {
  id: string;
  name: string;
  external_id: string;
  healthy: boolean;
  dead: boolean | null;
  app: {
    id: string;
    name_slug: string;
    name: string;
    auth_type: string;
    description: string;
    img_src: string;
    categories: string[];
  };
  created_at: string;
  updated_at: string;
}

interface Service {
  name: string;
  slug: string;
  icon: string;
  description: string;
  allowMultiple?: boolean;
}

const SUPPORTED_SERVICES: Service[] = [
  {
    name: "Gmail",
    slug: "gmail",
    icon: "",
    description: "Send and receive email",
    allowMultiple: true
  },
  {
    name: "Google Calendar",
    slug: "google_calendar",
    icon: "",
    description: "Organize your schedule and share events",
    allowMultiple: true
  },
  {
    name: "Google Contacts",
    slug: "google_contacts",
    icon: "",
    description: "Manage your contacts",
    allowMultiple: true
  },
  {
    name: "Google Sheets",
    slug: "google_sheets",
    icon: "",
    description: "Create and edit online spreadsheets",
    allowMultiple: true
  },
  {
    name: "Google Drive",
    slug: "google_drive",
    icon: "",
    description: "Store and share files in the cloud",
    allowMultiple: true
  },
  {
    name: "Notion",
    slug: "notion",
    icon: "",
    description: "All-in-one workspace for notes and collaboration"
  },
  {
    name: "Slack",
    slug: "slack",
    icon: "",
    description: "Team communication and collaboration"
  },
];

export default function MePage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedServices, setExpandedServices] = useState<Set<string>>(new Set());
  const userId = "test-user-123"; // In a real app, this would come from your auth system

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      const response = await fetch(`/api/pipedream/accounts?external_user_id=${userId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch accounts");
      }
      const data = await response.json();
      // The API returns an object with a data array
      setAccounts(Array.isArray(data) ? data : data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load accounts");
    } finally {
      setLoading(false);
    }
  };

  const connectService = async (service: Service) => {
    setConnecting(service.slug);
    setError(null);

    try {
      // Get connect token from API
      const tokenResponse = await fetch("/api/pipedream/tokens", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          external_user_id: userId,
          allowed_origins: [window.location.origin],
        }),
      });

      if (!tokenResponse.ok) {
        throw new Error("Failed to get connect token");
      }

      const { token } = await tokenResponse.json();

      // Create frontend client and connect
      const pd = createFrontendClient();

      pd.connectAccount({
        app: service.slug,
        token: token,
        onSuccess: async (account) => {
          console.log(`Successfully connected to ${service.name}:`, account);
          // Refresh accounts list
          await fetchAccounts();
          setConnecting(null);
          // Auto-expand the service to show the new account
          setExpandedServices(prev => new Set([...prev, service.slug]));
        },
        onError: (err) => {
          console.error(`Connection error:`, err);
          setError(`Failed to connect to ${service.name}: ${err.message}`);
          setConnecting(null);
        },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connection failed");
      setConnecting(null);
    }
  };

  const disconnectAccount = async (accountId: string) => {
    if (!confirm("Are you sure you want to disconnect this account?")) {
      return;
    }

    try {
      const response = await fetch(`/api/pipedream/accounts/${accountId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to disconnect account");
      }

      // Refresh accounts list
      await fetchAccounts();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to disconnect");
    }
  };

  const getServiceAccounts = (serviceSlug: string) => {
    return accounts.filter(account => account.app.name_slug === serviceSlug);
  };

  const toggleServiceExpansion = (serviceSlug: string) => {
    setExpandedServices(prev => {
      const newSet = new Set(prev);
      if (newSet.has(serviceSlug)) {
        newSet.delete(serviceSlug);
      } else {
        newSet.add(serviceSlug);
      }
      return newSet;
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your accounts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">My Connected Accounts</h1>
            <p className="mt-1 text-sm text-gray-600">
              Connect multiple accounts for each service through Pipedream
            </p>
          </div>

          {error && (
            <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="p-6">
            <div className="space-y-4">
              {SUPPORTED_SERVICES.map((service) => {
                const serviceAccounts = getServiceAccounts(service.slug);
                const hasAccounts = serviceAccounts.length > 0;
                const isExpanded = expandedServices.has(service.slug);

                return (
                  <div key={service.slug} className="border border-gray-200 rounded-lg">
                    <div className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 flex-1">
                          <img
                            src={serviceAccounts[0]?.app.img_src || `https://api.dicebear.com/7.x/identicon/svg?seed=${service.slug}`}
                            alt={service.name}
                            className="w-12 h-12 rounded-lg object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/identicon/svg?seed=${service.slug}`;
                            }}
                          />
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <h3 className="text-lg font-medium text-gray-900">
                                {service.name}
                              </h3>
                              {serviceAccounts.length > 0 && (
                                <span className="text-sm text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                                  {serviceAccounts.length} account{serviceAccounts.length > 1 ? 's' : ''}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-500">
                              {service.description}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          {hasAccounts && (
                            <button
                              onClick={() => toggleServiceExpansion(service.slug)}
                              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                            >
                              <svg
                                className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </button>
                          )}

                          <button
                            onClick={() => connectService(service)}
                            disabled={connecting === service.slug}
                            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                              connecting === service.slug
                                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                : "bg-blue-600 text-white hover:bg-blue-700"
                            }`}
                          >
                            {connecting === service.slug ? (
                              <span className="flex items-center">
                                <svg
                                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-400"
                                  xmlns="http://www.w3.org/2000/svg"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                >
                                  <circle
                                    className="opacity-25"
                                    cx="12"
                                    cy="12"
                                    r="10"
                                    stroke="currentColor"
                                    strokeWidth="4"
                                  ></circle>
                                  <path
                                    className="opacity-75"
                                    fill="currentColor"
                                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                  ></path>
                                </svg>
                                Connecting...
                              </span>
                            ) : (
                              <>
                                {hasAccounts && service.allowMultiple ? 'Add Another' : 'Connect'}
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Connected Accounts List */}
                      {hasAccounts && isExpanded && (
                        <div className="mt-4 space-y-2 pl-16">
                          {serviceAccounts.map((account) => (
                            <div key={account.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <div>
                                <p className="font-medium text-gray-900">{account.name}</p>
                                <p className="text-xs text-gray-500">
                                  ID: {account.id}
                                </p>
                              </div>
                              <div className="flex items-center space-x-2">
                                <span
                                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                    account.healthy
                                      ? "bg-green-100 text-green-800"
                                      : "bg-red-100 text-red-800"
                                  }`}
                                >
                                  {account.healthy ? "Healthy" : "Unhealthy"}
                                </span>
                                <button
                                  onClick={() => disconnectAccount(account.id)}
                                  className="text-sm text-red-600 hover:text-red-700"
                                >
                                  Remove
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                User ID: <code className="bg-gray-100 px-2 py-1 rounded">{userId}</code>
              </p>
              <div className="space-x-4">
                <a href="/" className="text-sm text-blue-600 hover:text-blue-700">
                  Back to Home
                </a>
                <a href="/google-index-demo" className="text-sm text-blue-600 hover:text-blue-700">
                  Google Indexer
                </a>
                <a href="/api-proxy-demo" className="text-sm text-blue-600 hover:text-blue-700">
                  API Proxy Demo
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}