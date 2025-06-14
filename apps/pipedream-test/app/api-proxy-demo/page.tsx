"use client";

import { useState, useEffect } from "react";

interface Account {
  id: string;
  name: string;
  external_id: string;
  app: {
    name_slug: string;
    name: string;
    img_src: string;
  };
}

interface ApiExample {
  service: string;
  name: string;
  method: string;
  endpoint: string;
  description: string;
  body?: any;
  headers?: Record<string, string>;
}

interface GoogleFile {
  id: string;
  name: string;
  mimeType: string;
  createdTime: string;
  modifiedTime: string;
}

interface SheetDetails {
  properties: {
    title: string;
    locale: string;
    timeZone: string;
  };
  sheets: Array<{
    properties: {
      sheetId: number;
      title: string;
      index: number;
      gridProperties: {
        rowCount: number;
        columnCount: number;
      };
    };
  }>;
}

const API_EXAMPLES: ApiExample[] = [
  // Google Sheets
  {
    service: "google_sheets",
    name: "List Files (Sheets)",
    method: "GET",
    endpoint: "https://www.googleapis.com/drive/v3/files?q=mimeType='application/vnd.google-apps.spreadsheet'&pageSize=10",
    description: "List your Google Sheets files via Drive API",
  },
  {
    service: "google_sheets",
    name: "Get Spreadsheet Metadata",
    method: "GET",
    endpoint: "https://sheets.googleapis.com/v4/spreadsheets/{spreadsheetId}?fields=properties,sheets.properties",
    description: "Get metadata about a specific spreadsheet (replace {spreadsheetId})",
  },
  // Google Drive
  {
    service: "google_drive",
    name: "List Files",
    method: "GET",
    endpoint: "https://www.googleapis.com/drive/v3/files?pageSize=10",
    description: "List files in your Google Drive",
  },
  {
    service: "google_drive",
    name: "Search Files",
    method: "GET",
    endpoint: "https://www.googleapis.com/drive/v3/files?q=name contains 'document'&pageSize=5",
    description: "Search for files with 'document' in the name",
  },
  // Gmail
  {
    service: "gmail",
    name: "List Messages",
    method: "GET",
    endpoint: "https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=10",
    description: "Get a list of recent email messages",
  },
  {
    service: "gmail",
    name: "Get Profile",
    method: "GET",
    endpoint: "https://gmail.googleapis.com/gmail/v1/users/me/profile",
    description: "Get your Gmail profile information",
  },
  // Google Calendar
  {
    service: "google_calendar",
    name: "List Calendars",
    method: "GET",
    endpoint: "https://www.googleapis.com/calendar/v3/users/me/calendarList",
    description: "List all your calendars",
  },
  {
    service: "google_calendar",
    name: "List Events",
    method: "GET",
    endpoint: "https://www.googleapis.com/calendar/v3/calendars/primary/events?maxResults=10",
    description: "List upcoming events from your primary calendar",
  },
  // Google Contacts
  {
    service: "google_contacts",
    name: "List Contacts",
    method: "GET",
    endpoint: "https://people.googleapis.com/v1/people/me/connections?pageSize=10&personFields=names,emailAddresses",
    description: "List your Google contacts",
  },
  // Slack
  {
    service: "slack",
    name: "List Channels",
    method: "GET",
    endpoint: "https://slack.com/api/conversations.list?limit=10",
    description: "List Slack channels you have access to",
  },
  {
    service: "slack",
    name: "Get User Info",
    method: "GET",
    endpoint: "https://slack.com/api/users.info?user=me",
    description: "Get your Slack user information",
  },
  // Notion
  {
    service: "notion",
    name: "Search Pages",
    method: "POST",
    endpoint: "https://api.notion.com/v1/search",
    description: "Search for pages in your Notion workspace",
    body: {
      query: "meeting",
      filter: {
        property: "object",
        value: "page"
      },
      page_size: 5
    },
    headers: {
      "Notion-Version": "2022-06-28"
    }
  },
];

