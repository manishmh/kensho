'use server';

import { auth } from '@/auth/auth';
import { db } from '@/lib/db';

export const completeOnboarding = async (onboardingData?: Record<string, unknown>) => {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return { error: 'Not authenticated' };
    }

    // Update user's onboarding status
    await db.user.update({
      where: { email: session.user.email },
      data: { onboardingCompleted: true }
    });

    // TODO: Store onboarding data in a separate table or send to AI service
    if (onboardingData) {
      console.log('Onboarding data received:', JSON.stringify(onboardingData, null, 2));
      // Here you can save the onboarding data to a UserProfile table or send to your AI service
    }

    return { success: 'Onboarding completed successfully!' };
  } catch (error) {
    console.error('Error completing onboarding:', error);
    return { error: 'Failed to complete onboarding' };
  }
}; 