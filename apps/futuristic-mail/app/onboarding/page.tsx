"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { useUserProfile, createUserProfile } from '@/lib/onboarding/client';
import { ONBOARDING_STEPS, type OnboardingStep, type OnboardingState, type ConnectedAccount } from '@/lib/onboarding/types';
import StepIntroduction from '@/components/onboarding/StepIntroduction';
import StepGoals from '@/components/onboarding/StepGoals';
import StepConnect from '@/components/onboarding/StepConnect';
import Image from 'next/image';

export default function OnboardingPage() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const { data: profile, isLoading: profileLoading } = useUserProfile(user?.id);
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('introduction');
  const [profileId, setProfileId] = useState<string | null>(null);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    if (isLoaded && !profileLoading && user) {
      initializeProfile();
    }
  }, [isLoaded, profileLoading, user, profile]);

  const initializeProfile = async () => {
    if (!user) return;
    
    if (!profile) {
      const newProfileId = await createUserProfile(user.id);
      setProfileId(newProfileId);
    } else {
      setProfileId(profile.id);
      const onboarding = profile.onboarding as OnboardingState;
      setCurrentStep(onboarding.currentStep as OnboardingStep);
      
      // If onboarding is complete, redirect to home
      if (onboarding.completed) {
        router.push('/');
        return;
      }
    }
  };

  const handleStepComplete = async (stepData: any) => {
    setAnimating(true);
    
    const currentIndex = ONBOARDING_STEPS.indexOf(currentStep);
    const nextStep = ONBOARDING_STEPS[currentIndex + 1];
    
    // Add delay for smooth transition
    setTimeout(() => {
      if (nextStep) {
        setCurrentStep(nextStep);
      } else {
        // Onboarding complete
        router.push('/');
      }
      setAnimating(false);
    }, 300);
  };

  const loading = !isLoaded || profileLoading;

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500 rounded-full animate-pulse" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Animated background gradient */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-0 -left-4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob" />
        <div className="absolute top-0 -right-4 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000" />
        <div className="absolute -bottom-8 left-20 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000" />
      </div>

      {/* Glow effect */}
      <Image
        src="/glow@q25r.c93b1d41.avif"
        alt=""
        width={1800}
        height={1800}
        className="pointer-events-none absolute left-1/2 top-1/2 z-0 h-[150vh] max-w-none -translate-x-1/2 -translate-y-1/2 select-none opacity-50"
        style={{ color: 'transparent' }}
      />

      {/* Progress indicator */}
      <div className="absolute top-8 left-1/2 -translate-x-1/2 flex gap-2 z-20">
        {ONBOARDING_STEPS.map((step, index) => (
          <div
            key={step}
            className={`h-1 rounded-full transition-all duration-500 ${
              index <= ONBOARDING_STEPS.indexOf(currentStep)
                ? 'w-12 bg-white'
                : 'w-8 bg-white/20'
            }`}
          />
        ))}
      </div>

      {/* Main content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-8">
        <div className={`w-full max-w-2xl transition-all duration-500 ${
          animating ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
        }`}>
          {currentStep === 'introduction' && profile && (
            <StepIntroduction 
              onComplete={handleStepComplete} 
              profileId={profileId!} 
              currentOnboarding={profile.onboarding as OnboardingState}
            />
          )}
          {currentStep === 'goals' && profile && (
            <StepGoals 
              onComplete={handleStepComplete} 
              profileId={profileId!} 
              currentOnboarding={profile.onboarding as OnboardingState}
            />
          )}
          {currentStep === 'connect' && profile && (
            <StepConnect 
              onComplete={handleStepComplete} 
              profileId={profileId!} 
              userId={user?.id!} 
              currentOnboarding={profile.onboarding as OnboardingState}
              currentAccounts={(profile.connectedAccounts || []) as ConnectedAccount[]}
            />
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        
        .animate-blob {
          animation: blob 7s infinite;
        }
        
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}