"use client";

import { useState } from "react";

interface ApiFunction {
  name: string;
  method: string;
  endpoint: string;
  params?: Record<string, any>;
  body?: Record<string, any>;
}

const API_FUNCTIONS: ApiFunction[] = [
  {
    name: "Create Connect Token",
    method: "POST",
    endpoint: "/api/pipedream/tokens",
    body: {
      external_user_id: "test-user-123",
      allowed_origins: ["http://localhost:3000"],
    },
  },
  {
    name: "List Accounts",
    method: "GET",
    endpoint: "/api/pipedream/accounts",
    params: {
      external_user_id: "test-user-123",
    },
  },
  {
    name: "Get Account Details",
    method: "GET",
    endpoint: "/api/pipedream/accounts/{accountId}",
    params: {
      include_credentials: "false",
    },
  },
  {
    name: "Delete Account",
    method: "DELETE",
    endpoint: "/api/pipedream/accounts/{accountId}",
  },
  {
    name: "Delete All Accounts for App",
    method: "DELETE",
    endpoint: "/api/pipedream/accounts/apps/{appId}",
  },
  {
    name: "Delete External User",
    method: "DELETE",
    endpoint: "/api/pipedream/users/{userId}",
  },
  {
    name: "List Components",
    method: "GET",
    endpoint: "/api/pipedream/components/{componentType}",
    params: {
      app: "google_sheets",
    },
  },
  {
    name: "Get Component",
    method: "GET",
    endpoint: "/api/pipedream/components/{componentType}/{componentKey}",
  },
  {
    name: "Configure Component",
    method: "POST",
    endpoint: "/api/pipedream/components/{componentType}/configure",
    body: {
      configured_props: {},
      external_user_id: "test-user-123",
      id: "component-id",
      prop_name: "prop-name",
    },
  },
];

