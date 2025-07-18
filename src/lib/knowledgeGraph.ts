import neo4j, { Driver, Session } from 'neo4j-driver';
import { getUserOnboardingData, UserOnboardingData } from './onboarding';

// Environment variables with fallbacks
const NEO4J_URI = process.env.NEO4J_URI || 'neo4j://localhost:7687';
const NEO4J_USERNAME = process.env.NEO4J_USERNAME || 'neo4j';
const NEO4J_PASSWORD = process.env.NEO4J_PASSWORD || 'password';
const NEO4J_DATABASE = process.env.NEO4J_DATABASE || 'neo4j';

// Singleton driver instance
let driver: Driver | null = null;

/**
 * Get or create Neo4j driver instance
 */
function getDriver(): Driver {
  if (!driver) {
    driver = neo4j.driver(
      NEO4J_URI,
      neo4j.auth.basic(NEO4J_USERNAME, NEO4J_PASSWORD),
      {
        // Optimized for fast queries and RAG performance
        maxConnectionPoolSize: 50,
        connectionAcquisitionTimeout: 30000,
        connectionTimeout: 30000,
        disableLosslessIntegers: true, // Use native JS numbers for better performance
      }
    );
  }
  return driver;
}

/**
 * Get a new session
 */
function getSession(): Session {
  return getDriver().session({ database: NEO4J_DATABASE });
}

/**
 * Close the driver connection
 */
export async function closeDriver(): Promise<void> {
  if (driver) {
    await driver.close();
    driver = null;
  }
}

// Data structures for knowledge graph
export interface UserNode {
  userId: string;
  email: string;
  name?: string;
  age?: number;
  location?: string;
  gender?: string;
  onboardingCompleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PreferenceNode {
  preferenceId: string;
  type: 'food' | 'dietary' | 'health' | 'custom';
  category: string;
  value: string;
  weight: number;
  source: string;
  createdAt: Date;
}

export interface BehaviorNode {
  behaviorId: string;
  type: 'order' | 'view' | 'search' | 'interaction';
  action: string;
  context?: string;
  metadata?: { [key: string]: unknown };
  timestamp: Date;
}

export interface RestaurantNode {
  restaurantId: string;
  name: string;
  cuisine: string;
  location: string;
  rating?: number;
  priceRange?: string;
  features: string[];
}

/**
 * Knowledge Graph Service for managing user data in Neo4j
 * Optimized for RAG model queries with fast retrieval and semantic relationships
 */
export class KnowledgeGraphService {
  
