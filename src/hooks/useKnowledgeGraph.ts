'use client';

import { useCallback, useState } from 'react';

interface KnowledgeGraphHook {
  loading: boolean;
  error: string | null;
  initializeGraph: () => Promise<boolean>;
  syncUserData: (additionalData?: any) => Promise<boolean>;
  recordBehavior: (type: string, action: string, context?: string, metadata?: any) => Promise<boolean>;
  getUserProfile: () => Promise<any>;
  getSimilarUsers: (limit?: number) => Promise<any[]>;
  getSemanticContext: () => Promise<string>;
  addRestaurant: (restaurantData: any) => Promise<boolean>;
  cleanup: (daysToKeep?: number) => Promise<boolean>;
}

export function useKnowledgeGraph(): KnowledgeGraphHook {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRequest = useCallback(async (action: string, data?: any, method: 'GET' | 'POST' = 'POST') => {
    setLoading(true);
    setError(null);

    try {
      let response: Response;

      if (method === 'GET') {
        const params = new URLSearchParams({ action, ...(data || {}) });
        response = await fetch(`/api/knowledge-graph?${params}`);
      } else {
        response = await fetch('/api/knowledge-graph', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ action, data }),
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Request failed');
      }

      return await response.json();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Knowledge Graph Error:', errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const initializeGraph = useCallback(async (): Promise<boolean> => {
    try {
      await handleRequest('initialize');
      return true;
    } catch {
      return false;
    }
  }, [handleRequest]);

  const syncUserData = useCallback(async (additionalData?: any): Promise<boolean> => {
    try {
      await handleRequest('sync_user', additionalData);
      return true;
    } catch {
      return false;
    }
  }, [handleRequest]);

  const recordBehavior = useCallback(async (
    type: string,
    action: string,
    context?: string,
    metadata?: any
  ): Promise<boolean> => {
    try {
      await handleRequest('record_behavior', {
        type,
        action,
        context,
        metadata,
      });
      return true;
    } catch {
      return false;
    }
  }, [handleRequest]);

  const getUserProfile = useCallback(async (): Promise<any> => {
    try {
      const result = await handleRequest('profile', null, 'GET');
      return result.profile;
    } catch {
      return null;
    }
  }, [handleRequest]);

  const getSimilarUsers = useCallback(async (limit: number = 10): Promise<any[]> => {
    try {
      const result = await handleRequest('similar_users', { limit }, 'GET');
      return result.similarUsers || [];
    } catch {
      return [];
    }
  }, [handleRequest]);

  const getSemanticContext = useCallback(async (): Promise<string> => {
    try {
      const result = await handleRequest('context', null, 'GET');
      return result.context || '';
    } catch {
      return '';
    }
  }, [handleRequest]);

  const addRestaurant = useCallback(async (restaurantData: any): Promise<boolean> => {
    try {
      await handleRequest('add_restaurant', restaurantData);
      return true;
    } catch {
      return false;
    }
  }, [handleRequest]);

  const cleanup = useCallback(async (daysToKeep: number = 90): Promise<boolean> => {
    try {
      await handleRequest('cleanup', { daysToKeep });
      return true;
    } catch {
      return false;
    }
  }, [handleRequest]);

  return {
    loading,
    error,
    initializeGraph,
    syncUserData,
    recordBehavior,
    getUserProfile,
    getSimilarUsers,
    getSemanticContext,
    addRestaurant,
    cleanup,
  };
}

// Utility hook for RAG context
export function useRAGContext() {
  const { getSemanticContext, getUserProfile, loading } = useKnowledgeGraph();
  
  const getRichContext = useCallback(async () => {
    try {
      const [context, profile] = await Promise.all([
        getSemanticContext(),
        getUserProfile()
      ]);

      return {
        semanticContext: context,
        userProfile: profile,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error getting RAG context:', error);
      return null;
    }
  }, [getSemanticContext, getUserProfile]);

  return {
    loading,
    getRichContext,
  };
} 