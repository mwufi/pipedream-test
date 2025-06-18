'use client';

import { useState, useEffect } from 'react';
import { SyncProgress, SyncHistory } from '@/components/SyncProgress';
import clientDb from '@/lib/instant_clientside_db';

interface ServiceResponse {
    result?: any;
    error?: string;
    status?: number;
}

interface ServiceCardProps {
    title: string;
    description: string;
    onCall: () => void;
    responseKey: string;
    children?: React.ReactNode;
    loading: Record<string, boolean>;
    responses: Record<string, ServiceResponse>;
}

interface Account {
    id: string;
    app: string;
    email?: string;
    healthy: boolean;
}

const ServiceCard = ({
    title,
    description,
    onCall,
    responseKey,
    children,
    loading,
    responses
}: ServiceCardProps) => {
    const isLoading = loading[responseKey];
    const response = responses[responseKey];

    return (
        <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">{title}</h3>
            <p className="text-gray-600 mb-4">{description}</p>

            {children}

            <button
                onClick={onCall}
                disabled={isLoading}
                className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white px-4 py-2 rounded-md font-medium transition-colors"
            >
                {isLoading ? 'Calling...' : 'Call Service'}
            </button>

            {response && (
                <div className="mt-4 p-4 bg-gray-50 rounded-md">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-medium text-gray-700">Response:</span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${response.status === 200 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                            {response.status || 'Error'}
                        </span>
                    </div>
                    <pre className="text-sm text-gray-800 bg-white p-2 rounded border overflow-auto">
                        {response.error || JSON.stringify(response.result, null, 2)}
                    </pre>
                </div>
            )}
        </div>
    );
};

