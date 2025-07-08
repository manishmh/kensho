"use client";

import { useKnowledgeGraph } from "@/hooks/useKnowledgeGraph";
import { usePathname } from "next/navigation";
import React, { createContext, ReactNode, useContext, useEffect } from "react";

interface KnowledgeGraphContextType {
  recordBehavior: (
    type: string,
    action: string,
    context?: string,
    metadata?: any
  ) => Promise<void>;
  syncUserData: (additionalData?: any) => Promise<void>;
  loading: boolean;
  error: string | null;
}

const KnowledgeGraphContext = createContext<KnowledgeGraphContextType | null>(
  null
);

interface KnowledgeGraphProviderProps {
  children: ReactNode;
}

export function KnowledgeGraphProvider({
  children,
}: KnowledgeGraphProviderProps) {
  const pathname = usePathname();
  const {
    recordBehavior: recordBehaviorHook,
    syncUserData: syncUserDataHook,
    loading,
    error,
  } = useKnowledgeGraph();

  // Auto-track page views
  useEffect(() => {
    if (pathname) {
      recordBehaviorHook("view", "page_view", pathname, {
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        referrer: document.referrer,
      }).catch(console.error);
    }
  }, [pathname, recordBehaviorHook]);

  const recordBehavior = async (
    type: string,
    action: string,
    context?: string,
    metadata?: any
  ) => {
    try {
      await recordBehaviorHook(type, action, context, {
        ...metadata,
        timestamp: new Date().toISOString(),
        pathname,
      });
    } catch (error) {
      console.error("Failed to record behavior:", error);
    }
  };

  const syncUserData = async (additionalData?: any) => {
    try {
      await syncUserDataHook(additionalData);
    } catch (error) {
      console.error("Failed to sync user data:", error);
    }
  };

  return (
    <KnowledgeGraphContext.Provider
      value={{
        recordBehavior,
        syncUserData,
        loading,
        error,
      }}
    >
      {children}
    </KnowledgeGraphContext.Provider>
  );
}

export function useKnowledgeGraphContext() {
  const context = useContext(KnowledgeGraphContext);
  if (!context) {
    throw new Error(
      "useKnowledgeGraphContext must be used within a KnowledgeGraphProvider"
    );
  }
  return context;
}

// HOC for automatic behavior tracking
export function withBehaviorTracking<T extends Record<string, any>>(
  Component: React.ComponentType<T>,
  behaviorType: string,
  action: string
) {
  return function BehaviorTrackedComponent(props: T) {
    const { recordBehavior } = useKnowledgeGraphContext();

    useEffect(() => {
      recordBehavior(behaviorType, action, undefined, {
        componentName: Component.displayName || Component.name,
        props: Object.keys(props),
      });
    }, [recordBehavior]);

    return <Component {...props} />;
  };
}

// Hook for manual behavior tracking with common patterns
export function useBehaviorTracker() {
  const { recordBehavior } = useKnowledgeGraphContext();

  const trackSearch = (query: string, filters?: any, results?: number) => {
    recordBehavior("search", "search_query", query, {
      filters,
      resultsCount: results,
    });
  };

  const trackRestaurantView = (
    restaurantId: string,
    restaurantName: string,
    source?: string
  ) => {
    recordBehavior("view", "restaurant_view", restaurantId, {
      restaurantName,
      source,
    });
  };

  const trackOrder = (restaurantId: string, items: any[], total?: number) => {
    recordBehavior("order", "place_order", restaurantId, {
      itemCount: items.length,
      items: items.map((item) => ({
        name: item.name,
        category: item.category,
        price: item.price,
      })),
      total,
    });
  };

  const trackPreferenceUpdate = (
    preferenceType: string,
    oldValue: any,
    newValue: any
  ) => {
    recordBehavior("interaction", "preference_update", preferenceType, {
      oldValue,
      newValue,
      changeType: oldValue ? "update" : "create",
    });
  };

  const trackRecommendationInteraction = (
    action: "view" | "click" | "dismiss",
    recommendationId: string,
    restaurantId?: string
  ) => {
    recordBehavior(
      "interaction",
      `recommendation_${action}`,
      recommendationId,
      {
        restaurantId,
      }
    );
  };

  return {
    trackSearch,
    trackRestaurantView,
    trackOrder,
    trackPreferenceUpdate,
    trackRecommendationInteraction,
    recordBehavior,
  };
}
