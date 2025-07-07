import { getUserPreferencesForRestaurants } from './onboarding';
import {
    generateRestaurantQueries,
    searchMultipleRestaurantTypes,
    SerpApiRestaurant
} from './serpApi';

export interface UserLocation {
  latitude: number;
  longitude: number;
  address: string;
  city?: string;
  state?: string;
  country?: string;
}

export interface RecommendationData {
  user_location: UserLocation;
  user_preferences: {
    dietType?: string | null;
    allergies: string[];
    restrictions: string[];
    healthGoals: string[];
    likedFoods: Array<{
      food: string;
      weight: number;
      category: string;
    }>;
    dislikedFoods: Array<{
      food: string;
      weight: number;
      category: string;
    }>;
    location?: string;
    age?: number | null;
    name?: string;
  };
  restaurants: {
    dietary_based: { [query: string]: SerpApiRestaurant[] };
    preference_based: { [query: string]: SerpApiRestaurant[] };
  };
  search_metadata: {
    search_queries: {
      dietary: string[];
      preference: string[];
    };
    search_radius_km: number;
    results_per_type_dietary: number;
    results_per_type_preference: number;
    timestamp: string;
    total_restaurants_found: number;
    search_coordinates: {
      latitude: number;
      longitude: number;
    };
  };
}

/**
 * Main service to fetch comprehensive restaurant recommendations
 * Combines user location, preferences, and SerpApi restaurant searches
 */
export class RestaurantRecommendationService {
  
  /**
   * Fetch comprehensive restaurant data for AI recommendation processing
   */
  async fetchRestaurantRecommendations(userLocation: UserLocation): Promise<RecommendationData> {
    try {
      console.log('🚀 Starting restaurant recommendation data fetch...');
      
      // Step 1: Get user preferences from onboarding data
      console.log('📋 Fetching user preferences...');
      const userPreferences = await getUserPreferencesForRestaurants();
      
      if (!userPreferences) {
        throw new Error('User preferences not found. Please complete onboarding first.');
      }

      // Log user preferences
      console.log('\n👤 === USER PREFERENCES DATA ===');
      console.log(JSON.stringify(userPreferences, null, 2));
      console.log('👤 === END USER PREFERENCES ===\n');

      // Step 2: Generate search queries based on preferences
      console.log('🎯 Generating restaurant search queries...');
      const searchQueries = generateRestaurantQueries({
        dietType: userPreferences.dietType,
        likedFoods: userPreferences.likedFoods,
        allergies: userPreferences.allergies,
        restrictions: userPreferences.restrictions
      });

      // Log generated search queries
      console.log('\n🔍 === GENERATED SEARCH QUERIES ===');
      console.log(JSON.stringify(searchQueries, null, 2));
      console.log('🔍 === END SEARCH QUERIES ===\n');

      // Step 3: Search for restaurants in parallel
      console.log('🔍 Searching for restaurants...');
      const [dietaryRestaurants, preferenceRestaurants] = await Promise.all([
        // Search based on dietary requirements (20 per type)
        searchMultipleRestaurantTypes(
          userLocation.latitude,
          userLocation.longitude,
          searchQueries.dietary,
          'dietary'
        ),
        // Search based on food preferences (5 per type)
        searchMultipleRestaurantTypes(
          userLocation.latitude,
          userLocation.longitude,
          searchQueries.preference,
          'preference'
        )
      ]);

      // Step 4: Calculate totals and prepare metadata
      const totalDietaryRestaurants = Object.values(dietaryRestaurants)
        .reduce((sum, restaurants) => sum + restaurants.length, 0);
      
      const totalPreferenceRestaurants = Object.values(preferenceRestaurants)
        .reduce((sum, restaurants) => sum + restaurants.length, 0);

      const totalRestaurants = totalDietaryRestaurants + totalPreferenceRestaurants;

      // Step 5: Construct final recommendation data
      const recommendationData: RecommendationData = {
        user_location: userLocation,
        user_preferences: userPreferences,
        restaurants: {
          dietary_based: dietaryRestaurants,
          preference_based: preferenceRestaurants
        },
        search_metadata: {
          search_queries: searchQueries,
          search_radius_km: 10,
          results_per_type_dietary: 20,
          results_per_type_preference: 5,
          timestamp: new Date().toISOString(),
          total_restaurants_found: totalRestaurants,
          search_coordinates: {
            latitude: userLocation.latitude,
            longitude: userLocation.longitude
          }
        }
      };

      console.log(`✅ Restaurant recommendation data fetch completed!`);
      console.log(`📊 Summary:`);
      console.log(`   • Dietary-based restaurants: ${totalDietaryRestaurants}`);
      console.log(`   • Preference-based restaurants: ${totalPreferenceRestaurants}`);
      console.log(`   • Total restaurants: ${totalRestaurants}`);
      console.log(`   • Search queries: ${searchQueries.dietary.length + searchQueries.preference.length}`);

      // Log the complete JSON data structure
      console.log('\n🔍 === COMPLETE RESTAURANT RECOMMENDATION DATA ===');
      console.log(JSON.stringify(recommendationData, null, 2));
      console.log('🔍 === END RECOMMENDATION DATA ===\n');

      return recommendationData;

    } catch (error) {
      console.error('❌ Error fetching restaurant recommendations:', error);
      throw error;
    }
  }

  /**
   * Validate that user has completed onboarding and has location data
   */
  async validateUserReadiness(): Promise<{ ready: boolean; message: string }> {
    try {
      const userPreferences = await getUserPreferencesForRestaurants();
      
      if (!userPreferences) {
        return {
          ready: false,
          message: 'User has not completed onboarding. Please complete onboarding first.'
        };
      }

      if (!userPreferences.name) {
        return {
          ready: false,
          message: 'User profile incomplete. Missing name information.'
        };
      }

      return {
        ready: true,
        message: 'User is ready for restaurant recommendations.'
      };

    } catch (error) {
      console.error('Error validating user readiness:', error);
      return {
        ready: false,
        message: 'Error validating user data. Please try again.'
      };
    }
  }

  /**
   * Get a preview of what search queries would be generated for a user
   */
  async getSearchQueriesPreview(): Promise<{ dietary: string[]; preference: string[] } | null> {
    try {
      const userPreferences = await getUserPreferencesForRestaurants();
      
      if (!userPreferences) {
        return null;
      }

      return generateRestaurantQueries({
        dietType: userPreferences.dietType,
        likedFoods: userPreferences.likedFoods,
        allergies: userPreferences.allergies,
        restrictions: userPreferences.restrictions
      });

    } catch (error) {
      console.error('Error getting search queries preview:', error);
      return null;
    }
  }

  /**
   * Process and clean restaurant data for consistency
   */
  private processRestaurantData(restaurants: SerpApiRestaurant[]): SerpApiRestaurant[] {
    return restaurants.map(restaurant => ({
      ...restaurant,
      // Ensure consistent data structure
      rating: restaurant.rating || 0,
      reviews: restaurant.reviews || 0,
      address: restaurant.address || 'Address not available',
      phone: restaurant.phone || '',
      website: restaurant.website || '',
      // Add derived fields
      has_rating: Boolean(restaurant.rating && restaurant.rating > 0),
      has_reviews: Boolean(restaurant.reviews && restaurant.reviews > 0),
      is_highly_rated: Boolean(restaurant.rating && restaurant.rating >= 4.0),
    }));
  }
}

// Export a singleton instance
export const restaurantRecommendationService = new RestaurantRecommendationService(); 