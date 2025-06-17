"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { useUserProfile } from '@/lib/onboarding/client';
import type { OnboardingState } from '@/lib/onboarding/types';

export default function ProfileCheck({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const { data: profile, isLoading } = useUserProfile(user?.id);

  useEffect(() => {
    if (isLoaded && !isLoading) {
      checkProfile();
    }
  }, [isLoaded, isLoading, profile]);

  const checkProfile = () => {
    if (!user) return;

    // If no profile exists or onboarding not complete, redirect to onboarding
    if (!profile || !(profile.onboarding as OnboardingState)?.completed) {
      router.push('/onboarding');
    }
  };

  // Show loading state while checking
  if (!isLoaded || isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="w-8 h-8 bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500 rounded-full animate-pulse" />
      </div>
    );
  }

  return <>{children}</>;
}