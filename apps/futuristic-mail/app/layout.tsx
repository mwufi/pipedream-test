import type { Metadata } from "next";
import type { Viewport } from "next";
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
import ClerkSignedInComponent from "@/components/ClerkSignedInComponent";
import Link from "next/link";

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
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#ffffff" }
  ],
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
          <header className="fixed top-0 left-0 right-0 z-50 bg-transparent ">
            <div className="container mx-auto px-4 py-4 flex justify-between items-center">
              <Link href="/" className="text-xl font-bold hover:opacity-80 transition-opacity">
                Neo Mail
              </Link>
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
          <main className="relative z-20 min-h-screen bg-gray-100 overflow-hidden">
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
            <ClerkSignedInComponent />
          </SignedIn>
        </body>
      </html>
    </ClerkProvider>
  );
}
