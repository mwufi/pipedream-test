"use client";

import { useState } from "react";
import { createFrontendClient } from "@pipedream/sdk/browser";

export default function Home() {
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<string>("");
  const [connectedAccount, setConnectedAccount] = useState<any>(null);

  async function connectToGoogle() {
    setIsConnecting(true);
    setConnectionStatus("Generating connection token...");

    try {
      // Get connect token from your API
      const tokenResponse = await fetch('/api/genPipedreamToken?userId=test-user-123');

      if (!tokenResponse.ok) {
        throw new Error('Failed to get connect token');
      }

      const { token } = await tokenResponse.json();
      setConnectionStatus("Connecting to Google...");

      // Create frontend client and connect
      const pd = createFrontendClient();

      pd.connectAccount({
        app: "google_sheets",
        token: token,
        onSuccess: (account) => {
          console.log(`Account successfully connected: ${account.id}`);
          setConnectedAccount(account);
          setConnectionStatus(`Successfully connected! Account ID: ${account.id}`);
          setIsConnecting(false);
        },
        onError: (err) => {
          console.error(`Connection error: ${err.message}`);
          setConnectionStatus(`Connection error: ${err.message}`);
          setIsConnecting(false);
        }
      });

    } catch (error) {
      console.error('Error:', error);
      setConnectionStatus(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setIsConnecting(false);
    }
  }

  function resetConnection() {
    setConnectedAccount(null);
    setConnectionStatus("");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-16 flex flex-col items-center justify-center min-h-screen">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Pipedream Test
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Connect your Google account using Pipedream
            </p>
          </div>

          {!connectedAccount ? (
            <div className="space-y-6">
              <button
                onClick={connectToGoogle}
                disabled={isConnecting}
                className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 hover:border-gray-400 text-gray-700 font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
              >
                {isConnecting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                    <span>Connecting...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#4285f4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34a853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#fbbc05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="#ea4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    <span>Connect with Google</span>
                  </>
                )}
              </button>

              {connectionStatus && (
                <div className={`p-4 rounded-lg text-sm ${connectionStatus.includes('error') || connectionStatus.includes('Error')
                  ? 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800'
                  : connectionStatus.includes('Successfully')
                    ? 'bg-green-50 text-green-700 border border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800'
                    : 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800'
                  }`}>
                  {connectionStatus}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="font-medium text-green-800 dark:text-green-200">Connected Successfully!</span>
                </div>
                <p className="text-sm text-green-700 dark:text-green-300">
                  Account ID: <code className="bg-green-100 dark:bg-green-800 px-1 py-0.5 rounded text-xs">{connectedAccount.id}</code>
                </p>
                {connectedAccount.name && (
                  <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                    Name: {connectedAccount.name}
                  </p>
                )}
              </div>

              <button
                onClick={resetConnection}
                className="w-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium py-3 px-4 rounded-lg transition-colors"
              >
                Test Another Connection
              </button>
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
              This connects to Google Sheets via Pipedream SDK
            </p>
            <div className="mt-4">
              <a
                href="/pipedream-demo"
                className="block w-full text-center bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                View All Pipedream API Functions
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
