"use client";

import { useUser, useAuth, useSession, useClerk } from "@clerk/nextjs";
import { useState } from "react";

export default function ClientUserInfo() {
  const { user, isLoaded: userLoaded, isSignedIn } = useUser();
  const { userId, sessionId, getToken, isLoaded: authLoaded } = useAuth();
  const { session, isLoaded: sessionLoaded } = useSession();
  const clerk = useClerk();
  const [token, setToken] = useState<string | null>(null);

  const handleGetToken = async () => {
    try {
      const jwt = await getToken();
      setToken(jwt);
    } catch (error) {
      console.error("Error getting token:", error);
      setToken("Error getting token");
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <span className="text-green-500">💻</span> Client-Side Data
      </h2>
      
      <div className="space-y-4">
        <div className="p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold text-gray-700 mb-2">useUser() Hook</h3>
          <dl className="space-y-2">
            <div className="flex justify-between">
              <dt className="text-gray-600">Loaded:</dt>
              <dd>{userLoaded ? "✅ Yes" : "⏳ Loading..."}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600">Signed In:</dt>
              <dd>{isSignedIn ? "✅ Yes" : "❌ No"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600">User ID:</dt>
              <dd className="font-mono text-sm">{user?.id || "N/A"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600">Full Name:</dt>
              <dd>{user?.fullName || "Not set"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600">Primary Email:</dt>
              <dd className="text-sm">{user?.primaryEmailAddress?.emailAddress || "N/A"}</dd>
            </div>
          </dl>
        </div>

        <div className="p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold text-gray-700 mb-2">useAuth() Hook</h3>
          <dl className="space-y-2">
            <div className="flex justify-between">
              <dt className="text-gray-600">Loaded:</dt>
              <dd>{authLoaded ? "✅ Yes" : "⏳ Loading..."}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600">User ID:</dt>
              <dd className="font-mono text-sm">{userId || "N/A"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600">Session ID:</dt>
              <dd className="font-mono text-sm truncate max-w-[200px]">{sessionId || "N/A"}</dd>
            </div>
          </dl>
          <button
            onClick={handleGetToken}
            className="mt-3 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Get JWT Token
          </button>
          {token && (
            <div className="mt-3">
              <p className="text-sm text-gray-600 mb-1">JWT Token:</p>
              <textarea
                readOnly
                value={token}
                className="w-full text-xs p-2 bg-white border rounded font-mono"
                rows={4}
              />
            </div>
          )}
        </div>

        <div className="p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold text-gray-700 mb-2">useSession() Hook</h3>
          <dl className="space-y-2">
            <div className="flex justify-between">
              <dt className="text-gray-600">Loaded:</dt>
              <dd>{sessionLoaded ? "✅ Yes" : "⏳ Loading..."}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600">Session ID:</dt>
              <dd className="font-mono text-sm truncate max-w-[200px]">{session?.id || "N/A"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600">Status:</dt>
              <dd>{session?.status || "N/A"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600">Last Active:</dt>
              <dd className="text-sm">
                {session?.lastActiveAt ? new Date(session.lastActiveAt).toLocaleString() : "N/A"}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600">Expire At:</dt>
              <dd className="text-sm">
                {session?.expireAt ? new Date(session.expireAt).toLocaleString() : "N/A"}
              </dd>
            </div>
          </dl>
        </div>

        <div className="p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold text-gray-700 mb-2">useClerk() Hook</h3>
          <dl className="space-y-2">
            <div className="flex justify-between">
              <dt className="text-gray-600">Version:</dt>
              <dd>{clerk.version || "N/A"}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600">Loaded:</dt>
              <dd>{clerk.loaded ? "✅ Yes" : "⏳ Loading..."}</dd>
            </div>
          </dl>
          <div className="mt-3 space-y-2">
            <button
              onClick={() => clerk.openSignIn()}
              className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
            >
              Open Sign In Modal
            </button>
            <button
              onClick={() => clerk.openUserProfile()}
              className="ml-2 px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
            >
              Open User Profile
            </button>
          </div>
        </div>

        <details className="p-4 bg-gray-50 rounded-lg">
          <summary className="font-semibold text-gray-700 cursor-pointer">
            Raw Client User Data (Click to expand)
          </summary>
          <pre className="mt-4 text-xs overflow-auto p-4 bg-white rounded border">
{JSON.stringify(user, null, 2)}
          </pre>
        </details>

        <details className="p-4 bg-gray-50 rounded-lg">
          <summary className="font-semibold text-gray-700 cursor-pointer">
            Raw Session Data (Click to expand)
          </summary>
          <pre className="mt-4 text-xs overflow-auto p-4 bg-white rounded border">
{JSON.stringify(session, null, 2)}
          </pre>
        </details>
      </div>
    </div>
  );
}