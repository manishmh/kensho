'use server';

import { auth } from '@/auth/auth';
import { db } from '@/lib/db';
import { knowledgeGraph } from '@/lib/knowledgeGraph';
import { Prisma } from '@prisma/client';

export const completeOnboarding = async (onboardingData?: Record<string, unknown>) => {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return { error: 'Not authenticated' };
    }

    // Get user ID
    const user = await db.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    });

    if (!user) {
      return { error: 'User not found' };
    }

    // Save onboarding data to database if provided
    if (onboardingData) {
      console.log('Saving onboarding data:', JSON.stringify(onboardingData, null, 2));
      
      // Use upsert to handle both create and update cases
      await db.onboardingData.upsert({
        where: { userId: user.id },
        update: {
          data: onboardingData as Prisma.InputJsonValue,
          updatedAt: new Date()
        },
        create: {
          userId: user.id,
          data: onboardingData as Prisma.InputJsonValue
        }
      });
    }

    // Update user's onboarding status
    await db.user.update({
      where: { email: session.user.email },
      data: { onboardingCompleted: true }
    });

    // Sync user data to knowledge graph
    try {
      console.log('🔄 Syncing user data to knowledge graph...');
      await knowledgeGraph.createOrUpdateUser(session.user.email);
      console.log('✅ User data synced to knowledge graph successfully');
    } catch (kgError) {
      console.error('⚠️ Failed to sync to knowledge graph (non-blocking):', kgError);
      // Don't fail the onboarding if knowledge graph sync fails
    }

    return { success: 'Onboarding completed and data saved successfully!' };
  } catch (error) {
    console.error('Error completing onboarding:', error);
    return { error: 'Failed to complete onboarding' };
  }
}; 