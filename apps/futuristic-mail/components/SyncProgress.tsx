'use client';

import db from '@/lib/instant_clientside_db';

interface SyncProgressProps {
  userId: string;
}

export function SyncProgress({ userId }: SyncProgressProps) {
  const { data, isLoading } = db.useQuery({
    syncJobs: {
      $: {
        where: {
          userId,
          status: { $in: ["pending", "running"] }
        },
        order: { startedAt: "desc" }
      }
    }
  });

  const activeSyncs = data?.syncJobs || [];

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-20 bg-gray-200 rounded-lg"></div>
      </div>
    );
  }

  if (activeSyncs.length === 0) return null;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-800">Active Syncs</h3>
      {activeSyncs.map((sync: any) => (
        <div key={sync.id} className="bg-white rounded-lg shadow p-4 border border-gray-200">
          <div className="flex justify-between items-center mb-2">
            <h4 className="font-medium flex items-center gap-2">
              {sync.type === 'gmail' && '📧 Gmail Sync'}
              {sync.type === 'calendar' && '📅 Calendar Sync'}
              {sync.type === 'contacts' && '👤 Contacts Sync'}
              <span className={`text-xs px-2 py-1 rounded ${
                sync.status === 'running' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
              }`}>
                {sync.status}
              </span>
            </h4>
            <span className="text-sm text-gray-500">
              {sync.progress?.currentStep || 'Initializing...'}
            </span>
          </div>
          
          {/* Progress bar */}
          <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${sync.progress?.percentComplete || 0}%` }}
            />
          </div>
          
          <div className="flex justify-between text-sm text-gray-600">
            <span>
              {sync.progress?.current || 0} / {sync.progress?.total || '?'} items
            </span>
            <span>{sync.progress?.percentComplete || 0}%</span>
          </div>
          
          {/* Duration */}
          <div className="text-xs text-gray-500 mt-2">
            Started {new Date(sync.startedAt).toLocaleTimeString()}
          </div>
        </div>
      ))}
    </div>
  );
}

export function SyncHistory({ userId, limit = 5 }: { userId: string; limit?: number }) {
  const { data, isLoading } = db.useQuery({
    syncJobs: {
      $: {
        where: {
          userId,
          status: { $in: ["completed", "failed", "cancelled"] }
        },
        order: { completedAt: "desc" },
        limit
      }
    }
  });

  const completedSyncs = data?.syncJobs || [];

  if (isLoading || completedSyncs.length === 0) return null;

  return (
    <div className="mt-8">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Sync History</h3>
      <div className="space-y-2">
        {completedSyncs.map(sync => (
          <div key={sync.id} className="bg-gray-50 rounded-lg p-3 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <span className="text-2xl">
                {sync.type === 'gmail' && '📧'}
                {sync.type === 'calendar' && '📅'}
                {sync.type === 'contacts' && '👤'}
              </span>
              <div>
                <p className="font-medium text-sm">
                  {sync.type === 'gmail' && `${sync.stats?.messagesProcessed || 0} messages`}
                  {sync.type === 'calendar' && `${sync.stats?.eventsProcessed || 0} events`}
                  {sync.type === 'contacts' && `${sync.stats?.contactsProcessed || 0} contacts`}
                </p>
                <p className="text-xs text-gray-500">
                  {new Date(sync.completedAt!).toLocaleDateString()} at {new Date(sync.completedAt!).toLocaleTimeString()}
                </p>
              </div>
            </div>
            <span className={`text-xs px-2 py-1 rounded ${
              sync.status === 'completed' ? 'bg-green-100 text-green-700' :
              sync.status === 'failed' ? 'bg-red-100 text-red-700' :
              'bg-gray-100 text-gray-700'
            }`}>
              {sync.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}