  /**
   * Initialize the knowledge graph with constraints and indexes for optimal performance
   */
  async initialize(): Promise<void> {
    const session = getSession();
    
    try {
      // Create constraints and indexes for fast lookups
      const constraints = [
        'CREATE CONSTRAINT user_id_unique IF NOT EXISTS FOR (u:User) REQUIRE u.userId IS UNIQUE',
        'CREATE CONSTRAINT preference_id_unique IF NOT EXISTS FOR (p:Preference) REQUIRE p.preferenceId IS UNIQUE',
        'CREATE CONSTRAINT behavior_id_unique IF NOT EXISTS FOR (b:Behavior) REQUIRE b.behaviorId IS UNIQUE',
        'CREATE CONSTRAINT restaurant_id_unique IF NOT EXISTS FOR (r:Restaurant) REQUIRE r.restaurantId IS UNIQUE',
      ];

      const indexes = [
        // Text indexes for semantic search (RAG optimization)
        'CREATE TEXT INDEX user_search_index IF NOT EXISTS FOR (u:User) ON (u.name, u.location)',
        'CREATE TEXT INDEX preference_search_index IF NOT EXISTS FOR (p:Preference) ON (p.value, p.category)',
        'CREATE TEXT INDEX restaurant_search_index IF NOT EXISTS FOR (r:Restaurant) ON (r.name, r.cuisine, r.location)',
        
        // Range indexes for fast filtering
        'CREATE RANGE INDEX user_age_index IF NOT EXISTS FOR (u:User) ON (u.age)',
        'CREATE RANGE INDEX preference_weight_index IF NOT EXISTS FOR (p:Preference) ON (p.weight)',
        'CREATE RANGE INDEX behavior_timestamp_index IF NOT EXISTS FOR (b:Behavior) ON (b.timestamp)',
        'CREATE RANGE INDEX restaurant_rating_index IF NOT EXISTS FOR (r:Restaurant) ON (r.rating)',
        
        // Point indexes for location-based queries
        'CREATE POINT INDEX user_location_index IF NOT EXISTS FOR (u:User) ON (u.locationPoint)',
        'CREATE POINT INDEX restaurant_location_index IF NOT EXISTS FOR (r:Restaurant) ON (r.locationPoint)',
      ];

      // Execute constraints first
      for (const constraint of constraints) {
        try {
          await session.run(constraint);
          console.log(`✅ Created constraint: ${constraint.split(' ')[2]}`);
        } catch (error: any) {
          if (error.code !== 'Neo.ClientError.Schema.EquivalentSchemaRuleAlreadyExists') {
            console.error(`❌ Error creating constraint: ${error.message}`);
          }
        }
      }

      // Execute indexes
      for (const index of indexes) {
        try {
          await session.run(index);
          console.log(`✅ Created index: ${index.split(' ')[2]}`);
        } catch (error: any) {
          if (error.code !== 'Neo.ClientError.Schema.EquivalentSchemaRuleAlreadyExists') {
            console.error(`❌ Error creating index: ${error.message}`);
          }
        }
      }

    } catch (error) {
      console.error('❌ Error initializing knowledge graph:', error);
      throw error;
    } finally {
      await session.close();
    }
  }

  /**
   * Create or update user node with comprehensive profile data
   */
  async createOrUpdateUser(userEmail: string, additionalData?: Partial<UserNode>): Promise<void> {
    const session = getSession();
    
    try {
      const onboardingData = await getUserOnboardingData(userEmail);
      
      if (!onboardingData) {
        console.log(`⚠️ No onboarding data found for user: ${userEmail}`);
        return;
      }

      const { user } = onboardingData;
      const userData = {
        email: userEmail,
        name: user.profile.name,
        age: user.profile.age,
        location: user.profile.location,
        onboardingCompleted: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...additionalData
      };

      // Create/update user node
      await session.run(`
        MERGE (u:User {email: $email})
        SET u += $userData
        SET u.userId = CASE WHEN u.userId IS NULL THEN randomUUID() ELSE u.userId END
        SET u.updatedAt = datetime()
      `, { email: userEmail, userData });

      // Process dietary preferences
      await this.createUserPreferences(userEmail, onboardingData);

      // Create demographic relationships for better RAG context
      await this.createDemographicRelationships(userEmail, userData);

      console.log(`✅ Created/updated user node for: ${userEmail}`);

    } catch (error) {
      console.error('❌ Error creating/updating user:', error);
      throw error;
    } finally {
      await session.close();
    }
  }

