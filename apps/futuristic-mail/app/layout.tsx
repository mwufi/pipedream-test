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
import { AISidebarProvider } from "@/contexts/ai-sidebar-context";

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
          <AISidebarProvider>
            {children}
            <SignedIn>
              <EmailAgent />
              <ClerkSignedInComponent />
            </SignedIn>
          </AISidebarProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
