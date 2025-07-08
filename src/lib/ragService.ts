import { knowledgeGraph } from './knowledgeGraph';

export interface RAGContext {
  userProfile: {
    email: string;
    name?: string;
    age?: number;
    location?: string;
    demographics: {
      ageGroup?: string;
      locationDetails?: string;
    };
  };
  preferences: {
    dietaryRestrictions: string[];
    dietType?: string;
    likedFoods: Array<{ name: string; weight: number; category: string }>;
    dislikedFoods: Array<{ name: string; weight: number; category: string }>;
    healthGoals: string[];
  };
  behaviorContext: {
    recentSearches: string[];
    viewedRestaurants: string[];
    orderHistory: Array<{ restaurantId: string; items: string[]; timestamp: string }>;
    interactionPatterns: string[];
  };
  socialContext: {
    similarUsers: Array<{ email: string; sharedPreferences: number }>;
    communityTrends: string[];
  };
  semanticSummary: string;
  timestamp: string;
}

/**
 * RAG Service for generating rich context from knowledge graph
 * Optimized for AI/LLM consumption with structured, semantic data
 */
export class RAGService {
  
  /**
   * Generate comprehensive RAG context for a user
   * This context is optimized for feeding into LLMs for better recommendations
   */
  async generateRAGContext(userEmail: string): Promise<RAGContext | null> {
    try {
      console.log('🔍 Generating RAG context for user:', userEmail);

      // Get comprehensive user profile from knowledge graph
      const profile = await knowledgeGraph.getUserProfile(userEmail);
      if (!profile) {
        console.log('⚠️ No user profile found in knowledge graph');
        return null;
      }

      // Get similar users for collaborative filtering context
      const similarUsers = await knowledgeGraph.findSimilarUsers(userEmail, 5);

      // Get semantic context summary
      const semanticSummary = await knowledgeGraph.getSemanticContext(userEmail);

      // Process preferences with weights and categories
      const preferences = this.processUserPreferences(profile.preferences);

      // Extract behavioral patterns
      const behaviorContext = this.extractBehaviorPatterns(profile.recentBehaviors);

      // Build social context
      const socialContext = this.buildSocialContext(similarUsers);

      // Generate demographic context
      const demographics = this.buildDemographicContext(profile);

      const ragContext: RAGContext = {
        userProfile: {
          email: userEmail,
          name: profile.user.name,
          age: profile.user.age,
          location: profile.user.location,
          demographics,
        },
        preferences,
        behaviorContext,
        socialContext,
        semanticSummary,
        timestamp: new Date().toISOString(),
      };

      console.log('✅ Generated RAG context successfully');
      return ragContext;

    } catch (error) {
      console.error('❌ Error generating RAG context:', error);
      return null;
    }
  }

  /**
   * Generate a natural language summary optimized for LLM prompts
   */
  async generateContextSummary(userEmail: string): Promise<string> {
    const context = await this.generateRAGContext(userEmail);
    if (!context) return '';

    const summary = [
      `User Profile: ${context.userProfile.name || 'User'} (${context.userProfile.age ? `Age ${context.userProfile.age}` : 'Age unknown'}) from ${context.userProfile.location || 'unknown location'}`,
      
      context.preferences.dietType && `Diet: ${context.preferences.dietType}`,
      
      context.preferences.dietaryRestrictions.length > 0 && 
        `Dietary Restrictions: ${context.preferences.dietaryRestrictions.join(', ')}`,
      
      context.preferences.healthGoals.length > 0 && 
        `Health Goals: ${context.preferences.healthGoals.join(', ')}`,
      
      context.preferences.likedFoods.length > 0 && 
        `Favorite Foods: ${context.preferences.likedFoods.slice(0, 5).map(f => f.name).join(', ')}`,
      
      context.preferences.dislikedFoods.length > 0 && 
        `Dislikes: ${context.preferences.dislikedFoods.slice(0, 3).map(f => f.name).join(', ')}`,
      
      context.behaviorContext.recentSearches.length > 0 && 
        `Recent Interests: ${context.behaviorContext.recentSearches.slice(0, 3).join(', ')}`,
      
      context.socialContext.similarUsers.length > 0 && 
        `Similar Users Found: ${context.socialContext.similarUsers.length} users with shared preferences`,
      
      context.semanticSummary && context.semanticSummary,
      
    ].filter(Boolean).join('\n');

    return summary;
  }