  /**
   * Create user preferences as separate nodes with relationships
   * Optimized for RAG semantic search
   */
  private async createUserPreferences(userEmail: string, onboardingData: UserOnboardingData): Promise<void> {
    const session = getSession();
    const { user } = onboardingData;

    try {
      // Process food preferences
      const foodPreferences = Object.entries(user.preferences.foods).map(([food, pref]) => ({
        type: 'food',
        category: pref.category,
        value: food,
        weight: pref.weight,
        preference: pref.preference,
        source: 'onboarding'
      }));

      // Process custom likes
      const customLikes = user.preferences.customLikes.map(like => ({
        type: 'custom',
        category: 'liked_food',
        value: like.food,
        weight: like.weight,
        preference: like.preference,
        source: like.source
      }));

      // Process custom dislikes
      const customDislikes = user.preferences.customDislikes.map(dislike => ({
        type: 'custom',
        category: 'disliked_food',
        value: dislike.food,
        weight: dislike.weight,
        preference: dislike.preference,
        source: dislike.source
      }));

      // Process dietary restrictions
      const dietaryRestrictions = user.dietary.restrictions.map(restriction => ({
        type: 'dietary',
        category: restriction.type,
        value: restriction.value,
        weight: 5, // High importance for restrictions
        preference: 'restriction',
        source: 'onboarding'
      }));

      // Process health goals
      const healthGoals = user.dietary.goals.map(goal => ({
        type: 'health',
        category: 'goal',
        value: goal,
        weight: 4,
        preference: 'goal',
        source: 'onboarding'
      }));

      const allPreferences = [
        ...foodPreferences,
        ...customLikes,
        ...customDislikes,
        ...dietaryRestrictions,
        ...healthGoals
      ];

      // Batch create preferences
      await session.run(`
        MATCH (u:User {email: $email})
        UNWIND $preferences AS pref
        MERGE (p:Preference {
          type: pref.type,
          category: pref.category,
          value: pref.value
        })
        SET p.preferenceId = CASE WHEN p.preferenceId IS NULL THEN randomUUID() ELSE p.preferenceId END
        SET p.weight = pref.weight
        SET p.preference = pref.preference
        SET p.source = pref.source
        SET p.createdAt = CASE WHEN p.createdAt IS NULL THEN datetime() ELSE p.createdAt END
        SET p.updatedAt = datetime()
        
        MERGE (u)-[rel:HAS_PREFERENCE]->(p)
        SET rel.strength = pref.weight
        SET rel.createdAt = CASE WHEN rel.createdAt IS NULL THEN datetime() ELSE rel.createdAt END
        SET rel.updatedAt = datetime()
      `, { email: userEmail, preferences: allPreferences });

      // Create diet type relationship if exists
      if (user.dietary.type) {
        await session.run(`
          MATCH (u:User {email: $email})
          MERGE (d:DietType {name: $dietType})
          MERGE (u)-[rel:FOLLOWS_DIET]->(d)
          SET rel.createdAt = CASE WHEN rel.createdAt IS NULL THEN datetime() ELSE rel.createdAt END
        `, { email: userEmail, dietType: user.dietary.type });
      }

      console.log(`✅ Created ${allPreferences.length} preference nodes for user`);

    } catch (error) {
      console.error('❌ Error creating user preferences:', error);
      throw error;
    } finally {
      await session.close();
    }
  }

  /**
   * Create demographic relationships for better user clustering and RAG context
   */
  private async createDemographicRelationships(userEmail: string, userData: any): Promise<void> {
    const session = getSession();

    try {
      // Create age group relationships
      if (userData.age) {
        const ageGroup = this.getAgeGroup(userData.age);
        await session.run(`
          MATCH (u:User {email: $email})
          MERGE (ag:AgeGroup {name: $ageGroup})
          MERGE (u)-[rel:BELONGS_TO_AGE_GROUP]->(ag)
          SET rel.createdAt = CASE WHEN rel.createdAt IS NULL THEN datetime() ELSE rel.createdAt END
        `, { email: userEmail, ageGroup });
      }

      // Create location relationships
      if (userData.location) {
        await session.run(`
          MATCH (u:User {email: $email})
          MERGE (loc:Location {name: $location})
          MERGE (u)-[rel:LIVES_IN]->(loc)
          SET rel.createdAt = CASE WHEN rel.createdAt IS NULL THEN datetime() ELSE rel.createdAt END
        `, { email: userEmail, location: userData.location });
      }

    } catch (error) {
      console.error('❌ Error creating demographic relationships:', error);
      throw error;
    } finally {
      await session.close();
    }
  }

