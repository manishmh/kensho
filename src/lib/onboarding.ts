import { auth } from '@/auth/auth';
import { db } from '@/lib/db';

export interface UserOnboardingData {
  user: {
    profile: {
      name: string;
      age: number | null;
      location: string;
    };
    dietary: {
      type: string | null;
      restrictions: Array<{
        type: string;
        value: string;
      }>;
      goals: string[];
    };
    preferences: {
      foods: Record<string, {
        preference: string;
        category: string;
        weight: number;
      }>;
      customLikes: Array<{
        food: string;
        preference: string;
        weight: number;
        source: string;
      }>;
      customDislikes: Array<{
        food: string;
        preference: string;
        weight: number;
        source: string;
      }>;
    };
    completedAt: string;
  };
}

/**
 * Fetch user's onboarding data from database
 */
export const getUserOnboardingData = async (): Promise<UserOnboardingData | null> => {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      console.log('No authenticated user found');
      return null;
    }

    // Get user with onboarding data
    const user = await db.user.findUnique({
      where: { email: session.user.email },
      include: {
        onboardingData: true
      }
    });

    if (!user) {
      console.log('User not found');
      return null;
    }

    if (!user.onboardingData) {
      console.log('No onboarding data found for user');
      return null;
    }

    // Return the stored JSON data
    return user.onboardingData.data as unknown as UserOnboardingData;
  } catch (error) {
    console.error('Error fetching user onboarding data:', error);
    return null;
  }
};

/**
 * Check if user has completed onboarding
 */
export const hasCompletedOnboarding = async (): Promise<boolean> => {
  try {
    const session = await auth();
    
    if (!session?.user?.email) {
      return false;
    }

    const user = await db.user.findUnique({
      where: { email: session.user.email },
      select: { onboardingCompleted: true }
    });

    return user?.onboardingCompleted || false;
  } catch (error) {
    console.error('Error checking onboarding status:', error);
    return false;
  }
};

/**
 * Extract user preferences for restaurant filtering
 */
export const getUserPreferencesForRestaurants = async () => {
  const onboardingData = await getUserOnboardingData();
  
  if (!onboardingData) {
    return null;
  }

  const { user } = onboardingData;
  
  return {
    // Dietary restrictions and preferences
    dietType: user.dietary.type,
    allergies: user.dietary.restrictions
      .filter(r => r.type === 'allergy')
      .map(r => r.value),
    restrictions: user.dietary.restrictions
      .filter(r => r.type === 'restriction')
      .map(r => r.value),
    healthGoals: user.dietary.goals,
    
    // Food preferences with weights
    likedFoods: [
      ...Object.entries(user.preferences.foods)
        .filter(([, pref]) => pref.weight >= 4) // like or love
        .map(([food, pref]) => ({ food, weight: pref.weight, category: pref.category })),
      ...user.preferences.customLikes.map(like => ({ 
        food: like.food, 
        weight: like.weight, 
        category: 'custom' 
      }))
    ],
    
    dislikedFoods: [
      ...Object.entries(user.preferences.foods)
        .filter(([, pref]) => pref.weight <= 2) // hate or dislike
        .map(([food, pref]) => ({ food, weight: pref.weight, category: pref.category })),
      ...user.preferences.customDislikes.map(dislike => ({ 
        food: dislike.food, 
        weight: dislike.weight, 
        category: 'custom' 
      }))
    ],
    
    // Profile info
    location: user.profile.location,
    age: user.profile.age,
    name: user.profile.name
  };
}; 