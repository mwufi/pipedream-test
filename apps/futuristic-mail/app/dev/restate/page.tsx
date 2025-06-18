'use client';

import { useState } from 'react';

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

    const restateIngressUrl = process.env.NEXT_PUBLIC_RESTATE_INGRESS_URL || 'http://localhost:8080';

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

                <ServiceCard
                    title="Inbox Sync"
                    description="Sync Gmail inbox messages using virtual object pattern"
                    onCall={() => {
                        if (!accountId) {
                            alert('Please enter an Account ID');
                            return;
                        }
                        callVirtualObject('inboxSync', accountId, 'syncInbox', { externalUserId });
                    }}
                    responseKey={`inboxSync-${accountId}-syncInbox`}
                    loading={loading}
                    responses={responses}
                >
                    <div className="mb-4 space-y-3">
                        <div>
                            <label htmlFor="accountId" className="block text-sm font-medium text-gray-700 mb-2">
                                Account ID (required):
                            </label>
                            <input
                                id="accountId"
                                type="text"
                                value={accountId}
                                onChange={(e) => setAccountId(e.target.value)}
                                placeholder="Enter Gmail account ID..."
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            <p className="text-xs text-gray-500 mt-1">Get this from the test-sync page</p>
                        </div>
                        <div>
                            <label htmlFor="externalUserId" className="block text-sm font-medium text-gray-700 mb-2">
                                External User ID:
                            </label>
                            <input
                                id="externalUserId"
                                type="text"
                                value={externalUserId}
                                onChange={(e) => setExternalUserId(e.target.value)}
                                placeholder="Enter user ID..."
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                    </div>
                </ServiceCard>

                <ServiceCard
                    title="Inbox Sync Status"
                    description="Get the current sync status for an inbox"
                    onCall={() => {
                        if (!accountId) {
                            alert('Please enter an Account ID');
                            return;
                        }
                        callVirtualObject('inboxSync', accountId, 'getSyncStatus');
                    }}
                    responseKey={`inboxSync-${accountId}-getSyncStatus`}
                    loading={loading}
                    responses={responses}
                >
                    <div className="mb-4">
                        <p className="text-sm text-gray-600">Uses the same Account ID as above</p>
                    </div>
                </ServiceCard>
            </div>

            <div className="mt-8 bg-gray-50 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Available Services</h2>
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                        <code className="text-sm bg-white px-2 py-1 rounded border">hello/echo</code>
                        <span className="text-sm text-gray-600">- Returns "hello!"</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                        <code className="text-sm bg-white px-2 py-1 rounded border">hello/greet</code>
                        <span className="text-sm text-gray-600">- Returns personalized greeting</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                        <code className="text-sm bg-white px-2 py-1 rounded border">inboxSync/{accountId}/syncInbox</code>
                        <span className="text-sm text-gray-600">- Sync Gmail inbox (virtual object)</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                        <code className="text-sm bg-white px-2 py-1 rounded border">inboxSync/{accountId}/getSyncStatus</code>
                        <span className="text-sm text-gray-600">- Get sync status (virtual object)</span>
                    </div>
                </div>
            </div>
        </div>
    );
} 