  /**
   * Record user behavior for learning and recommendation improvements
   */
  async recordUserBehavior(
    userEmail: string,
    behaviorType: 'order' | 'view' | 'search' | 'interaction',
    action: string,
    context?: string,
    metadata?: { [key: string]: any }
  ): Promise<void> {
    const session = getSession();

    try {
      await session.run(`
        MATCH (u:User {email: $email})
        CREATE (b:Behavior {
          behaviorId: randomUUID(),
          type: $type,
          action: $action,
          context: $context,
          metadata: $metadata,
          timestamp: datetime()
        })
        CREATE (u)-[rel:PERFORMED]->(b)
        SET rel.timestamp = datetime()
      `, {
        email: userEmail,
        type: behaviorType,
        action,
        context: context || null,
        metadata: metadata ? JSON.stringify(metadata) : null
      });

      console.log(`✅ Recorded ${behaviorType} behavior for user: ${action}`);

    } catch (error) {
      console.error('❌ Error recording user behavior:', error);
      throw error;
    } finally {
      await session.close();
    }
  }

  /**
   * Create restaurant nodes and relationships for recommendations
   */
  async createRestaurantNode(restaurantData: {
    id: string;
    name: string;
    cuisine: string;
    location: string;
    rating?: number;
    priceRange?: string;
    features?: string[];
    coordinates?: { lat: number; lng: number };
  }): Promise<void> {
    const session = getSession();

    try {
      const locationPoint = restaurantData.coordinates
        ? `point({latitude: ${restaurantData.coordinates.lat}, longitude: ${restaurantData.coordinates.lng}})`
        : null;

      await session.run(`
        MERGE (r:Restaurant {restaurantId: $id})
        SET r.name = $name
        SET r.cuisine = $cuisine
        SET r.location = $location
        SET r.rating = $rating
        SET r.priceRange = $priceRange
        SET r.features = $features
        ${locationPoint ? 'SET r.locationPoint = ' + locationPoint : ''}
        SET r.createdAt = CASE WHEN r.createdAt IS NULL THEN datetime() ELSE r.createdAt END
        SET r.updatedAt = datetime()
      `, {
        id: restaurantData.id,
        name: restaurantData.name,
        cuisine: restaurantData.cuisine,
        location: restaurantData.location,
        rating: restaurantData.rating,
        priceRange: restaurantData.priceRange,
        features: restaurantData.features || []
      });

      // Create cuisine type relationships for better categorization
      await session.run(`
        MATCH (r:Restaurant {restaurantId: $id})
        MERGE (c:Cuisine {name: $cuisine})
        MERGE (r)-[rel:SERVES_CUISINE]->(c)
        SET rel.createdAt = CASE WHEN rel.createdAt IS NULL THEN datetime() ELSE rel.createdAt END
      `, { id: restaurantData.id, cuisine: restaurantData.cuisine });

      console.log(`✅ Created restaurant node: ${restaurantData.name}`);

    } catch (error) {
      console.error('❌ Error creating restaurant node:', error);
      throw error;
    } finally {
      await session.close();
    }
  }

  /**
   * Get user's comprehensive profile for RAG context
   * Optimized query for fast retrieval
   */
  async getUserProfile(userEmail: string): Promise<any> {
    const session = getSession();

    try {
      const result = await session.run(`
        MATCH (u:User {email: $email})
        OPTIONAL MATCH (u)-[:HAS_PREFERENCE]->(p:Preference)
        OPTIONAL MATCH (u)-[:FOLLOWS_DIET]->(d:DietType)
        OPTIONAL MATCH (u)-[:BELONGS_TO_AGE_GROUP]->(ag:AgeGroup)
        OPTIONAL MATCH (u)-[:LIVES_IN]->(loc:Location)
        OPTIONAL MATCH (u)-[:PERFORMED]->(b:Behavior)
        WHERE b.timestamp >= datetime() - duration('P30D') // Last 30 days
        
        RETURN u as user,
               collect(DISTINCT p) as preferences,
               collect(DISTINCT d.name) as dietTypes,
               collect(DISTINCT ag.name) as ageGroups,
               collect(DISTINCT loc.name) as locations,
               collect(DISTINCT {
                 type: b.type,
                 action: b.action,
                 timestamp: b.timestamp
               }) as recentBehaviors
      `, { email: userEmail });

      if (result.records.length === 0) {
        return null;
      }

      const record = result.records[0];
      return {
        user: record.get('user').properties,
        preferences: record.get('preferences').map((p: any) => p.properties),
        dietTypes: record.get('dietTypes'),
        ageGroups: record.get('ageGroups'),
        locations: record.get('locations'),
        recentBehaviors: record.get('recentBehaviors')
      };

    } catch (error) {
      console.error('❌ Error getting user profile:', error);
      throw error;
    } finally {
      await session.close();
    }
  }

