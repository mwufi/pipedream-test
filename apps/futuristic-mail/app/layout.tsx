import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import {
  ClerkProvider,
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/nextjs";
import Image from "next/image";
import EmailAgent from "@/components/EmailAgent";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Futuristic Mail",
  description: "Next-generation email experience",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#ffffff" }
  ],
  other: {
    "msapplication-TileColor": "#ffffff",
    "msapplication-navbutton-color": "#ffffff",
    "apple-mobile-web-app-status-bar-style": "light-content"
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen relative bg-stone-100`}
        >


          <header className="fixed top-0 left-0 right-0 z-50 bg-white/10 backdrop-blur-sm border-b border-white/10">
            <div className="container mx-auto px-4 py-4 flex justify-between items-center">
              <h1 className="text-xl font-bold">Neo Mail</h1>
              <div className="flex gap-4">
                <SignedOut>
                  <SignInButton mode="modal">
                    <button className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors">
                      Sign In
                    </button>
                  </SignInButton>
                  <SignUpButton mode="modal">
                    <button className="px-4 py-2 bg-white text-black hover:bg-white/90 rounded-lg font-medium transition-colors">
                      Sign Up
                    </button>
                  </SignUpButton>
                </SignedOut>
                <SignedIn>
                  <UserButton afterSignOutUrl="/" />
                </SignedIn>
              </div>
            </div>
          </header>
          <main className="relative z-20 pt-10 min-h-screen bg-gray-100 overflow-hidden">
            {/* Faint blue background glow */}
            <Image
              src="/glow@q25r.c93b1d41.avif"
              alt=""
              width={1800}
              height={1800}
              className="pointer-events-none absolute left-1/2 top-1/2 z-0 h-[150vh] max-w-none -translate-x-1/2 -translate-y-1/2 select-none mix-blend-overlay"
              style={{ color: 'transparent' }}
            />
            {children}
          </main>
          <SignedIn>
            <EmailAgent />
          </SignedIn>
        </body>
      </html>
    </ClerkProvider>
  );
}
