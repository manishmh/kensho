import { getJson } from 'serpapi';

// SerpApi configuration
const SERP_API_KEY = process.env.SERP_API_KEY;
const SEARCH_RADIUS_KM = 10; // 8-10km radius as specified
const RESULTS_PER_TYPE_DIETARY = 20; // 20 restaurants per dietary type
const RESULTS_PER_TYPE_PREFERENCE = 5; // 5 restaurants per preference type

if (!SERP_API_KEY) {
  console.warn('⚠️ SERP_API_KEY not found in environment variables');
}

export interface RestaurantSearchParams {
  latitude: number;
  longitude: number;
  query: string;
  radius?: number;
  limit?: number;
}

export interface SerpApiRestaurant {
  position: number;
  title: string;
  place_id?: string;
  data_id?: string;
  data_cid?: string;
  reviews_link?: string;
  photos_link?: string;
  gps_coordinates?: {
    latitude: number;
    longitude: number;
  };
  place_id_search?: string;
  lsig?: string;
  rating?: number;
  reviews?: number;
  type?: string[];
  types?: string[];
  address?: string;
  open_state?: string;
  hours?: string;
  operating_hours?: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  phone?: string;
  website?: string;
  description?: string;
  service_options?: {
    dine_in?: boolean;
    takeout?: boolean;
    delivery?: boolean;
  };
  price?: string;
  menu?: string;
  order_online?: string;
  thumbnail?: string;
}

export interface SerpApiLocalResults {
  local_results?: SerpApiRestaurant[];
  place_results?: {
    title: string;
    data_id: string;
    data_cid: string;
    reviews_link: string;
    photos_link: string;
    gps_coordinates: {
      latitude: number;
      longitude: number;
    };
    place_id_search: string;
    lsig: string;
    rating: number;
    reviews: number;
    type: string[];
    address: string;
    open_state: string;
    hours: string;
    operating_hours: any; // eslint-disable-line @typescript-eslint/no-explicit-any
    phone: string;
    website: string;
    description: string;
    service_options: {
      dine_in: boolean;
      takeout: boolean;
      delivery: boolean;
    };
    price: string;
    menu: string;
    order_online: string;
  };
  search_metadata?: {
    id: string;
    status: string;
    json_endpoint: string;
    created_at: string;
    processed_at: string;
    google_url: string;
    raw_html_file: string;
    total_time_taken: number;
  };
  search_parameters?: {
    engine: string;
    q: string;
    google_domain: string;
    hl: string;
    gl: string;
    device: string;
  };
  search_information?: {
    local_results_state: string;
    query_displayed: string;
  };
}

/**
 * Search for restaurants using SerpApi Google Local/Maps search
 */
export async function searchRestaurants(params: RestaurantSearchParams): Promise<SerpApiRestaurant[]> {
  if (!SERP_API_KEY) {
    throw new Error('SERP_API_KEY is required for restaurant search');
  }

  try {
    const { latitude, longitude, query, radius = SEARCH_RADIUS_KM, limit = RESULTS_PER_TYPE_DIETARY } = params;
    
    console.log(`🔍 Searching for "${query}" near ${latitude}, ${longitude} (${radius}km radius)`);

    const searchParams = {
      engine: 'google_maps',
      q: query,
      ll: `@${latitude},${longitude},${radius}z`, // Location with zoom level for radius
      type: 'search',
      api_key: SERP_API_KEY,
      hl: 'en',
      gl: 'us'
    };

    const response = await getJson(searchParams) as SerpApiLocalResults;
    
    // Log the raw SerpApi response for debugging
    console.log(`\n🔍 === RAW SERP API RESPONSE for "${query}" ===`);
    console.log(JSON.stringify(response, null, 2));
    console.log(`🔍 === END RAW RESPONSE for "${query}" ===\n`);
    
    if (!response.local_results || response.local_results.length === 0) {
      console.log(`ℹ️ No results found for "${query}"`);
      return [];
    }

    // Limit results and add additional metadata
    const restaurants = response.local_results.slice(0, limit).map((restaurant, index) => ({
      ...restaurant,
      position: index + 1,
      search_query: query,
      search_coordinates: { latitude, longitude },
      search_radius_km: radius
    }));

    console.log(`✅ Found ${restaurants.length} restaurants for "${query}"`);
    return restaurants;

  } catch (error) {
    console.error(`❌ Error searching for restaurants with query "${params.query}":`, error);
    
    // Return empty array instead of throwing to prevent breaking the entire flow
    return [];
  }
}

/**
 * Search for multiple restaurant types in parallel
 */