  /**
   * Find similar users for collaborative filtering
   * Optimized for RAG recommendations
   */
  async findSimilarUsers(userEmail: string, limit: number = 10): Promise<any[]> {
    const session = getSession();

    try {
      const result = await session.run(`
        MATCH (u1:User {email: $email})-[:HAS_PREFERENCE]->(p:Preference)<-[:HAS_PREFERENCE]-(u2:User)
        WHERE u1 <> u2
        WITH u2, count(p) as sharedPreferences, 
             collect(DISTINCT p.value) as commonPreferences
        ORDER BY sharedPreferences DESC
        LIMIT $limit
        
        MATCH (u2)-[:HAS_PREFERENCE]->(allPrefs:Preference)
        RETURN u2.email as email,
               u2.name as name,
               sharedPreferences,
               commonPreferences,
               collect(DISTINCT allPrefs.value) as allPreferences
      `, { email: userEmail, limit });

      return result.records.map(record => ({
        email: record.get('email'),
        name: record.get('name'),
        sharedPreferences: record.get('sharedPreferences'),
        commonPreferences: record.get('commonPreferences'),
        allPreferences: record.get('allPreferences')
      }));

    } catch (error) {
      console.error('❌ Error finding similar users:', error);
      throw error;
    } finally {
      await session.close();
    }
  }

  /**
   * Get semantic context for RAG model - optimized for fast retrieval
   */
  async getSemanticContext(userEmail: string): Promise<string> {
    const profile = await this.getUserProfile(userEmail);
    
    if (!profile) {
      return 'No user profile found';
    }

    const { user, preferences, dietTypes, recentBehaviors } = profile;
    
    // Build semantic context string optimized for LLM understanding
    const contextParts = [
      `User Profile: ${user.name || 'Anonymous'}, ${user.age ? user.age + ' years old' : 'age unknown'}`,
      user.location ? `Location: ${user.location}` : '',
      dietTypes.length > 0 ? `Diet: ${dietTypes.join(', ')}` : '',
      
      // Food preferences
      preferences.filter((p: any) => p.type === 'food' && p.preference === 'like')
        .map((p: any) => `Likes ${p.value} (${p.category})`).join(', '),
      
      preferences.filter((p: any) => p.type === 'food' && p.preference === 'dislike')
        .map((p: any) => `Dislikes ${p.value}`).join(', '),
      
      // Dietary restrictions
      preferences.filter((p: any) => p.type === 'dietary')
        .map((p: any) => `${p.category}: ${p.value}`).join(', '),
      
      // Recent behaviors
      recentBehaviors.length > 0 
        ? `Recent activity: ${recentBehaviors.slice(0, 5).map((b: any) => b.action).join(', ')}`
        : ''
    ];

    return contextParts.filter(part => part.length > 0).join('. ');
  }

