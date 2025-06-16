import { currentUser, auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import ClientUserInfo from "./ClientUserInfo";

export default async function DevMePage() {
  const { userId } = await auth();
  
  if (!userId) {
    redirect("/");
  }

  const user = await currentUser();

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">
          🔒 Secret Developer Page - Clerk User Data
        </h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Server-side data */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <span className="text-blue-500">🖥️</span> Server-Side Data
            </h2>
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold text-gray-700 mb-2">Basic Info</h3>
                <dl className="space-y-2">
                  <div className="flex justify-between">
                    <dt className="text-gray-600">User ID:</dt>
                    <dd className="font-mono text-sm">{user?.id}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Username:</dt>
                    <dd>{user?.username || "Not set"}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-600">First Name:</dt>
                    <dd>{user?.firstName || "Not set"}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Last Name:</dt>
                    <dd>{user?.lastName || "Not set"}</dd>
                  </div>
                </dl>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold text-gray-700 mb-2">Contact Info</h3>
                <dl className="space-y-2">
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Primary Email:</dt>
                    <dd className="text-sm">{user?.primaryEmailAddress?.emailAddress}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Primary Phone:</dt>
                    <dd>{user?.primaryPhoneNumber?.phoneNumber || "Not set"}</dd>
                  </div>
                </dl>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold text-gray-700 mb-2">Account Details</h3>
                <dl className="space-y-2">
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Created:</dt>
                    <dd className="text-sm">{new Date(user?.createdAt || 0).toLocaleString()}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Updated:</dt>
                    <dd className="text-sm">{new Date(user?.updatedAt || 0).toLocaleString()}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Last Sign In:</dt>
                    <dd className="text-sm">{user?.lastSignInAt ? new Date(user.lastSignInAt).toLocaleString() : "Never"}</dd>
                  </div>
                </dl>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold text-gray-700 mb-2">Profile</h3>
                <dl className="space-y-2">
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Profile Image:</dt>
                    <dd>{user?.imageUrl ? <img src={user.imageUrl} alt="Profile" className="w-10 h-10 rounded-full" /> : "Not set"}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Two Factor Enabled:</dt>
                    <dd>{user?.twoFactorEnabled ? "✅ Yes" : "❌ No"}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-600">Password Enabled:</dt>
                    <dd>{user?.passwordEnabled ? "✅ Yes" : "❌ No"}</dd>
                  </div>
                </dl>
              </div>

              <details className="p-4 bg-gray-50 rounded-lg">
                <summary className="font-semibold text-gray-700 cursor-pointer">
                  Raw Server Data (Click to expand)
                </summary>
                <pre className="mt-4 text-xs overflow-auto p-4 bg-white rounded border">
{JSON.stringify(user, null, 2)}
                </pre>
              </details>
            </div>
          </div>

          {/* Client-side data */}
          <ClientUserInfo />
        </div>
      </div>
    </div>
  );
}