"use client";

import { useState } from 'react';
import { updateOnboardingStep, updateUserPreferences } from '@/lib/onboarding/client';
import { GOALS, type OnboardingState } from '@/lib/onboarding/types';

interface StepGoalsProps {
  onComplete: (data: any) => void;
  profileId: string;
  currentOnboarding: OnboardingState;
}

export default function StepGoals({ onComplete, profileId, currentOnboarding }: StepGoalsProps) {
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [animateIn, setAnimateIn] = useState(false);

  // Trigger animation on mount
  useState(() => {
    setTimeout(() => setAnimateIn(true), 100);
  });

  const toggleGoal = (goalId: string) => {
    setSelectedGoals(prev => 
      prev.includes(goalId) 
        ? prev.filter(id => id !== goalId)
        : [...prev, goalId]
    );
  };

  const handleContinue = async () => {
    await updateOnboardingStep(profileId, currentOnboarding, 'goals', { selected: selectedGoals }, true);
    await updateUserPreferences(profileId, selectedGoals);
    onComplete({ selected: selectedGoals });
  };

  return (
    <div className="space-y-8">
      {/* Title */}
      <div className={`text-center space-y-4 transition-all duration-1000 ${
        animateIn ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}>
        <h2 className="text-4xl font-bold">What do you want to achieve with Neo?</h2>
        <p className="text-gray-400">Select all that apply - I'll customize my approach for you</p>
      </div>

      {/* Goals Grid */}
      <div className="grid gap-4">
        {GOALS.map((goal, index) => (
          <button
            key={goal.id}
            onClick={() => toggleGoal(goal.id)}
            className={`group relative p-6 rounded-2xl border transition-all duration-500 ${
              animateIn ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            } ${
              selectedGoals.includes(goal.id)
                ? 'border-purple-500 bg-purple-500/10'
                : 'border-white/10 bg-white/5 hover:bg-white/10'
            }`}
            style={{ transitionDelay: `${index * 100 + 200}ms` }}
          >
            <div className="flex items-start gap-4 text-left">
              <div className={`text-3xl transition-transform duration-300 ${
                selectedGoals.includes(goal.id) ? 'scale-110' : 'group-hover:scale-110'
              }`}>
                {goal.icon}
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-1">{goal.title}</h3>
                <p className="text-sm text-gray-400">{goal.description}</p>
              </div>
              <div className={`w-6 h-6 rounded-full border-2 transition-all ${
                selectedGoals.includes(goal.id)
                  ? 'border-purple-500 bg-purple-500'
                  : 'border-white/30'
              }`}>
                {selectedGoals.includes(goal.id) && (
                  <svg className="w-full h-full p-1" viewBox="0 0 20 20" fill="white">
                    <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/>
                  </svg>
                )}
              </div>
            </div>
            
            {/* Glow effect on selection */}
            {selectedGoals.includes(goal.id) && (
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 blur-xl -z-10 animate-pulse" />
            )}
          </button>
        ))}
      </div>

      {/* CTA Button */}
      <div className={`flex justify-center transition-all duration-1000 ${
        animateIn ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`} style={{ transitionDelay: '800ms' }}>
        <button
          onClick={handleContinue}
          disabled={selectedGoals.length === 0}
          className={`px-8 py-4 rounded-full font-semibold transition-all ${
            selectedGoals.length > 0
              ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/25'
              : 'bg-gray-800 text-gray-500 cursor-not-allowed'
          }`}
        >
          Continue
        </button>
      </div>
    </div>
  );
}