  /**
   * Generate a comprehensive user pattern summary for RAG context
   * This function creates a natural language summary of user habits and preferences
   */
  async getUserPatternSummary(userId: string): Promise<string> {
    const session = getSession();

    try {
      // Comprehensive query to gather all user patterns
      const result = await session.run(`
        MATCH (u:User)
        WHERE u.userId = $userId OR u.email = $userId
        
        // Get basic profile
        OPTIONAL MATCH (u)-[:BELONGS_TO_AGE_GROUP]->(ag:AgeGroup)
        OPTIONAL MATCH (u)-[:LIVES_IN]->(loc:Location)
        OPTIONAL MATCH (u)-[:FOLLOWS_DIET]->(diet:DietType)
        
        // Get preferences with weights
        OPTIONAL MATCH (u)-[pref_rel:HAS_PREFERENCE]->(pref:Preference)
        
        // Get recent behaviors (last 30 days)
        OPTIONAL MATCH (u)-[:PERFORMED]->(behavior:Behavior)
        WHERE behavior.timestamp >= datetime() - duration('P30D')
        
        // Get frequently visited restaurants
        OPTIONAL MATCH (u)-[:PERFORMED]->(order_behavior:Behavior {type: 'order'})-[:AT_RESTAURANT]->(rest:Restaurant)
        WHERE order_behavior.timestamp >= datetime() - duration('P90D')
        
        // Get time patterns
        OPTIONAL MATCH (u)-[:PERFORMED]->(time_behavior:Behavior)
        WHERE time_behavior.timestamp >= datetime() - duration('P30D')
        
        WITH u, 
             collect(DISTINCT ag.name) as ageGroups,
             collect(DISTINCT loc.name) as locations,
             collect(DISTINCT diet.name) as diets,
             collect(DISTINCT {
               type: pref.type,
               category: pref.category,
               value: pref.value,
               weight: pref_rel.strength,
               preference: pref.preference
             }) as preferences,
             collect(DISTINCT {
               type: behavior.type,
               action: behavior.action,
               timestamp: behavior.timestamp,
               metadata: behavior.metadata
             }) as behaviors,
             collect(DISTINCT {
               name: rest.name,
               cuisine: rest.cuisine,
               count: count(rest)
             }) as favoriteRestaurants,
             collect(DISTINCT {
               hour: toInteger(datetime(time_behavior.timestamp).hour),
               dayOfWeek: toInteger(datetime(time_behavior.timestamp).dayOfWeek)
             }) as timingPatterns
        
        RETURN u.name as userName,
               u.age as userAge,
               u.email as userEmail,
               ageGroups,
               locations,
               diets,
               preferences,
               behaviors,
               favoriteRestaurants,
               timingPatterns
      `, { userId });

      if (result.records.length === 0) {
        return `No user pattern data found for user ID: ${userId}`;
      }

      const record = result.records[0];
      const userName = record.get('userName') || 'User';
      const userAge = record.get('userAge');
      const locations = record.get('locations');
      const diets = record.get('diets');
      const preferences = record.get('preferences');
      const behaviors = record.get('behaviors');
      const favoriteRestaurants = record.get('favoriteRestaurants');
      const timingPatterns = record.get('timingPatterns');

      // Build natural language summary
      const summaryParts: string[] = [];

      // Basic profile
      summaryParts.push(`${userName} is ${userAge ? `a ${userAge}-year-old` : 'a user'} ${locations.length > 0 ? `from ${locations[0]}` : ''}.`);

      // Dietary preferences
      if (diets.length > 0) {
        summaryParts.push(`They follow a ${diets.join(' and ')} diet.`);
      }

      // Food preferences
      const likes = preferences.filter((p: any) => p.preference === 'like' && p.type === 'food');
      const dislikes = preferences.filter((p: any) => p.preference === 'dislike' && p.type === 'food');
      const restrictions = preferences.filter((p: any) => p.type === 'dietary');

      if (likes.length > 0) {
        const topLikes = likes
          .sort((a: any, b: any) => b.weight - a.weight)
          .slice(0, 5)
          .map((p: any) => p.value);
        summaryParts.push(`They particularly enjoy ${topLikes.join(', ')}.`);
      }

      if (dislikes.length > 0) {
        const topDislikes = dislikes
          .slice(0, 3)
          .map((p: any) => p.value);
        summaryParts.push(`They avoid ${topDislikes.join(', ')}.`);
      }

      if (restrictions.length > 0) {
        const restrictionText = restrictions
          .map((r: any) => `${r.category}: ${r.value}`)
          .join(', ');
        summaryParts.push(`Dietary restrictions include ${restrictionText}.`);
      }

      // Behavior patterns
      const orderBehaviors = behaviors.filter((b: any) => b.type === 'order');
      const searchBehaviors = behaviors.filter((b: any) => b.type === 'search');

      if (orderBehaviors.length > 0) {
        summaryParts.push(`They have placed ${orderBehaviors.length} orders in the last 30 days.`);
      }

      // Favorite restaurants
      if (favoriteRestaurants.length > 0) {
        const topRestaurants = favoriteRestaurants
          .sort((a: any, b: any) => b.count - a.count)
          .slice(0, 3)
          .map((r: any) => `${r.name} (${r.cuisine})`);
        summaryParts.push(`Frequently orders from ${topRestaurants.join(', ')}.`);
      }

      // Timing patterns
      if (timingPatterns.length > 5) {
        const hourCounts: { [key: number]: number } = {};
        const dayCounts: { [key: number]: number } = {};

        timingPatterns.forEach((tp: any) => {
          hourCounts[tp.hour] = (hourCounts[tp.hour] || 0) + 1;
          dayCounts[tp.dayOfWeek] = (dayCounts[tp.dayOfWeek] || 0) + 1;
        });

        // Find peak hours
        const peakHours = Object.entries(hourCounts)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 2)
          .map(([hour]) => {
            const h = parseInt(hour);
            if (h < 12) return `${h}AM`;
            else if (h === 12) return '12PM';
            else return `${h - 12}PM`;
          });

        if (peakHours.length > 0) {
          summaryParts.push(`Usually orders around ${peakHours.join(' and ')}.`);
        }

        // Find peak days
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const peakDays = Object.entries(dayCounts)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 2)
          .map(([day]) => dayNames[parseInt(day) - 1]);

        if (peakDays.length > 0) {
          summaryParts.push(`Most active on ${peakDays.join(' and ')}.`);
        }
      }

