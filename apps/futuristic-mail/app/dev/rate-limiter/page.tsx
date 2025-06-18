'use client';

import { useState, useEffect } from 'react';

interface RateLimiterState {
    limit: number;
    burst: number;
    tokens: number;
    last: number;
    lastEvent: number;
}

interface RateLimiterKey {
    key: string;
    name: string;
    description: string;
    defaultRate: number;
    color: string;
}

// Define important rate limiter keys
const RATE_LIMITER_KEYS: RateLimiterKey[] = [
    {
        key: 'gmail-api',
        name: 'Gmail API',
        description: 'Rate limit for Gmail API calls (messages, threads)',
        defaultRate: 60,
        color: 'blue'
    },
    {
        key: 'google-calendar-api',
        name: 'Google Calendar API',
        description: 'Rate limit for Calendar API calls',
        defaultRate: 60,
        color: 'purple'
    },
    {
        key: 'google-contacts-api',
        name: 'Google Contacts API',
        description: 'Rate limit for Contacts API calls',
        defaultRate: 30,
        color: 'orange'
    }
];

export default function RateLimiterMonitor() {
    const [states, setStates] = useState<Record<string, RateLimiterState>>({});
    const [loading, setLoading] = useState<Record<string, boolean>>({});
    const [newRates, setNewRates] = useState<Record<string, number>>({});
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const restateIngressUrl = process.env.NEXT_PUBLIC_RESTATE_INGRESS_URL || 'http://localhost:8080';

    // Fetch state for all rate limiters on mount
    useEffect(() => {
        RATE_LIMITER_KEYS.forEach(limiter => {
            fetchLimiterState(limiter.key);
        });
    }, []);

    const fetchLimiterState = async (key: string) => {
        setLoading(prev => ({ ...prev, [key]: true }));
        try {
            const response = await fetch(`${restateIngressUrl}/limiter/${key}/state`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });

            if (response.ok) {
                const state = await response.json();
                setStates(prev => ({ ...prev, [key]: state }));
                // Initialize new rate input with current limit
                if (state.limit) {
                    setNewRates(prev => ({ ...prev, [key]: state.limit }));
                }
            } else {
                console.error(`Failed to fetch state for ${key}`);
            }
        } catch (err) {
            console.error(`Error fetching state for ${key}:`, err);
        } finally {
            setLoading(prev => ({ ...prev, [key]: false }));
        }
    };

    const updateRate = async (key: string) => {
        const newRate = newRates[key];
        if (!newRate || newRate <= 0) {
            setError('Rate must be greater than 0');
            return;
        }

        setLoading(prev => ({ ...prev, [key]: true }));
        setError(null);
        setSuccess(null);

        try {
            const response = await fetch(`${restateIngressUrl}/limiter/${key}/setRate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    newLimit: newRate,
                    newBurst: newRate  // Set burst equal to limit for simplicity
                })
            });

            if (response.ok) {
                setSuccess(`Rate updated successfully for ${key}`);
                // Refresh state
                await fetchLimiterState(key);
            } else {
                setError(`Failed to update rate for ${key}`);
            }
        } catch (err) {
            setError(`Error updating rate: ${err}`);
        } finally {
            setLoading(prev => ({ ...prev, [key]: false }));
        }
    };

    const getTokenPercentage = (state: RateLimiterState) => {
        if (!state.burst || state.burst === 0) return 0;
        return Math.round((state.tokens / state.burst) * 100);
    };

    const getTokenColor = (percentage: number) => {
        if (percentage > 75) return 'green';
        if (percentage > 25) return 'yellow';
        return 'red';
    };

    return (
        <div className="container mx-auto px-4 py-8 max-w-6xl">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-800 mb-2">Rate Limiter Monitor</h1>
                <p className="text-gray-600">
                    Monitor and adjust rate limits for API services in real-time.
                </p>
            </div>

            {/* Alerts */}
            {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-red-800">{error}</p>
                </div>
            )}
            {success && (
                <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md">
                    <p className="text-green-800">{success}</p>
                </div>
            )}

            {/* Rate Limiter Cards */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {RATE_LIMITER_KEYS.map(limiter => {
                    const state = states[limiter.key];
                    const isLoading = loading[limiter.key];
                    const percentage = state ? getTokenPercentage(state) : 0;
                    const tokenColor = getTokenColor(percentage);

                    return (
                        <div key={limiter.key} className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold text-gray-800">{limiter.name}</h3>
                                <span className={`w-3 h-3 rounded-full bg-${limiter.color}-400`}></span>
                            </div>

                            <p className="text-sm text-gray-600 mb-4">{limiter.description}</p>

                            {state ? (
                                <>
                                    {/* Token Usage Bar */}
                                    <div className="mb-4">
                                        <div className="flex justify-between text-sm mb-2">
                                            <span>Available Tokens</span>
                                            <span className="font-medium">{state.tokens} / {state.burst}</span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                                            <div
                                                className={`h-full transition-all duration-300 bg-${tokenColor}-500`}
                                                style={{ width: `${percentage}%` }}
                                            />
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">
                                            {percentage}% available
                                        </p>
                                    </div>

                                    {/* Last Refill Time */}
                                    <div className="mb-4 text-sm">
                                        <span className="text-gray-600">Last refill: </span>
                                        <span className="font-medium">
                                            {state.last > 0 ? new Date(state.last).toLocaleTimeString() : 'Never'}
                                        </span>
                                    </div>

                                    {/* Rate Adjustment */}
                                    <div className="space-y-3">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Tokens per minute:
                                            </label>
                                            <div className="flex gap-2">
                                                <input
                                                    type="number"
                                                    value={newRates[limiter.key] || state.limit}
                                                    onChange={(e) => setNewRates(prev => ({
                                                        ...prev,
                                                        [limiter.key]: parseInt(e.target.value) || 0
                                                    }))}
                                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    min="1"
                                                    max="1000"
                                                />
                                                <button
                                                    onClick={() => updateRate(limiter.key)}
                                                    disabled={isLoading || newRates[limiter.key] === state.limit}
                                                    className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white rounded-md font-medium transition-colors"
                                                >
                                                    {isLoading ? 'Updating...' : 'Update'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Rate Info */}
                                    <div className="mt-4 pt-4 border-t border-gray-200 text-xs text-gray-600">
                                        <p>Rate: {state.limit} tokens/minute</p>
                                        <p>Burst: {state.burst} tokens max</p>
                                    </div>
                                </>
                            ) : (
                                <div className="py-8 text-center">
                                    {isLoading ? (
                                        <p className="text-gray-500">Loading...</p>
                                    ) : (
                                        <div>
                                            <p className="text-gray-500 mb-2">No data available</p>
                                            <button
                                                onClick={() => fetchLimiterState(limiter.key)}
                                                className="text-sm text-blue-600 hover:text-blue-800"
                                            >
                                                Retry
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Refresh All Button */}
            <div className="mt-8 text-center">
                <button
                    onClick={() => {
                        RATE_LIMITER_KEYS.forEach(limiter => {
                            fetchLimiterState(limiter.key);
                        });
                    }}
                    className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-md font-medium transition-colors"
                >
                    Refresh All States
                </button>
            </div>

            {/* Info Section */}
            <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h2 className="text-lg font-semibold text-blue-900 mb-3">Rate Limiter Information</h2>
                <ul className="space-y-2 text-sm text-blue-800">
                    <li>• Rate limiters automatically refill tokens at the configured rate per minute</li>
                    <li>• When tokens are exhausted, API calls will wait until tokens become available</li>
                    <li>• Reservations show pending token allocations that haven't been consumed yet</li>
                    <li>• Changes to rates take effect immediately for new token refills</li>
                </ul>
            </div>
        </div>
    );
}