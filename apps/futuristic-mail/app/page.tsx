import Image from "next/image";
import SvgGrid from "@/components/SvgGrid";

export default function Home() {
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
              {/* Main content area - this is where your sign in form will go */}
              <div className="flex flex-col items-center justify-center text-center">
                <h1 className="text-4xl font-bold text-gray-800 mb-4">
                  Futuristic Mail
                </h1>
                <p className="text-gray-600 max-w-md">
                  Welcome to your futuristic email experience
                </p>
                <p className="text-gray-600 max-w-md">
                  Welcome to your futuristic email experience
                </p>
                <p className="text-gray-600 max-w-md">
                  Welcome to your futuristic email experience
                </p>
                <p className="text-gray-600 max-w-md">
                  Welcome to your futuristic email experience
                </p>
                <p className="text-gray-600 max-w-md">
                  Welcome to your futuristic email experience
                </p>
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