export default function RestateDev() {
    const [responses, setResponses] = useState<Record<string, ServiceResponse>>({});
    const [loading, setLoading] = useState<Record<string, boolean>>({});
    const [greetMessage, setGreetMessage] = useState('');
    const [accountId, setAccountId] = useState('');
    const [externalUserId, setExternalUserId] = useState('test-user-123');
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [selectedGmailAccount, setSelectedGmailAccount] = useState('');
    const [selectedCalendarAccount, setSelectedCalendarAccount] = useState('');
    const [selectedContactsAccount, setSelectedContactsAccount] = useState('');

    const restateIngressUrl = process.env.NEXT_PUBLIC_RESTATE_INGRESS_URL || 'http://localhost:8080';

    // Fetch user accounts on component mount
    useEffect(() => {
        fetchUserAccounts();
    }, []);

    const fetchUserAccounts = async () => {
        try {
            const response = await fetch('/api/test-sync?test=accounts');
            const data = await response.json();
            if (data.accounts) {
                setAccounts(data.accounts);
                
                // Auto-select first account of each type
                const gmailAccount = data.accounts.find((acc: Account) => acc.app === 'Gmail');
                const calendarAccount = data.accounts.find((acc: Account) => acc.app === 'Google Calendar');
                const contactsAccount = data.accounts.find((acc: Account) => acc.app === 'Google Contacts');
                
                if (gmailAccount) setSelectedGmailAccount(gmailAccount.id);
                if (calendarAccount) setSelectedCalendarAccount(calendarAccount.id);
                if (contactsAccount) setSelectedContactsAccount(contactsAccount.id);
            }
        } catch (error) {
            console.error('Failed to fetch accounts:', error);
        }
    };

    const callService = async (serviceName: string, handler: string, data?: any) => {
        const key = `${serviceName}-${handler}`;
        setLoading(prev => ({ ...prev, [key]: true }));

        try {
            const url = `${restateIngressUrl}/${serviceName}/${handler}`;
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: data ? JSON.stringify(data) : undefined,
            });

            const result = await response.text();
            let parsedResult;
            try {
                parsedResult = JSON.parse(result);
            } catch {
                parsedResult = result;
            }

            setResponses(prev => ({
                ...prev,
                [key]: {
                    result: parsedResult,
                    status: response.status,
                }
            }));
        } catch (error) {
            setResponses(prev => ({
                ...prev,
                [key]: {
                    error: error instanceof Error ? error.message : 'Unknown error',
                    status: 0,
                }
            }));
        } finally {
            setLoading(prev => ({ ...prev, [key]: false }));
        }
    };

    const callVirtualObject = async (objectName: string, objectKey: string, handler: string, data?: any) => {
        const key = `${objectName}-${objectKey}-${handler}`;
        setLoading(prev => ({ ...prev, [key]: true }));

        try {
            const url = `${restateIngressUrl}/${objectName}/${objectKey}/${handler}`;
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: data ? JSON.stringify(data) : undefined,
            });

            const result = await response.text();
            let parsedResult;
            try {
                parsedResult = JSON.parse(result);
            } catch {
                parsedResult = result;
            }

            setResponses(prev => ({
                ...prev,
                [key]: {
                    result: parsedResult,
                    status: response.status,
                }
            }));
        } catch (error) {
            setResponses(prev => ({
                ...prev,
                [key]: {
                    error: error instanceof Error ? error.message : 'Unknown error',
                    status: 0,
                }
            }));
        } finally {
            setLoading(prev => ({ ...prev, [key]: false }));
        }
    };

    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-800 mb-2">Restate Service Tester</h1>
                <p className="text-gray-600 mb-4">
                    Test your Restate services directly from the browser.
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                    <p className="text-sm text-blue-800">
                        <strong>Ingress URL:</strong> <code className="bg-blue-100 px-2 py-1 rounded">{restateIngressUrl}</code>
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                        Set NEXT_PUBLIC_RESTATE_INGRESS_URL in your environment to change this.
                    </p>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <ServiceCard
                    title="Hello Echo"
                    description="Simple echo service that returns 'hello!'"
                    onCall={() => callService('hello', 'echo')}
                    responseKey="hello-echo"
                    loading={loading}
                    responses={responses}
                />

                <ServiceCard
                    title="Hello Greet"
                    description="Greet service that can return a custom greeting"
                    onCall={() => callService('hello', 'greet', greetMessage || undefined)}
                    responseKey="hello-greet"
                    loading={loading}
                    responses={responses}
                >
                    <div className="mb-4">
                        <label htmlFor="greetMessage" className="block text-sm font-medium text-gray-700 mb-2">
                            Custom Message (optional):
                        </label>
                        <input
                            id="greetMessage"
                            type="text"
                            value={greetMessage}
                            onChange={(e) => setGreetMessage(e.target.value)}
                            placeholder="Enter a name or message..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                </ServiceCard>

            </div>

            {/* Account Selection Section */}
            <div className="mt-8 bg-gray-50 rounded-lg p-6 mb-8">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Connected Accounts</h2>
                <div className="grid gap-4 md:grid-cols-3">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Gmail Account:
                        </label>
                        <select
                            value={selectedGmailAccount}
                            onChange={(e) => setSelectedGmailAccount(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Select Gmail account...</option>
                            {accounts
                                .filter(acc => acc.app === 'Gmail')
                                .map(acc => (
                                    <option key={acc.id} value={acc.id}>
                                        {acc.id} {acc.email ? `(${acc.email})` : ''}
                                    </option>
                                ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Calendar Account:
                        </label>
                        <select
                            value={selectedCalendarAccount}
                            onChange={(e) => setSelectedCalendarAccount(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Select Calendar account...</option>
                            {accounts
                                .filter(acc => acc.app === 'Google Calendar')
                                .map(acc => (
                                    <option key={acc.id} value={acc.id}>
                                        {acc.id} {acc.email ? `(${acc.email})` : ''}
                                    </option>
                                ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Contacts Account:
                        </label>
                        <select
                            value={selectedContactsAccount}
                            onChange={(e) => setSelectedContactsAccount(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Select Contacts account...</option>
                            {accounts
                                .filter(acc => acc.app === 'Google Contacts')
                                .map(acc => (
                                    <option key={acc.id} value={acc.id}>
                                        {acc.id} {acc.email ? `(${acc.email})` : ''}
                                    </option>
                                ))}
                        </select>
                    </div>
                </div>
                <button
                    onClick={fetchUserAccounts}
                    className="mt-4 text-sm text-blue-600 hover:text-blue-800"
                >
                    Refresh Accounts
                </button>
            </div>

            {/* Live Sync Progress */}
            <div className="mt-8">
                <SyncProgress userId={externalUserId} />
            </div>

            {/* Sync Services Section */}
            <div className="mt-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Sync Services</h2>
                <div className="grid gap-6 md:grid-cols-2">
                    <ServiceCard
                        title="Gmail Inbox Sync"
                        description="Sync Gmail messages with rate limiting"
                        onCall={() => {
                            if (!selectedGmailAccount) {
                                alert('Please select a Gmail account');
                                return;
                            }
                            callVirtualObject('inboxSync', selectedGmailAccount, 'startSync', { externalUserId });
                        }}
                        responseKey={`inboxSync-${selectedGmailAccount}-startSync`}
                        loading={loading}
                        responses={responses}
                    >
                        <div className="mb-4">
                            <p className="text-sm text-gray-600">
                                Account: <code className="bg-gray-100 px-2 py-1 rounded">{selectedGmailAccount || 'Not selected'}</code>
                            </p>
                        </div>
                    </ServiceCard>

                    <ServiceCard
                        title="Gmail Sync Status"
                        description="Get the current sync status"
                        onCall={() => {
                            if (!selectedGmailAccount) {
                                alert('Please select a Gmail account');
                                return;
                            }
                            callVirtualObject('inboxSync', selectedGmailAccount, 'getSyncStatus');
                        }}
                        responseKey={`inboxSync-${selectedGmailAccount}-getSyncStatus`}
                        loading={loading}
                        responses={responses}
                    >
                        <div className="mb-4">
                            <p className="text-sm text-gray-600">Shows sync progress and last sync time</p>
                        </div>
                    </ServiceCard>

                    <ServiceCard
                        title="Calendar Sync"
                        description="Sync Google Calendar events"
                        onCall={() => {
                            if (!selectedCalendarAccount) {
                                alert('Please select a Calendar account');
                                return;
                            }
                            callVirtualObject('calendarSync', selectedCalendarAccount, 'startSync', { externalUserId });
                        }}
                        responseKey={`calendarSync-${selectedCalendarAccount}-startSync`}
                        loading={loading}
                        responses={responses}
                    >
                        <div className="mb-4">
                            <p className="text-sm text-gray-600">
                                Account: <code className="bg-gray-100 px-2 py-1 rounded">{selectedCalendarAccount || 'Not selected'}</code>
                            </p>
                        </div>
                    </ServiceCard>

                    <ServiceCard
                        title="Calendar Sync Status"
                        description="Get calendar sync status"
                        onCall={() => {
                            if (!selectedCalendarAccount) {
                                alert('Please select a Calendar account');
                                return;
                            }
                            callVirtualObject('calendarSync', selectedCalendarAccount, 'getSyncStatus');
                        }}
                        responseKey={`calendarSync-${selectedCalendarAccount}-getSyncStatus`}
                        loading={loading}
                        responses={responses}
                    >
                        <div className="mb-4">
                            <p className="text-sm text-gray-600">Shows event count and primary calendar</p>
                        </div>
                    </ServiceCard>

                    <ServiceCard
                        title="Contacts Sync"
                        description="Sync Google Contacts"
                        onCall={() => {
                            if (!selectedContactsAccount) {
                                alert('Please select a Contacts account');
                                return;
                            }
                            callVirtualObject('contactsSync', selectedContactsAccount, 'startSync', { externalUserId });
                        }}
                        responseKey={`contactsSync-${selectedContactsAccount}-startSync`}
                        loading={loading}
                        responses={responses}
                    >
                        <div className="mb-4">
                            <p className="text-sm text-gray-600">
                                Account: <code className="bg-gray-100 px-2 py-1 rounded">{selectedContactsAccount || 'Not selected'}</code>
                            </p>
                        </div>
                    </ServiceCard>

                    <ServiceCard
                        title="Contacts Sync Status"
                        description="Get contacts sync status"
                        onCall={() => {
                            if (!selectedContactsAccount) {
                                alert('Please select a Contacts account');
                                return;
                            }
                            callVirtualObject('contactsSync', selectedContactsAccount, 'getSyncStatus');
                        }}
                        responseKey={`contactsSync-${selectedContactsAccount}-getSyncStatus`}
                        loading={loading}
                        responses={responses}
                    >
                        <div className="mb-4">
                            <p className="text-sm text-gray-600">Shows total contacts synced</p>
                        </div>
                    </ServiceCard>
                </div>
            </div>

            <div className="mt-8 bg-gray-50 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Available Services</h2>
                <div className="grid gap-4 md:grid-cols-2">
                    <div>
                        <h3 className="font-medium text-gray-700 mb-2">Basic Services</h3>
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                                <code className="text-sm bg-white px-2 py-1 rounded border">hello/echo</code>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                                <code className="text-sm bg-white px-2 py-1 rounded border">hello/greet</code>
                            </div>
                        </div>
                    </div>
                    <div>
                        <h3 className="font-medium text-gray-700 mb-2">Sync Services (Virtual Objects)</h3>
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                                <code className="text-sm bg-white px-2 py-1 rounded border">inboxSync/{accountId}</code>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 bg-purple-400 rounded-full"></span>
                                <code className="text-sm bg-white px-2 py-1 rounded border">calendarSync/{accountId}</code>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 bg-orange-400 rounded-full"></span>
                                <code className="text-sm bg-white px-2 py-1 rounded border">contactsSync/{accountId}</code>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 bg-red-400 rounded-full"></span>
                                <code className="text-sm bg-white px-2 py-1 rounded border">api/fetch</code>
                                <span className="text-xs text-gray-500">(rate-limited API calls)</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="mt-4 text-sm text-gray-600">
                    <p className="mb-2"><strong>Note:</strong> Virtual objects use the account ID as their key, allowing per-account state management.</p>
                    <p>The rate limiter ensures API calls respect Google's quotas across all services.</p>
                </div>
            </div>

            {/* Sync History */}
            <SyncHistory userId={externalUserId} limit={10} />
        </div>
    );
} 