  /**
   * Get contextual embeddings for vector search
   * Returns key phrases and context for semantic search
   */
  async getContextualEmbeddings(userEmail: string): Promise<string[]> {
    const context = await this.generateRAGContext(userEmail);
    if (!context) return [];

    const embeddings = [
      // User demographics
      context.userProfile.age && `age-${context.userProfile.demographics.ageGroup}`,
      context.userProfile.location && `location-${context.userProfile.location}`,
      
      // Diet and restrictions
      context.preferences.dietType && `diet-${context.preferences.dietType}`,
      ...context.preferences.dietaryRestrictions.map(r => `restriction-${r}`),
      ...context.preferences.healthGoals.map(g => `goal-${g}`),
      
      // Food preferences with weights
      ...context.preferences.likedFoods
        .filter(f => f.weight >= 4)
        .map(f => `likes-${f.name}-${f.category}`),
      
      ...context.preferences.dislikedFoods
        .filter(f => f.weight <= 2)
        .map(f => `dislikes-${f.name}-${f.category}`),
      
      // Behavioral context
      ...context.behaviorContext.recentSearches.map(s => `search-${s}`),
      ...context.behaviorContext.viewedRestaurants.slice(0, 5).map(r => `viewed-${r}`),
      
      // Social context
      ...context.socialContext.communityTrends.map(t => `trend-${t}`),
      
    ].filter(Boolean) as string[];

    return [...new Set(embeddings)]; // Remove duplicates
  }

  /**
   * Generate restaurant recommendation context
   * Includes user preferences and constraints for restaurant filtering
   */
  async getRestaurantRecommendationContext(userEmail: string): Promise<{
    mustHave: string[];
    mustAvoid: string[];
    preferences: Array<{ item: string; weight: number }>;
    contextSummary: string;
  }> {
    const context = await this.generateRAGContext(userEmail);
    if (!context) {
      return { mustHave: [], mustAvoid: [], preferences: [], contextSummary: '' };
    }

    const mustHave = [
      ...context.preferences.dietaryRestrictions.map(r => `must-accommodate-${r}`),
      context.preferences.dietType && `must-support-${context.preferences.dietType}`,
    ].filter(Boolean) as string[];

    const mustAvoid = context.preferences.dislikedFoods
      .filter(f => f.weight <= 2)
      .map(f => f.name);

    const preferences = [
      ...context.preferences.likedFoods.map(f => ({ item: f.name, weight: f.weight })),
      ...context.preferences.healthGoals.map(g => ({ item: g, weight: 4 })),
    ];

    const contextSummary = await this.generateContextSummary(userEmail);

    return {
      mustHave,
      mustAvoid,
      preferences,
      contextSummary,
    };
  }

  /**
   * Process user preferences from knowledge graph data
   */
  private processUserPreferences(preferences: any[] = []) {
    const likedFoods = preferences
      .filter(p => p.type === 'food' && p.weight >= 3)
      .map(p => ({ name: p.value, weight: p.weight, category: p.category }));

    const dislikedFoods = preferences
      .filter(p => p.type === 'food' && p.weight <= 2)
      .map(p => ({ name: p.value, weight: p.weight, category: p.category }));

    const dietaryRestrictions = preferences
      .filter(p => p.type === 'dietary')
      .map(p => p.value);

    const healthGoals = preferences
      .filter(p => p.type === 'health')
      .map(p => p.value);

    const dietType = preferences
      .find(p => p.category === 'diet_type')?.value;

    return {
      dietaryRestrictions,
      dietType,
      likedFoods,
      dislikedFoods,
      healthGoals,
    };
  }

  /**
   * Extract behavioral patterns from recent user activities
   */
  private extractBehaviorPatterns(recentBehaviors: any[] = []) {
    const searches = recentBehaviors
      .filter(b => b.type === 'search')
      .map(b => b.action)
      .slice(0, 10);

    const viewedRestaurants = recentBehaviors
      .filter(b => b.type === 'view' && b.action === 'restaurant_view')
      .map(b => b.context)
      .slice(0, 10);

    const orderHistory = recentBehaviors
      .filter(b => b.type === 'order')
      .map(b => ({
        restaurantId: b.context,
        items: b.metadata?.items || [],
        timestamp: b.timestamp,
      }))
      .slice(0, 5);

    const interactionPatterns = recentBehaviors
      .filter(b => b.type === 'interaction')
      .map(b => `${b.action}-${b.context}`)
      .slice(0, 10);

    return {
      recentSearches: searches,
      viewedRestaurants,
      orderHistory,
      interactionPatterns,
    };
  }

  /**
   * Build social context from similar users
   */
  private buildSocialContext(similarUsers: any[] = []) {
    const communityTrends = similarUsers
      .flatMap(user => user.allPreferences || [])
      .reduce((acc: Record<string, number>, pref: string) => {
        acc[pref] = (acc[pref] || 0) + 1;
        return acc;
      }, {});

    const topTrends = Object.entries(communityTrends)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, 5)
      .map(([trend]) => trend);

    return {
      similarUsers: similarUsers.map(user => ({
        email: user.email,
        sharedPreferences: user.sharedPreferences,
      })),
      communityTrends: topTrends,
    };
  }

  /**
   * Build demographic context
   */
  private buildDemographicContext(profile: any) {
    return {
      ageGroup: profile.ageGroups?.[0],
      locationDetails: profile.locations?.join(', '),
    };
  }
}

// Export singleton instance
export const ragService = new RAGService(); 