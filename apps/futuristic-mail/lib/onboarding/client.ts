/**
 * Client-side onboarding helpers using InstantDB
 */

import db from '@/lib/instant_clientside_db';
import type { Profile } from '@/instant.schema';
import type { UserProfile, OnboardingState, ConnectedAccount } from './types';

/**
 * Get user profile by Clerk user ID
 */
export function useUserProfile(userId: string | undefined) {
  const { data, isLoading, error } = db.useQuery({
    profiles: userId ? {
      $: {
        where: {
          userId: userId
        },
        limit: 1
      }
    } : {}
  });

  const profile = userId && data?.profiles?.[0] || null;
  
  return {
    data: profile as Profile | null,
    isLoading: userId ? isLoading : false,
    error
  };
}

/**
 * Create a new user profile
 */
export async function createUserProfile(userId: string): Promise<string> {
  const profileId = crypto.randomUUID();
  
  await db.transact([
    db.tx.profiles[profileId].update({
      userId,
      connectedAccounts: [],
      onboarding: {
        currentStep: 'introduction',
        completedSteps: [],
        stepData: {},
        completed: false
      },
      preferences: {
        goals: []
      },
      createdAt: Date.now(),
      updatedAt: Date.now()
    })
  ]);

  return profileId;
}

/**
 * Update onboarding step
 * Note: This assumes the profile data is already available in the component
 * that calls this function. The component should pass the current onboarding state.
 */
export async function updateOnboardingStep(
  profileId: string, 
  currentOnboarding: OnboardingState,
  step: string, 
  stepData: any,
  completed: boolean = false
): Promise<void> {
  const completedSteps = [...(currentOnboarding.completedSteps || [])];
  
  if (!completedSteps.includes(step) && completed) {
    completedSteps.push(step);
  }

  await db.transact([
    db.tx.profiles[profileId].update({
      onboarding: {
        ...currentOnboarding,
        currentStep: step,
        completedSteps,
        stepData: {
          ...currentOnboarding.stepData,
          [step]: stepData
        },
        completed: completedSteps.length >= 3, // 3 main steps
        completedAt: completedSteps.length >= 3 ? Date.now() : undefined
      },
      updatedAt: Date.now()
    })
  ]);
}

/**
 * Update user preferences (goals)
 */
export async function updateUserPreferences(
  profileId: string,
  goals: string[]
): Promise<void> {
  await db.transact([
    db.tx.profiles[profileId].update({
      preferences: {
        goals
      },
      updatedAt: Date.now()
    })
  ]);
}

/**
 * Add connected account
 */
export async function addConnectedAccount(
  profileId: string,
  currentAccounts: ConnectedAccount[],
  account: ConnectedAccount
): Promise<void> {
  // Remove existing account of same provider if exists
  const filtered = currentAccounts.filter(a => a.provider !== account.provider);
  
  await db.transact([
    db.tx.profiles[profileId].update({
      connectedAccounts: [...filtered, account],
      updatedAt: Date.now()
    })
  ]);
}

/**
 * Mark onboarding as complete
 */
export async function completeOnboarding(
  profileId: string,
  currentOnboarding: OnboardingState
): Promise<void> {
  await db.transact([
    db.tx.profiles[profileId].update({
      onboarding: {
        ...currentOnboarding,
        completed: true,
        completedAt: Date.now()
      },
      updatedAt: Date.now()
    })
  ]);
}