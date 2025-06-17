"use client";

import { useState } from 'react';
import { useUser } from '@clerk/nextjs';

type TestType = 'accounts' | 'gmail-threads' | 'gmail-messages' | 'contacts' | 'calendar' | 'error-handling';

interface TestResult {
  loading: boolean;
  data: any;
  error: string | null;
}

export default function TestSyncPage() {
  const { user, isLoaded } = useUser();
  const [results, setResults] = useState<Record<TestType, TestResult>>({
    accounts: { loading: false, data: null, error: null },
    'gmail-threads': { loading: false, data: null, error: null },
    'gmail-messages': { loading: false, data: null, error: null },
    contacts: { loading: false, data: null, error: null },
    calendar: { loading: false, data: null, error: null },
    'error-handling': { loading: false, data: null, error: null },
  });

  const runTest = async (testType: TestType) => {
    setResults(prev => ({
      ...prev,
      [testType]: { loading: true, data: null, error: null }
    }));

    try {
      const response = await fetch(`/api/test-sync?test=${testType}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Test failed');
      }

      setResults(prev => ({
        ...prev,
        [testType]: { loading: false, data, error: null }
      }));
    } catch (error: any) {
      setResults(prev => ({
        ...prev,
        [testType]: { loading: false, data: null, error: error.message }
      }));
    }
  };

  const runAllTests = async () => {
    const tests: TestType[] = ['accounts', 'gmail-threads', 'gmail-messages', 'contacts', 'calendar', 'error-handling'];
    for (const test of tests) {
      await runTest(test);
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  };

  if (!isLoaded) {
    return <div className="p-8">Loading...</div>;
  }

  if (!user) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Sync Helpers Test Page</h1>
        <p className="text-red-600">Please sign in to test the sync helpers.</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">Sync Helpers Test Page</h1>
      <p className="text-gray-600 mb-8">
        Test the @repo/sync-helpers package with your connected Pipedream accounts.
      </p>

      <div className="mb-6">
        <button
          onClick={runAllTests}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Run All Tests
        </button>
      </div>

      <div className="space-y-6">
        {/* Test: Get Accounts */}
        <TestCard
          title="Get User Accounts"
          description="List all connected Pipedream accounts"
          testType="accounts"
          result={results.accounts}
          onRun={() => runTest('accounts')}
        />

        {/* Test: Gmail Threads */}
        <TestCard
          title="Gmail Threads"
          description="List Gmail threads (requires Gmail account)"
          testType="gmail-threads"
          result={results['gmail-threads']}
          onRun={() => runTest('gmail-threads')}
        />

        {/* Test: Gmail Messages */}
        <TestCard
          title="Gmail Messages"
          description="List Gmail messages with details (requires Gmail account)"
          testType="gmail-messages"
          result={results['gmail-messages']}
          onRun={() => runTest('gmail-messages')}
        />

        {/* Test: Contacts */}
        <TestCard
          title="Google Contacts"
          description="List contacts (requires Google Contacts account)"
          testType="contacts"
          result={results.contacts}
          onRun={() => runTest('contacts')}
        />

        {/* Test: Calendar */}
        <TestCard
          title="Google Calendar"
          description="List calendars and events (requires Google Calendar account)"
          testType="calendar"
          result={results.calendar}
          onRun={() => runTest('calendar')}
        />

        {/* Test: Error Handling */}
        <TestCard
          title="Error Handling"
          description="Test error handling with invalid account"
          testType="error-handling"
          result={results['error-handling']}
          onRun={() => runTest('error-handling')}
        />
      </div>

      <div className="mt-12 p-6 bg-gray-100 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Setup Instructions</h2>
        <ol className="list-decimal list-inside space-y-2 text-gray-700">
          <li>Make sure you have set up your Pipedream environment variables in .env.local</li>
          <li>Connect accounts via Pipedream Connect (Gmail, Google Contacts, Google Calendar)</li>
          <li>Run the tests above to verify the integration works</li>
        </ol>
        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
          <p className="text-sm">
            <strong>Note:</strong> If you haven't connected any accounts yet, you'll need to use the Pipedream Connect API to create connection links for your users.
          </p>
        </div>
      </div>
    </div>
  );
}

function TestCard({ 
  title, 
  description, 
  testType, 
  result, 
  onRun 
}: { 
  title: string;
  description: string;
  testType: TestType;
  result: TestResult;
  onRun: () => void;
}) {
  return (
    <div className="border rounded-lg p-6 bg-white shadow-sm">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-semibold">{title}</h3>
          <p className="text-gray-600 text-sm">{description}</p>
        </div>
        <button
          onClick={onRun}
          disabled={result.loading}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-400"
        >
          {result.loading ? 'Running...' : 'Run Test'}
        </button>
      </div>

      {result.error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded text-red-700">
          <strong>Error:</strong> {result.error}
        </div>
      )}

      {result.data && (
        <div className="p-4 bg-gray-50 rounded">
          <pre className="text-xs overflow-auto">
            {JSON.stringify(result.data, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}