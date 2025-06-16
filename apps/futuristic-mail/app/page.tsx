import Image from "next/image";
import SvgGrid from "@/components/SvgGrid";
import { SignedIn, SignedOut } from "@clerk/nextjs";
import { currentUser } from "@clerk/nextjs/server";

export default async function Home() {
  const user = await currentUser();
  return (
    <div className="relative flex min-h-screen flex-col items-center overflow-hidden bg-gray-100 px-4 py-6">
      {/* Faint blue background glow */}
      <Image
        src="/glow@q25r.c93b1d41.avif"
        alt=""
        width={1800}
        height={1800}
        className="pointer-events-none absolute left-1/2 top-1/2 z-10 h-[150vh] max-w-none -translate-x-1/2 -translate-y-1/2 select-none mix-blend-overlay"
        style={{ color: 'transparent' }}
      />

      {/* Main container with constrained width */}
      <div className="relative flex w-full max-w-[25rem] flex-1 flex-col justify-center gap-y-6">
        <main className="relative grid flex-1 content-center">
          <div className="relative min-h-[calc(545/16*1rem)]">
            <div className="relative z-20 [--animation-duration:250ms] [&>div]:animate-fade-in">
              {/* Main content area */}
              <div className="flex flex-col items-center justify-center text-center">
                <SignedOut>
                  <h1 className="text-4xl font-bold text-gray-800 mb-4">
                    Futuristic Mail
                  </h1>
                  <p className="text-gray-600 max-w-md mb-8">
                    Experience the next generation of email. Sign in to get started with your intelligent inbox.
                  </p>
                  <div className="flex flex-col gap-4 w-full max-w-sm">
                    <div className="p-8 bg-white/50 backdrop-blur-sm rounded-2xl border border-gray-200">
                      <h2 className="text-2xl font-semibold mb-2">Welcome</h2>
                      <p className="text-gray-600 mb-6">
                        Sign in to access your futuristic email experience
                      </p>
                      <p className="text-sm text-gray-500">
                        Use the buttons in the header to sign in or create an account
                      </p>
                    </div>
                  </div>
                </SignedOut>
                
                <SignedIn>
                  <h1 className="text-4xl font-bold text-gray-800 mb-4">
                    Welcome back{user?.firstName ? `, ${user.firstName}` : ""}!
                  </h1>
                  <p className="text-gray-600 max-w-md mb-8">
                    Your intelligent inbox is ready. Let's revolutionize how you manage email.
                  </p>
                  <div className="grid grid-cols-1 gap-4 w-full max-w-sm">
                    <a href="/inbox" className="p-6 bg-white/50 backdrop-blur-sm rounded-2xl border border-gray-200 hover:bg-white/70 transition-colors group">
                      <h3 className="text-xl font-semibold mb-2 group-hover:text-blue-600 transition-colors">
                        📧 Smart Inbox
                      </h3>
                      <p className="text-gray-600 text-sm">
                        AI-powered email management
                      </p>
                    </a>
                    <a href="/compose" className="p-6 bg-white/50 backdrop-blur-sm rounded-2xl border border-gray-200 hover:bg-white/70 transition-colors group">
                      <h3 className="text-xl font-semibold mb-2 group-hover:text-blue-600 transition-colors">
                        ✍️ Compose
                      </h3>
                      <p className="text-gray-600 text-sm">
                        Write with AI assistance
                      </p>
                    </a>
                    <a href="/analytics" className="p-6 bg-white/50 backdrop-blur-sm rounded-2xl border border-gray-200 hover:bg-white/70 transition-colors group">
                      <h3 className="text-xl font-semibold mb-2 group-hover:text-blue-600 transition-colors">
                        📊 Analytics
                      </h3>
                      <p className="text-gray-600 text-sm">
                        Email insights & patterns
                      </p>
                    </a>
                  </div>
                </SignedIn>
              </div>
              <SvgGrid />
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="flex justify-between">
          <p className="text-gray-600">© 2025 Futuristic Mail</p>
          <ul role="list" className="flex gap-2">
            <li className="flex items-center gap-2 after:size-[1.5px] after:rounded-full after:bg-gray-600 last:after:hidden">
              <a className="relative rounded-sm text-gray-500 hover:text-gray-600 after:absolute after:-inset-x-1.5 after:-inset-y-0.5 after:rounded-sm after:border-2 after:border-blue-500 after:opacity-0 focus-visible:after:opacity-100" href="#support">
                Support
              </a>
            </li>
            <li className="flex items-center gap-2 after:size-[1.5px] after:rounded-full after:bg-gray-600 last:after:hidden">
              <a className="relative rounded-sm text-gray-500 hover:text-gray-600 after:absolute after:-inset-x-1.5 after:-inset-y-0.5 after:rounded-sm after:border-2 after:border-blue-500 after:opacity-0 focus-visible:after:opacity-100" href="#privacy">
                Privacy
              </a>
            </li>
            <li className="flex items-center gap-2 after:size-[1.5px] after:rounded-full after:bg-gray-600 last:after:hidden">
              <a className="relative rounded-sm text-gray-500 hover:text-gray-600 after:absolute after:-inset-x-1.5 after:-inset-y-0.5 after:rounded-sm after:border-2 after:border-blue-500 after:opacity-0 focus-visible:after:opacity-100" href="#terms">
                Terms
              </a>
            </li>
          </ul>
        </footer>
      </div>
    </div>
  );
}
