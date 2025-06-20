"use client";

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';

type SyncType = 'email' | 'calendar' | 'contacts' | 'all' | 'auto';

interface SyncResult {
  loading: boolean;
  data: any;
  error: string | null;
}

interface PipedreamAccount {
  id: string;
  app: {
    name: string;
    name_slug: string;
  };
  email?: string;
  name?: string;
  healthy: boolean;
}

export default function SyncTestPage() {
  const { user, isLoaded } = useUser();
  const [accountId, setAccountId] = useState('');
  const [accounts, setAccounts] = useState<PipedreamAccount[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [accountsError, setAccountsError] = useState<string | null>(null);
  const [syncResults, setSyncResults] = useState<Record<SyncType, SyncResult>>({
    email: { loading: false, data: null, error: null },
    calendar: { loading: false, data: null, error: null },
    contacts: { loading: false, data: null, error: null },
    all: { loading: false, data: null, error: null },
    auto: { loading: false, data: null, error: null },
  });

  // Fetch accounts when user is loaded
  useEffect(() => {
    if (user?.id) {
      fetchAccounts();
    }
  }, [user?.id]);

  const fetchAccounts = async () => {
    setLoadingAccounts(true);
    setAccountsError(null);
    
    try {
      // Call our API that directly talks to Pipedream
      const response = await fetch('/api/pipedream-accounts');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch accounts');
      }
      
      setAccounts(data.accounts || []);
    } catch (error: any) {
      setAccountsError(error.message);
    } finally {
      setLoadingAccounts(false);
    }
  };

  const runSync = async (syncType: SyncType) => {
    if (!accountId.trim()) {
      alert('Please enter an account ID');
      return;
    }

    setSyncResults(prev => ({
      ...prev,
      [syncType]: { loading: true, data: null, error: null }
    }));

    try {
      const response = await fetch('/api/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accountId: accountId.trim(),
          syncType
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Sync failed');
      }

      setSyncResults(prev => ({
        ...prev,
        [syncType]: { loading: false, data, error: null }
      }));
    } catch (error: any) {
      setSyncResults(prev => ({
        ...prev,
        [syncType]: { loading: false, data: null, error: error.message }
      }));
    }
  };

  const checkSyncStatus = async () => {
    if (!accountId.trim()) {
      alert('Please enter an account ID');
      return;
    }

    try {
      const response = await fetch(`/api/sync?accountId=${encodeURIComponent(accountId)}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get sync status');
      }

      alert(JSON.stringify(data, null, 2));
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    }
  };

  if (!isLoaded) {
    return <div className="p-8">Loading...</div>;
  }

  if (!user) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Sync API Test Page</h1>
        <p className="text-red-600">Please sign in to test the sync API.</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">Sync API Test Page</h1>
      <p className="text-gray-600 mb-8">
        Test the /api/sync endpoint with your connected accounts.
      </p>

      <div className="mb-8 p-6 bg-blue-50 rounded-lg">
        <p className="text-sm text-blue-800 mb-2">
          <strong>User ID:</strong> {user.id}
        </p>
        <p className="text-sm text-blue-800">
          <strong>Email:</strong> {user.emailAddresses[0]?.emailAddress}
        </p>
      </div>

      {/* Connected Accounts Section */}
      <div className="mb-8 border rounded-lg p-6 bg-gray-50">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Your Connected Accounts</h2>
          <button
            onClick={fetchAccounts}
            disabled={loadingAccounts}
            className="px-3 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300 disabled:opacity-50"
          >
            {loadingAccounts ? 'Loading...' : 'Refresh'}
          </button>
        </div>
        
        {accountsError && (
          <div className="p-4 bg-red-50 border border-red-200 rounded text-red-700 mb-4">
            Error loading accounts: {accountsError}
          </div>
        )}
        
        {accounts.length === 0 && !loadingAccounts && (
          <p className="text-gray-600">No connected accounts found. Connect accounts via Pipedream first.</p>
        )}
        
        {accounts.length > 0 && (
          <div className="space-y-2">
            {accounts.map((account) => (
              <div
                key={account.id}
                className={`p-3 border rounded cursor-pointer transition-colors ${
                  accountId === account.id
                    ? 'bg-blue-100 border-blue-400'
                    : 'bg-white hover:bg-gray-50'
                }`}
                onClick={() => setAccountId(account.id)}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{account.app.name}</span>
                      <span className="text-xs px-2 py-1 bg-gray-200 rounded">
                        {account.app.name_slug}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600">{account.email || account.name || 'No email'}</div>
                    <div className="text-xs text-gray-500 mt-1">ID: {account.id}</div>
                  </div>
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full ${
                      account.healthy ? 'bg-green-500' : 'bg-red-500'
                    }`} />
                    <span className="text-sm ml-2 text-gray-600">
                      {account.healthy ? 'Healthy' : 'Unhealthy'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mb-8">
        <label className="block text-sm font-medium mb-2">
          Selected Account ID
        </label>
        <input
          type="text"
          value={accountId}
          onChange={(e) => setAccountId(e.target.value)}
          placeholder="Click an account above or enter an ID manually"
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="mb-8">
        <button
          onClick={checkSyncStatus}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 mr-4"
        >
          Check Sync Status
        </button>
      </div>

      <div className="space-y-6">
        {/* Auto Sync - NEW! */}
        <div className="border rounded-lg p-6 bg-white shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-xl font-semibold">Auto Sync</h3>
              <p className="text-gray-600 text-sm">Automatically detect and sync based on account type</p>
            </div>
            <button
              onClick={() => runSync('auto')}
              disabled={syncResults.auto.loading || !accountId}
              className="px-4 py-2 bg-teal-500 text-white rounded hover:bg-teal-600 disabled:bg-gray-400"
            >
              {syncResults.auto.loading ? 'Syncing...' : 'Auto Sync'}
            </button>
          </div>
          {syncResults.auto.error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded text-red-700">
              <strong>Error:</strong> {syncResults.auto.error}
            </div>
          )}
          {syncResults.auto.data && (
            <div className="p-4 bg-green-50 border border-green-200 rounded text-green-700">
              <strong>Success:</strong> {syncResults.auto.data.message}
              {syncResults.auto.data.accountType && (
                <div className="text-sm mt-1">
                  Account type: {syncResults.auto.data.accountType} • 
                  Synced services: {syncResults.auto.data.syncedServices}
                </div>
              )}
            </div>
          )}
        </div>
        {/* Email Sync */}
        <div className="border rounded-lg p-6 bg-white shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-xl font-semibold">Email Sync</h3>
              <p className="text-gray-600 text-sm">Sync Gmail threads and messages (gmail accounts only)</p>
            </div>
            <button
              onClick={() => runSync('email')}
              disabled={syncResults.email.loading || !accountId}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
            >
              {syncResults.email.loading ? 'Syncing...' : 'Sync Email'}
            </button>
          </div>
          {syncResults.email.error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded text-red-700">
              <strong>Error:</strong> {syncResults.email.error}
            </div>
          )}
          {syncResults.email.data && (
            <div className="p-4 bg-green-50 border border-green-200 rounded text-green-700">
              <strong>Success:</strong> {syncResults.email.data.message}
            </div>
          )}
        </div>

        {/* Calendar Sync */}
        <div className="border rounded-lg p-6 bg-white shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-xl font-semibold">Calendar Sync</h3>
              <p className="text-gray-600 text-sm">Sync Google Calendar events (google_calendar accounts only)</p>
            </div>
            <button
              onClick={() => runSync('calendar')}
              disabled={syncResults.calendar.loading || !accountId}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-400"
            >
              {syncResults.calendar.loading ? 'Syncing...' : 'Sync Calendar'}
            </button>
          </div>
          {syncResults.calendar.error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded text-red-700">
              <strong>Error:</strong> {syncResults.calendar.error}
            </div>
          )}
          {syncResults.calendar.data && (
            <div className="p-4 bg-green-50 border border-green-200 rounded text-green-700">
              <strong>Success:</strong> {syncResults.calendar.data.message}
            </div>
          )}
        </div>

        {/* Contacts Sync */}
        <div className="border rounded-lg p-6 bg-white shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-xl font-semibold">Contacts Sync</h3>
              <p className="text-gray-600 text-sm">Sync Google Contacts (google_contacts accounts only)</p>
            </div>
            <button
              onClick={() => runSync('contacts')}
              disabled={syncResults.contacts.loading || !accountId}
              className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:bg-gray-400"
            >
              {syncResults.contacts.loading ? 'Syncing...' : 'Sync Contacts'}
            </button>
          </div>
          {syncResults.contacts.error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded text-red-700">
              <strong>Error:</strong> {syncResults.contacts.error}
            </div>
          )}
          {syncResults.contacts.data && (
            <div className="p-4 bg-green-50 border border-green-200 rounded text-green-700">
              <strong>Success:</strong> {syncResults.contacts.data.message}
            </div>
          )}
        </div>

        {/* All Sync */}
        <div className="border rounded-lg p-6 bg-white shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-xl font-semibold">Sync All</h3>
              <p className="text-gray-600 text-sm">Run all sync operations</p>
            </div>
            <button
              onClick={() => runSync('all')}
              disabled={syncResults.all.loading || !accountId}
              className="px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600 disabled:bg-gray-400"
            >
              {syncResults.all.loading ? 'Syncing...' : 'Sync All'}
            </button>
          </div>
          {syncResults.all.error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded text-red-700">
              <strong>Error:</strong> {syncResults.all.error}
            </div>
          )}
          {syncResults.all.data && (
            <div className="p-4 bg-green-50 border border-green-200 rounded text-green-700">
              <strong>Success:</strong> {syncResults.all.data.message}
            </div>
          )}
        </div>
      </div>

      <div className="mt-12 p-6 bg-yellow-50 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">Instructions:</h2>
        <ol className="list-decimal list-inside space-y-1 text-sm">
          <li>Click on one of your connected accounts above to select it</li>
          <li>Or manually enter an account ID in the input field</li>
          <li>Click any of the sync buttons to test the sync functionality</li>
          <li>Use "Check Sync Status" to see the latest sync information</li>
        </ol>
        <p className="text-sm text-gray-600 mt-3">
          <strong>Note:</strong> If you don't see any accounts, you need to connect them via Pipedream first.
        </p>
        <p className="text-xs text-gray-500 mt-2">
          <strong>Supported account types:</strong> gmail, google_calendar, google_contacts
        </p>
      </div>
    </div>
  );
}