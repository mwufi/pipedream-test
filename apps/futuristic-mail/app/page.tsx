import Image from "next/image";
import SvgGrid from "@/components/SvgGrid";

export default function Home() {
  return (
    <div className="relative flex min-h-screen flex-col items-center overflow-hidden bg-gray-300-mixed px-4 py-6 [:root:has(&)]:bg-gray-300-mixed">
      {/* Faint blue background glow */}
      <Image
        src="/glow@q25r.c93b1d41.avif"
        alt=""
        width={1800}
        height={1800}
        className="pointer-events-none absolute left-1/2 top-1/2 z-10 h-[150vh] max-w-none -translate-x-1/2 -translate-y-1/2 select-none mix-blend-overlay"
        style={{ color: 'transparent' }}
      />

      {/* SVG Grid Component */}
      <SvgGrid />

      {/* Main content area */}
      <div className="relative z-30 flex flex-col items-center justify-center flex-1">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">
          Futuristic Mail
        </h1>
        <p className="text-gray-600 text-center max-w-md">
          Welcome to your futuristic email experience
        </p>
      </div>
    </div>
  );
}
