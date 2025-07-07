import { auth } from '@/auth/auth';
// import { db } from '@/lib/db'; // Commented out to avoid unused import warning
import { restaurantRecommendationService, UserLocation } from '@/lib/restaurantRecommendationService';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Parse request body to get user location
    const body = await request.json();
    const { location } = body as { location: UserLocation };

    if (!location || !location.latitude || !location.longitude) {
      return NextResponse.json(
        { error: 'User location is required (latitude and longitude)' },
        { status: 400 }
      );
    }

    console.log(`🚀 Processing home recommendation request for user: ${session.user.email}`);
    console.log(`📍 Location: ${location.latitude}, ${location.longitude}`);
    
    // Log the incoming location data
    console.log('\n📍 === INCOMING LOCATION DATA ===');
    console.log(JSON.stringify(location, null, 2));
    console.log('📍 === END LOCATION DATA ===\n');

    // Validate user readiness
    const validation = await restaurantRecommendationService.validateUserReadiness();
    if (!validation.ready) {
      return NextResponse.json(
        { error: validation.message },
        { status: 400 }
      );
    }

    // Fetch comprehensive restaurant recommendation data
    const recommendationData = await restaurantRecommendationService.fetchRestaurantRecommendations(location);

    // Log summary for debugging
    console.log(`📊 Recommendation data summary:`);
    console.log(`   • Total restaurants: ${recommendationData.search_metadata.total_restaurants_found}`);
    console.log(`   • Dietary queries: ${recommendationData.search_metadata.search_queries.dietary.length}`);
    console.log(`   • Preference queries: ${recommendationData.search_metadata.search_queries.preference.length}`);
    
    // Log the final API response data that would be sent to AI backend
    console.log('\n🚀 === FINAL API RESPONSE DATA FOR AI BACKEND ===');
    console.log(JSON.stringify(recommendationData, null, 2));
    console.log('🚀 === END API RESPONSE DATA ===\n');

    // TODO: Here you would send the data to your AI backend service
    // For now, we're returning the structured data that would be sent to AI
    console.log('📤 Recommendation data ready for AI processing');
    
    // In the future, you would do something like:
    // const aiRecommendations = await sendToAIBackend(recommendationData);
    // Then save the AI recommendations to database
    // await saveRecommendationsToDatabase(session.user.email, aiRecommendations);

    return NextResponse.json({
      success: true,
      message: 'Restaurant recommendation data generated successfully',
      data: recommendationData,
      // Future: This would contain AI-processed recommendations
      recommendations: {
        status: 'pending_ai_processing',
        message: 'Data collected and ready for AI recommendation processing',
        next_step: 'Send this data to AI backend for personalized recommendations'
      }
    });

  } catch (error) {
    console.error('❌ Error in home recommendation API:', error);
    
    // Return different error messages based on error type
    if (error instanceof Error) {
      if (error.message.includes('onboarding')) {
        return NextResponse.json(
          { error: 'Please complete onboarding first to get personalized recommendations' },
          { status: 400 }
        );
      }
      
      if (error.message.includes('SERP_API_KEY')) {
        return NextResponse.json(
          { error: 'Restaurant search service temporarily unavailable' },
          { status: 503 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to generate restaurant recommendations. Please try again later.' },
      { status: 500 }
    );
  }
}

// GET endpoint to check user readiness and preview search queries
export async function GET() {  
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Validate user readiness
    const validation = await restaurantRecommendationService.validateUserReadiness();
    
    // Get search queries preview
    const queriesPreview = await restaurantRecommendationService.getSearchQueriesPreview();

    return NextResponse.json({
      user_ready: validation.ready,
      message: validation.message,
      search_queries_preview: queriesPreview,
      user_email: session.user.email
    });

  } catch (error) {
    console.error('❌ Error checking recommendation readiness:', error);
    
    return NextResponse.json(
      { error: 'Failed to check recommendation readiness' },
      { status: 500 }
    );
  }
} 