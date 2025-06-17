/**
 * Onboarding-related types
 */

export interface UserProfile {
  id: string;
  userId: string; // Clerk user ID
  connectedAccounts: ConnectedAccount[];
  onboarding: OnboardingState;
  preferences: UserPreferences;
  createdAt: number;
  updatedAt: number;
}

export interface ConnectedAccount {
  provider: 'gmail' | 'google_calendar' | 'google_contacts' | 'outlook';
  accountId: string; // Pipedream account ID
  email?: string;
  connected: boolean;
  connectedAt: number;
}

export interface OnboardingState {
  currentStep: string;
  completedSteps: string[];
  stepData: {
    introduction?: { acknowledged: boolean };
    goals?: { selected: string[] };
    connect?: { accountsConnected: number };
    emailRules?: { rules: string; processed: any };
  };
  completed: boolean;
  completedAt?: number;
}

export interface UserPreferences {
  goals: string[];
  emailRules?: string;
}

// Onboarding step types
export type OnboardingStep = 'introduction' | 'goals' | 'connect' | 'emailRules';

export const ONBOARDING_STEPS: OnboardingStep[] = ['introduction', 'goals', 'connect'];

// Goal options
export interface Goal {
  id: string;
  icon: string;
  title: string;
  description: string;
}

export const GOALS: Goal[] = [
  {
    id: 'connections',
    icon: '🤝',
    title: 'Build better connections',
    description: 'Nurture relationships with timely, thoughtful responses'
  },
  {
    id: 'inbox',
    icon: '📧',
    title: 'Stay on top of my inbox',
    description: 'Never let important emails slip through the cracks'
  },
  {
    id: 'alerts',
    icon: '🔔',
    title: 'Never miss important emails',
    description: 'Get smart notifications for what matters most'
  },
  {
    id: 'professional',
    icon: '💼',
    title: 'Manage professional relationships',
    description: 'Keep track of clients, partners, and opportunities'
  },
  {
    id: 'followup',
    icon: '🎯',
    title: 'Follow up like a pro',
    description: 'Automated reminders and perfect timing'
  }
];