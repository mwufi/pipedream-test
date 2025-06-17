"use client";

import { useState } from 'react';
import { updateOnboardingStep } from '@/lib/onboarding/client';
import type { OnboardingState } from '@/lib/onboarding/types';

interface StepIntroductionProps {
  onComplete: (data: any) => void;
  profileId: string;
  currentOnboarding: OnboardingState;
}

export default function StepIntroduction({ onComplete, profileId, currentOnboarding }: StepIntroductionProps) {
  const [animateIn, setAnimateIn] = useState(false);

  // Trigger animation on mount
  useState(() => {
    setTimeout(() => setAnimateIn(true), 100);
  });

  const handleContinue = async () => {
    await updateOnboardingStep(profileId, currentOnboarding, 'introduction', { acknowledged: true }, true);
    onComplete({ acknowledged: true });
  };

  return (
    <div className="text-center space-y-8">
      {/* AI Orb */}
      <div className={`mx-auto transition-all duration-1000 ${
        animateIn ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
      }`}>
        <div className="relative w-32 h-32 mx-auto">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500 rounded-full animate-pulse" />
          <div className="absolute inset-0 bg-gradient-to-tr from-pink-400 via-purple-500 to-blue-500 rounded-full animate-pulse animation-delay-1000 mix-blend-multiply" />
          <div className="absolute inset-2 bg-black/50 backdrop-blur-sm rounded-full" />
          
          {/* Eyes */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex gap-3">
              <div className="w-3 h-3 bg-white rounded-full animate-blink" />
              <div className="w-3 h-3 bg-white rounded-full animate-blink animation-delay-200" />
            </div>
          </div>
        </div>
      </div>

      {/* Title */}
      <div className={`space-y-4 transition-all duration-1000 delay-300 ${
        animateIn ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}>
        <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
          Neo Mail is different
        </h1>
        <p className="text-xl text-gray-300">
          than other email helpers you've used
        </p>
      </div>

      {/* Description */}
      <div className={`space-y-4 max-w-lg mx-auto transition-all duration-1000 delay-500 ${
        animateIn ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}>
        <p className="text-lg text-gray-400">
          I'm your <span className="text-white font-semibold">AI Relationship Manager</span>
        </p>
        <p className="text-gray-400">
          I help you build and maintain meaningful connections through intelligent email management. 
          No more missed opportunities or forgotten follow-ups.
        </p>
      </div>

      {/* CTA Button */}
      <div className={`transition-all duration-1000 delay-700 ${
        animateIn ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}>
        <button
          onClick={handleContinue}
          className="group relative px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full font-semibold text-white overflow-hidden transition-all hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/25"
        >
          <span className="relative z-10">Let's Begin</span>
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>
      </div>

      <style jsx>{`
        @keyframes blink {
          0%, 90%, 100% { opacity: 1; }
          95% { opacity: 0.1; }
        }
        
        .animate-blink {
          animation: blink 4s infinite;
        }
        
        .animation-delay-200 {
          animation-delay: 200ms;
        }
        
        .animation-delay-1000 {
          animation-delay: 1000ms;
        }
        
        .delay-300 {
          transition-delay: 300ms;
        }
        
        .delay-500 {
          transition-delay: 500ms;
        }
        
        .delay-700 {
          transition-delay: 700ms;
        }
      `}</style>
    </div>
  );
}