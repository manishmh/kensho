"use client";

import { useKnowledgeGraph } from "@/hooks/useKnowledgeGraph";
import { usePathname } from "next/navigation";
import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useRef,
} from "react";

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
  const lastTrackedPath = useRef<string | null>(null);
  const {
    recordBehavior: recordBehaviorHook,
    syncUserData: syncUserDataHook,
    loading,
    error,
  } = useKnowledgeGraph();

  // Auto-track page views (with throttling to prevent excessive calls)
  useEffect(() => {
    if (pathname && pathname !== lastTrackedPath.current) {
      lastTrackedPath.current = pathname;

      // Debounce page view tracking
      const timeoutId = setTimeout(() => {
        recordBehaviorHook("view", "page_view", pathname, {
          timestamp: new Date().toISOString(),
          userAgent:
            typeof navigator !== "undefined" ? navigator.userAgent : "unknown",
          referrer:
            typeof document !== "undefined" ? document.referrer : "unknown",
        }).catch((error) => {
          console.warn("Failed to track page view:", error);
          // Don't throw or show user-facing errors for tracking failures
        });
      }, 500); // 500ms debounce

      return () => clearTimeout(timeoutId);
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
      console.warn("Failed to record behavior:", error);
      // Silent fail - don't let tracking errors affect user experience
    }
  };

  const syncUserData = async (additionalData?: any) => {
    try {
      await syncUserDataHook(additionalData);
    } catch (error) {
      console.warn("Failed to sync user data:", error);
      // Silent fail - don't let sync errors affect user experience
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
      // Use a timeout to avoid blocking component rendering
      const timeoutId = setTimeout(() => {
        recordBehavior(behaviorType, action, undefined, {
          componentName: Component.displayName || Component.name,
          props: Object.keys(props),
        }).catch((error) => {
          console.warn("Component behavior tracking failed:", error);
        });
      }, 100);

      return () => clearTimeout(timeoutId);
    }, [recordBehavior, props]);

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
    }).catch((error) => {
      console.warn("Search tracking failed:", error);
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
    }).catch((error) => {
      console.warn("Restaurant view tracking failed:", error);
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
    }).catch((error) => {
      console.warn("Order tracking failed:", error);
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
    }).catch((error) => {
      console.warn("Preference tracking failed:", error);
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
    ).catch((error) => {
      console.warn("Recommendation tracking failed:", error);
    });
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
