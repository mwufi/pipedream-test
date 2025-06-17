"use client";

import { useState, useEffect } from 'react';
import { updateOnboardingStep, addConnectedAccount } from '@/lib/onboarding/client';
import { createFrontendClient } from '@pipedream/sdk/browser';
import type { OnboardingState, ConnectedAccount } from '@/lib/onboarding/types';

interface AccountType {
  id: string;
  name: string;
  icon: string;
  provider: 'gmail' | 'google_calendar' | 'google_contacts' | 'outlook';
  available: boolean;
}

const ACCOUNT_TYPES: AccountType[] = [
  {
    id: 'gmail',
    name: 'Gmail',
    icon: '📧',
    provider: 'gmail',
    available: true
  },
  {
    id: 'calendar',
    name: 'Google Calendar',
    icon: '📅',
    provider: 'google_calendar',
    available: true
  },
  {
    id: 'contacts',
    name: 'Google Contacts',
    icon: '👥',
    provider: 'google_contacts',
    available: true
  },
  {
    id: 'outlook',
    name: 'Outlook',
    icon: '📨',
    provider: 'outlook',
    available: false
  }
];

interface StepConnectProps {
  onComplete: (data: any) => void;
  profileId: string;
  userId: string;
  currentOnboarding: OnboardingState;
  currentAccounts: ConnectedAccount[];
}

export default function StepConnect({ onComplete, profileId, userId, currentOnboarding, currentAccounts }: StepConnectProps) {
  const [animateIn, setAnimateIn] = useState(false);
  const [connectedAccounts, setConnectedAccounts] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState<string | null>(null);
  const [checkingAccounts, setCheckingAccounts] = useState(true);

  // Trigger animation on mount
  useState(() => {
    setTimeout(() => setAnimateIn(true), 100);
  });

  // Check existing connections
  useEffect(() => {
    checkConnections();
  }, []);

  const checkConnections = async () => {
    try {
      const response = await fetch('/api/pipedream/accounts');
      if (!response.ok) {
        throw new Error('Failed to fetch accounts');
      }
      const data = await response.json();
      const accounts = Array.isArray(data) ? data : data.data || [];
      
      const connected = new Set<string>();
      accounts.forEach((account: any) => {
        if (account.healthy && !account.dead) {
          const accountType = ACCOUNT_TYPES.find(t => t.provider === account.app.name_slug);
          if (accountType) {
            connected.add(accountType.id);
          }
        }
      });
      
      setConnectedAccounts(connected);
    } catch (error) {
      console.error('Error checking connections:', error);
    } finally {
      setCheckingAccounts(false);
    }
  };

  const handleConnect = async (accountType: AccountType) => {
    setLoading(accountType.id);
    
    try {
      // Get connect token from API
      const tokenResponse = await fetch('/api/pipedream/tokens', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          allowed_origins: [window.location.origin],
        }),
      });

      if (!tokenResponse.ok) {
        throw new Error('Failed to get connect token');
      }

      const { token } = await tokenResponse.json();

      // Create frontend client and connect
      const pd = createFrontendClient();

      pd.connectAccount({
        app: accountType.provider,
        token: token,
        onSuccess: async (account: any) => {
          console.log(`Successfully connected to ${accountType.name}:`, account);
          // Refresh accounts list
          await checkConnections();
          setLoading(null);
        },
        onError: (err: any) => {
          console.error(`Connection error:`, err);
          alert(`Failed to connect to ${accountType.name}: ${err.message || 'Unknown error'}`);
          setLoading(null);
        },
      });
    } catch (error) {
      console.error('Connection error:', error);
      alert('Failed to connect account. Please try again.');
      setLoading(null);
    }
  };

  const handleContinue = async () => {
    // Update connected accounts in profile
    const connectedAccountData: ConnectedAccount[] = Array.from(connectedAccounts).map(accountId => {
      const accountType = ACCOUNT_TYPES.find(t => t.id === accountId);
      return {
        provider: accountType!.provider,
        accountId,
        connectedAt: Date.now()
      };
    });

    // Add each connected account
    for (const account of connectedAccountData) {
      await addConnectedAccount(profileId, currentAccounts, account);
    }

    await updateOnboardingStep(
      profileId, 
      currentOnboarding,
      'connect', 
      { accountsConnected: connectedAccounts.size }, 
      true
    );
    onComplete({ accountsConnected: connectedAccounts.size });
  };

  return (
    <div className="space-y-8">
      {/* Title */}
      <div className={`text-center space-y-4 transition-all duration-1000 ${
        animateIn ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}>
        <h2 className="text-4xl font-bold">Let's connect your digital life</h2>
        <p className="text-gray-400">
          Connect your accounts so I can help manage your relationships
        </p>
      </div>

      {/* Account Cards */}
      <div className="grid gap-4">
        {ACCOUNT_TYPES.map((account, index) => {
          const isConnected = connectedAccounts.has(account.id);
          const isConnecting = loading === account.id;
          
          return (
            <div
              key={account.id}
              className={`relative p-6 rounded-2xl border transition-all duration-500 ${
                animateIn ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              } ${
                isConnected
                  ? 'border-green-500 bg-green-500/10'
                  : account.available
                  ? 'border-white/10 bg-white/5 hover:bg-white/10'
                  : 'border-white/5 bg-white/2 opacity-50'
              }`}
              style={{ transitionDelay: `${index * 100 + 200}ms` }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="text-3xl">{account.icon}</div>
                  <div>
                    <h3 className="text-lg font-semibold">{account.name}</h3>
                    {!account.available && (
                      <p className="text-sm text-gray-500">Coming soon</p>
                    )}
                  </div>
                </div>
                
                {account.available && (
                  <button
                    onClick={() => handleConnect(account)}
                    disabled={isConnected || isConnecting || checkingAccounts || loading !== null}
                    className={`px-6 py-2 rounded-full font-medium transition-all ${
                      isConnected
                        ? 'bg-green-500 text-white'
                        : isConnecting
                        ? 'bg-gray-700 text-gray-400'
                        : 'bg-white/10 text-white hover:bg-white/20'
                    }`}
                  >
                    {checkingAccounts ? (
                      <span className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                        Checking...
                      </span>
                    ) : isConnected ? (
                      <span className="flex items-center gap-2">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/>
                        </svg>
                        Connected
                      </span>
                    ) : isConnecting ? (
                      <span className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Connecting...
                      </span>
                    ) : (
                      'Connect'
                    )}
                  </button>
                )}
              </div>
              
              {/* Glow effect when connected */}
              {isConnected && (
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-green-500/20 to-emerald-500/20 blur-xl -z-10 animate-pulse" />
              )}
            </div>
          );
        })}
      </div>

      {/* Info Box */}
      <div className={`p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl transition-all duration-1000 ${
        animateIn ? 'opacity-100' : 'opacity-0'
      }`} style={{ transitionDelay: '600ms' }}>
        <p className="text-sm text-blue-300">
          💡 Connect at least one account to get started. You can always add more later.
        </p>
      </div>

      {/* CTA Button */}
      <div className={`flex justify-center transition-all duration-1000 ${
        animateIn ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`} style={{ transitionDelay: '800ms' }}>
        <button
          onClick={handleContinue}
          disabled={connectedAccounts.size === 0}
          className={`px-8 py-4 rounded-full font-semibold transition-all ${
            connectedAccounts.size > 0
              ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/25'
              : 'bg-gray-800 text-gray-500 cursor-not-allowed'
          }`}
        >
          {connectedAccounts.size > 0 ? 'Continue to Neo' : 'Connect at least one account'}
        </button>
      </div>
    </div>
  );
}