      // Recent search patterns
      if (searchBehaviors.length > 0) {
        const recentSearches = searchBehaviors
          .slice(0, 3)
          .map((s: any) => s.action);
        summaryParts.push(`Recently searched for: ${recentSearches.join(', ')}.`);
      }

      return summaryParts.join(' ');

    } catch (error) {
      console.error('❌ Error generating user pattern summary:', error);
      throw error;
    } finally {
      await session.close();
    }
  }

  /**
   * Cleanup old behaviors to maintain performance
   */
  async cleanupOldBehaviors(daysToKeep: number = 90): Promise<void> {
    const session = getSession();

    try {
      await session.run(`
        MATCH (b:Behavior)
        WHERE b.timestamp < datetime() - duration({days: $days})
        DETACH DELETE b
      `, { days: daysToKeep });

      console.log(`✅ Cleaned up behaviors older than ${daysToKeep} days`);

    } catch (error) {
      console.error('❌ Error cleaning up old behaviors:', error);
      throw error;
    } finally {
      await session.close();
    }
  }

  /**
   * Helper function to categorize age groups
   */
  private getAgeGroup(age: number): string {
    if (age < 18) return 'Under 18';
    if (age < 25) return '18-24';
    if (age < 35) return '25-34';
    if (age < 45) return '35-44';
    if (age < 55) return '45-54';
    if (age < 65) return '55-64';
    return '65+';
  }
}

// Export singleton instance
export const knowledgeGraph = new KnowledgeGraphService(); 