export default function PipedreamDemo() {
  const [selectedFunction, setSelectedFunction] = useState<ApiFunction>(API_FUNCTIONS[0]);
  const [results, setResults] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [inputs, setInputs] = useState<Record<string, any>>({});

  const executeFunction = async (func: ApiFunction) => {
    setLoading({ ...loading, [func.name]: true });
    
    try {
      let endpoint = func.endpoint;
      const functionInputs = inputs[func.name] || {};
      
      // Replace path parameters
      endpoint = endpoint.replace(/{(\w+)}/g, (match, param) => {
        return functionInputs[param] || match;
      });

      // Build query params
      let url = endpoint;
      if (func.method === "GET" && func.params) {
        const params = new URLSearchParams();
        Object.entries(func.params).forEach(([key, value]) => {
          const inputValue = functionInputs[key] !== undefined ? functionInputs[key] : value;
          if (inputValue !== undefined && inputValue !== "") {
            params.append(key, inputValue);
          }
        });
        if (params.toString()) {
          url += `?${params.toString()}`;
        }
      }

      const options: RequestInit = {
        method: func.method,
        headers: {
          "Content-Type": "application/json",
        },
      };

      if (func.method !== "GET" && func.body) {
        const body = { ...func.body };
        Object.entries(functionInputs).forEach(([key, value]) => {
          if (value !== undefined && value !== "") {
            body[key] = value;
          }
        });
        options.body = JSON.stringify(body);
      }

      const response = await fetch(url, options);
      const data = await response.json();

      setResults({
        ...results,
        [func.name]: {
          status: response.status,
          data,
          timestamp: new Date().toLocaleTimeString(),
          url,
          method: func.method,
        },
      });
    } catch (error) {
      setResults({
        ...results,
        [func.name]: {
          error: error instanceof Error ? error.message : "Failed to execute",
          timestamp: new Date().toLocaleTimeString(),
        },
      });
    } finally {
      setLoading({ ...loading, [func.name]: false });
    }
  };

  const updateInput = (functionName: string, field: string, value: string) => {
    setInputs({
      ...inputs,
      [functionName]: {
        ...inputs[functionName],
        [field]: value,
      },
    });
  };

  const renderInputFields = (func: ApiFunction) => {
    const pathParams = func.endpoint.match(/{(\w+)}/g)?.map(p => p.slice(1, -1)) || [];
    const allParams = [
      ...pathParams.map(p => ({ name: p, type: "path" })),
      ...(func.params ? Object.keys(func.params).map(p => ({ name: p, type: "query" })) : []),
      ...(func.body ? Object.keys(func.body).map(p => ({ name: p, type: "body" })) : []),
    ];

    return allParams.map(param => (
      <div key={param.name} className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {param.name} ({param.type})
        </label>
        <input
          type="text"
          value={inputs[func.name]?.[param.name] || ""}
          onChange={(e) => updateInput(func.name, param.name, e.target.value)}
          placeholder={
            typeof func.params?.[param.name] === 'string' 
              ? func.params[param.name]
              : typeof func.body?.[param.name] === 'string'
              ? func.body[param.name]
              : `Enter ${param.name}`
          }
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
    ));
  };

  const currentResult = results[selectedFunction.name];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-80 bg-white shadow-lg overflow-y-auto">
        <div className="p-6 border-b">
          <h1 className="text-2xl font-bold text-gray-900">
            Pipedream API Explorer
          </h1>
        </div>
        
        <nav className="p-4">
          {API_FUNCTIONS.map((func) => (
            <button
              key={func.name}
              onClick={() => setSelectedFunction(func)}
              className={`w-full text-left px-4 py-3 rounded-lg mb-2 transition-colors ${
                selectedFunction.name === func.name
                  ? "bg-blue-50 text-blue-700 border-l-4 border-blue-700"
                  : "hover:bg-gray-100 text-gray-700"
              }`}
            >
              <div className="font-medium">{func.name}</div>
              <div className="text-xs text-gray-500 mt-1">
                <span className={`inline-block px-2 py-1 rounded font-mono ${
                  func.method === "GET" ? "bg-green-100 text-green-800" :
                  func.method === "POST" ? "bg-blue-100 text-blue-800" :
                  func.method === "DELETE" ? "bg-red-100 text-red-800" :
                  "bg-gray-100 text-gray-800"
                }`}>
                  {func.method}
                </span>
              </div>
            </button>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="bg-white shadow-sm border-b px-8 py-6">
          <h2 className="text-2xl font-semibold text-gray-900">
            {selectedFunction.name}
          </h2>
          <p className="text-sm text-gray-600 mt-1 font-mono">
            {selectedFunction.method} {selectedFunction.endpoint}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="max-w-6xl mx-auto p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Input Section */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Parameters
                </h3>
                <div className="bg-white rounded-lg shadow p-6">
                  {renderInputFields(selectedFunction)}
                  
                  <button
                    onClick={() => executeFunction(selectedFunction)}
                    disabled={loading[selectedFunction.name]}
                    className={`w-full mt-6 py-3 px-4 rounded-md text-white font-medium transition-colors
                      ${loading[selectedFunction.name] 
                        ? "bg-gray-400 cursor-not-allowed" 
                        : "bg-blue-600 hover:bg-blue-700"
                      }`}
                  >
                    {loading[selectedFunction.name] ? (
                      <span className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Executing...
                      </span>
                    ) : "Execute"}
                  </button>
                </div>
              </div>

              {/* Result Section */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Response
                </h3>
                {currentResult ? (
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="mb-4 flex items-center justify-between">
                      <div>
                        <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                          currentResult.status >= 200 && currentResult.status < 300
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}>
                          Status: {currentResult.status}
                        </span>
                      </div>
                      <span className="text-sm text-gray-500">
                        {currentResult.timestamp}
                      </span>
                    </div>
                    
                    {currentResult.url && (
                      <div className="mb-4 p-3 bg-gray-50 rounded-md">
                        <p className="text-xs font-mono text-gray-600">
                          {currentResult.method} {currentResult.url}
                        </p>
                      </div>
                    )}
                    
                    <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                      <pre className="text-sm text-gray-100 font-mono">
                        {JSON.stringify(
                          currentResult.error || currentResult.data, 
                          null, 
                          2
                        )}
                      </pre>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white rounded-lg shadow p-6">
                    <p className="text-gray-500 text-center py-8">
                      No response yet. Execute the function to see the result.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}