export default function ApiProxyDemo() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string>("");
  const [selectedExample, setSelectedExample] = useState<ApiExample | null>(null);
  const [customUrl, setCustomUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [sheetDetails, setSheetDetails] = useState<Record<string, SheetDetails>>({});
  const [loadingSheetDetails, setLoadingSheetDetails] = useState<Record<string, boolean>>({});
  const [expandedSheets, setExpandedSheets] = useState<Set<string>>(new Set());
  const userId = "test-user-123";

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      const response = await fetch(`/api/pipedream/accounts?external_user_id=${userId}`);
      if (!response.ok) throw new Error("Failed to fetch accounts");
      const data = await response.json();
      setAccounts(Array.isArray(data) ? data : data.data || []);
    } catch (err) {
      console.error("Error fetching accounts:", err);
    }
  };

  const executeRequest = async (example?: ApiExample, accountId?: string) => {
    const targetExample = example || selectedExample;
    const targetAccount = accountId || selectedAccount;
    if (!targetAccount || !targetExample) return;

    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      const url = customUrl || targetExample.endpoint;

      const response = await fetch("/api/pipedream/proxy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          account_id: targetAccount,
          external_user_id: userId,
          target_url: url,
          method: targetExample.method,
          headers: targetExample.headers,
          body: targetExample.body,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Request failed");
      }

      setResponse(data);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
      return null;
    } finally {
      setLoading(false);
    }
  };

  const fetchSheetDetails = async (sheetId: string, accountId: string) => {
    if (sheetDetails[sheetId] || loadingSheetDetails[sheetId]) return;

    setLoadingSheetDetails(prev => ({ ...prev, [sheetId]: true }));

    try {
      const response = await fetch("/api/pipedream/proxy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          account_id: accountId,
          external_user_id: userId,
          target_url: `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}?fields=properties,sheets.properties`,
          method: "GET",
        }),
      });

      const data = await response.json();

      if (response.ok && data.data) {
        setSheetDetails(prev => ({ ...prev, [sheetId]: data.data }));
      }
    } catch (err) {
      console.error("Failed to fetch sheet details:", err);
    } finally {
      setLoadingSheetDetails(prev => ({ ...prev, [sheetId]: false }));
    }
  };

  const toggleSheetExpansion = (sheetId: string) => {
    setExpandedSheets(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sheetId)) {
        newSet.delete(sheetId);
      } else {
        newSet.add(sheetId);
        // Fetch details when expanding
        const account = accounts.find(a => a.app.name_slug === "google_sheets");
        if (account) {
          fetchSheetDetails(sheetId, account.id);
        }
      }
      return newSet;
    });
  };

  const getAccountsForService = (service: string) => {
    return accounts.filter(account => account.app.name_slug === service);
  };

  const availableServices = [...new Set(accounts.map(a => a.app.name_slug))];
  const examplesForConnectedServices = API_EXAMPLES.filter(example =>
    availableServices.includes(example.service)
  );

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            API Proxy Demo
          </h1>
          <p className="text-gray-600">
            Make authenticated API calls to your connected services through Pipedream
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Examples Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                API Examples
              </h2>

              {examplesForConnectedServices.length === 0 ? (
                <p className="text-gray-500 text-sm">
                  No connected accounts found.
                  <a href="/me" className="text-blue-600 hover:text-blue-700 ml-1">
                    Connect accounts
                  </a>
                </p>
              ) : (
                <div className="space-y-2">
                  {examplesForConnectedServices.map((example, index) => {
                    const serviceAccounts = getAccountsForService(example.service);

                    return (
                      <button
                        key={index}
                        onClick={() => {
                          setSelectedExample(example);
                          setCustomUrl(example.endpoint);
                          if (serviceAccounts.length === 1) {
                            setSelectedAccount(serviceAccounts[0].id);
                          }
                        }}
                        className={`w-full text-left p-3 rounded-lg border transition-colors ${selectedExample === example
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 hover:border-gray-300"
                          }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-sm">{example.name}</span>
                          <span className={`text-xs px-2 py-1 rounded ${example.method === "GET" ? "bg-green-100 text-green-700" :
                              example.method === "POST" ? "bg-blue-100 text-blue-700" :
                                "bg-gray-100 text-gray-700"
                            }`}>
                            {example.method}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">
                          {example.service.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
                        </p>
                        <p className="text-xs text-gray-600 mt-1">
                          {example.description}
                        </p>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Request Configuration */}
          <div className="lg:col-span-2 space-y-6">
            {selectedExample && (
              <>
                <div className="bg-white shadow rounded-lg p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    Request Configuration
                  </h2>

                  {/* Account Selection */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Account
                    </label>
                    <select
                      value={selectedAccount}
                      onChange={(e) => setSelectedAccount(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Choose an account...</option>
                      {getAccountsForService(selectedExample.service).map(account => (
                        <option key={account.id} value={account.id}>
                          {account.name} ({account.app.name})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* URL Input */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      API Endpoint
                    </label>
                    <input
                      type="text"
                      value={customUrl}
                      onChange={(e) => setCustomUrl(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                    />
                  </div>

                  {/* Request Body Preview */}
                  {selectedExample.body && (
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Request Body
                      </label>
                      <pre className="bg-gray-100 p-3 rounded-md text-xs overflow-auto">
                        {JSON.stringify(selectedExample.body, null, 2)}
                      </pre>
                    </div>
                  )}

                  <button
                    onClick={() => executeRequest()}
                    disabled={!selectedAccount || loading}
                    className={`w-full py-2 px-4 rounded-md font-medium transition-colors ${!selectedAccount || loading
                        ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                        : "bg-blue-600 text-white hover:bg-blue-700"
                      }`}
                  >
                    {loading ? "Executing..." : "Execute Request"}
                  </button>
                </div>

                {/* Response Display */}
                {(response || error) && (
                  <div className="bg-white shadow rounded-lg p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">
                      Response
                    </h2>

                    {error ? (
                      <div className="bg-red-50 border border-red-200 rounded-md p-4">
                        <p className="text-red-700">{error}</p>
                      </div>
                    ) : response ? (
                      <div>
                        <div className="mb-4 flex items-center justify-between">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${response.status >= 200 && response.status < 300
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                            }`}>
                            Status: {response.status} {response.statusText}
                          </span>
                        </div>

                        <div className="bg-gray-900 rounded-lg p-4 overflow-auto max-h-96">
                          <pre className="text-sm text-gray-100 font-mono">
                            {JSON.stringify(response.data, null, 2)}
                          </pre>
                        </div>

                        {/* Special rendering for Google Sheets list */}
                        {selectedExample?.name === "List Files (Sheets)" && response.data?.files && (
                          <div className="space-y-2">
                            <p className="text-sm text-gray-600 mb-3">
                              Found {response.data.files.length} spreadsheet{response.data.files.length !== 1 ? 's' : ''}
                            </p>
                            {response.data.files.map((file: GoogleFile) => (
                              <div key={file.id} className="border border-gray-200 rounded-lg">
                                <button
                                  onClick={() => toggleSheetExpansion(file.id)}
                                  className="w-full p-4 text-left hover:bg-gray-50 transition-colors flex items-center justify-between"
                                >
                                  <div>
                                    <h4 className="font-medium text-gray-900">{file.name}</h4>
                                    <p className="text-xs text-gray-500 mt-1">
                                      Modified: {new Date(file.modifiedTime).toLocaleString()}
                                    </p>
                                  </div>
                                  <svg
                                    className={`w-5 h-5 text-gray-400 transition-transform ${expandedSheets.has(file.id) ? 'transform rotate-90' : ''
                                      }`}
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                  </svg>
                                </button>

                                {expandedSheets.has(file.id) && (
                                  <div className="border-t border-gray-200 p-4 bg-gray-50">
                                    {loadingSheetDetails[file.id] ? (
                                      <div className="flex items-center space-x-2">
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                                        <span className="text-sm text-gray-600">Loading sheet details...</span>
                                      </div>
                                    ) : sheetDetails[file.id] ? (
                                      <div className="space-y-3">
                                        <div>
                                          <h5 className="text-sm font-medium text-gray-700">Properties</h5>
                                          <div className="mt-1 text-sm text-gray-600">
                                            <p>Locale: {sheetDetails[file.id].properties.locale}</p>
                                            <p>Time Zone: {sheetDetails[file.id].properties.timeZone}</p>
                                          </div>
                                        </div>

                                        <div>
                                          <h5 className="text-sm font-medium text-gray-700">
                                            Sheets ({sheetDetails[file.id].sheets.length})
                                          </h5>
                                          <div className="mt-1 space-y-1">
                                            {sheetDetails[file.id].sheets.map(sheet => (
                                              <div key={sheet.properties.sheetId} className="text-sm text-gray-600 bg-white p-2 rounded border border-gray-200">
                                                <span className="font-medium">{sheet.properties.title}</span>
                                                <span className="text-xs text-gray-500 ml-2">
                                                  {sheet.properties.gridProperties.rowCount} rows × {sheet.properties.gridProperties.columnCount} columns
                                                </span>
                                              </div>
                                            ))}
                                          </div>
                                        </div>

                                        <div className="pt-2">
                                          <a
                                            href={`https://docs.google.com/spreadsheets/d/${file.id}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-sm text-blue-600 hover:text-blue-700 flex items-center space-x-1"
                                          >
                                            <span>Open in Google Sheets</span>
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                            </svg>
                                          </a>
                                        </div>
                                      </div>
                                    ) : (
                                      <p className="text-sm text-gray-600">Failed to load details</p>
                                    )}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : null}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        <div className="mt-6 flex justify-center space-x-4">
          <a href="/me" className="text-blue-600 hover:text-blue-700">
            Manage Connections
          </a>
          <a href="/pipedream-demo" className="text-blue-600 hover:text-blue-700">
            API Explorer
          </a>
        </div>
      </div>
    </div>
  );
}