export async function searchMultipleRestaurantTypes(
  latitude: number,
  longitude: number,
  queries: string[],
  searchType: 'dietary' | 'preference' = 'dietary'
): Promise<{ [query: string]: SerpApiRestaurant[] }> {
  
  const limit = searchType === 'dietary' ? RESULTS_PER_TYPE_DIETARY : RESULTS_PER_TYPE_PREFERENCE;
  console.log(`🔍 Searching for ${queries.length} ${searchType} restaurant types near ${latitude}, ${longitude} (${limit} per type)`);
  
  const searchPromises = queries.map(async (query) => {
    const restaurants = await searchRestaurants({
      latitude,
      longitude,
      query,
      radius: SEARCH_RADIUS_KM,
      limit
    });
    
    return { query, restaurants };
  });

  try {
    const results = await Promise.allSettled(searchPromises);
    const restaurantsByType: { [query: string]: SerpApiRestaurant[] } = {};

    results.forEach((result, index) => {
      const query = queries[index];
      
      if (result.status === 'fulfilled') {
        restaurantsByType[query] = result.value.restaurants;
      } else {
        console.error(`❌ Failed to search for "${query}":`, result.reason);
        restaurantsByType[query] = []; // Empty array for failed searches
      }
    });

    const totalRestaurants = Object.values(restaurantsByType).reduce(
      (sum, restaurants) => sum + restaurants.length, 
      0
    );
    
    console.log(`✅ Completed search for all restaurant types. Total: ${totalRestaurants} restaurants`);
    
    return restaurantsByType;
    
  } catch (error) {
    console.error('❌ Error in parallel restaurant search:', error);
    throw error;
  }
}

/**
 * Generate restaurant search queries based on dietary preferences and food preferences
 */
export function generateRestaurantQueries(userPreferences: {
  dietType?: string | null;
  likedFoods?: Array<{ food: string; weight: number; category: string }>;
  allergies?: string[];
  restrictions?: string[];
}): { dietary: string[]; preference: string[] } {
  
  const { dietType, likedFoods = [], allergies = [] } = userPreferences;
  
  // Base dietary queries
  const dietaryQueries: string[] = [];
  
  if (dietType === 'vegetarian') {
    dietaryQueries.push('vegetarian restaurants', 'plant based restaurants');
  } else if (dietType === 'vegan') {
    dietaryQueries.push('vegan restaurants', 'plant based restaurants');
  } else if (dietType === 'pescatarian') {
    dietaryQueries.push('seafood restaurants', 'fish restaurants');
  } else if (dietType === 'non-vegetarian') {
    dietaryQueries.push('restaurants', 'steakhouse', 'bbq restaurants');
  } else {
    dietaryQueries.push('restaurants', 'healthy restaurants');
  }

  // Add allergy-specific queries
  if (!allergies.includes('gluten')) {
    dietaryQueries.push('gluten free restaurants');
  }
  
  // Preference-based queries from liked foods
  const preferenceQueries: string[] = [];
  
  // Get top liked foods and convert to restaurant queries
  const topLikedFoods = likedFoods
    .filter(item => item.weight >= 4) // like or love
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 10); // Top 10 preferences

  topLikedFoods.forEach(item => {
    const food = item.food.toLowerCase();
    
    // Map food preferences to restaurant types
    if (food.includes('pizza')) {
      preferenceQueries.push('pizza restaurants', 'italian restaurants');
    } else if (food.includes('burger')) {
      preferenceQueries.push('burger restaurants', 'american restaurants');
    } else if (food.includes('sushi')) {
      preferenceQueries.push('sushi restaurants', 'japanese restaurants');
    } else if (food.includes('taco') || food.includes('mexican')) {
      preferenceQueries.push('mexican restaurants', 'taco restaurants');
    } else if (food.includes('chinese')) {
      preferenceQueries.push('chinese restaurants', 'asian restaurants');
    } else if (food.includes('indian')) {
      preferenceQueries.push('indian restaurants', 'curry restaurants');
    } else if (food.includes('thai')) {
      preferenceQueries.push('thai restaurants', 'asian restaurants');
    } else if (food.includes('coffee')) {
      preferenceQueries.push('coffee shops', 'cafes');
    } else if (food.includes('dessert') || food.includes('ice cream')) {
      preferenceQueries.push('dessert restaurants', 'ice cream shops');
    } else {
      // Generic query for specific food items
      preferenceQueries.push(`${food} restaurants`);
    }
  });

  // Remove duplicates and limit queries
  const uniqueDietaryQueries = [...new Set(dietaryQueries)].slice(0, 8);
  const uniquePreferenceQueries = [...new Set(preferenceQueries)].slice(0, 12);

  console.log(`🎯 Generated ${uniqueDietaryQueries.length} dietary queries and ${uniquePreferenceQueries.length} preference queries`);

  return {
    dietary: uniqueDietaryQueries,
    preference: uniquePreferenceQueries
  };
} 