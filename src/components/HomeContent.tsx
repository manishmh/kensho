"use client";

import { RecommendationData } from "@/lib/restaurantRecommendationService";
import {
  clearExpiredCache,
  setCachedRecommendations,
  setLikedRestaurants,
} from "@/redux/features/restaurants/restaurantSlice";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import React, { useCallback, useEffect, useState } from "react";
import { FiRefreshCw, FiSettings } from "react-icons/fi";
import { toast } from "sonner";
import { useKnowledgeGraphContext } from "./KnowledgeGraphProvider";
import LocationOnboarding from "./LocationOnboarding";
import LocationSelector from "./LocationSelector";
import RestaurantSections from "./RestaurantSections";

const HomeContent: React.FC = () => {
  const dispatch = useAppDispatch();
  const currentLocation = useAppSelector(
    (state) => state.location.currentLocation
  );
  const cachedRecommendations = useAppSelector(
    (state) => state.restaurants.cachedRecommendations
  );
  const { recordBehavior } = useKnowledgeGraphContext();

  const [recommendationData, setRecommendationData] =
    useState<RecommendationData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasFetched, setHasFetched] = useState(false);

  // Load liked restaurants and cached data from localStorage on mount
  useEffect(() => {
    // Load liked restaurants
    const savedLikes = localStorage.getItem("likedRestaurants");
    if (savedLikes) {
      try {
        const parsedLikes = JSON.parse(savedLikes);
        dispatch(setLikedRestaurants(parsedLikes));
      } catch (error) {
        console.error("Error loading liked restaurants:", error);
      }
    }

    // Clear expired cache on mount
    dispatch(clearExpiredCache());
  }, [dispatch]);

  // Non-blocking knowledge graph tracking
  const trackBehavior = useCallback(
    async (type: string, action: string, context?: string, metadata?: any) => {
      try {
        await recordBehavior(type, action, context, metadata);
      } catch (error) {
        // Silent fail - don't let tracking errors affect the user experience
        console.warn("Knowledge graph tracking failed:", error);
      }
    },
    [recordBehavior]
  );

  // Check for cached data
  const getCachedData = useCallback(() => {
    if (!currentLocation) return null;

    const locationKey = `${currentLocation.latitude.toFixed(
      4
    )}_${currentLocation.longitude.toFixed(4)}`;
    const cached = cachedRecommendations[locationKey];

    if (cached && cached.expiresAt > Date.now()) {
      return cached.data;
    }
    return null;
  }, [currentLocation, cachedRecommendations]);

  // Fetch recommendations function
  const fetchRecommendations = useCallback(
    async (showToast = true, forceRefresh = false) => {
      if (!currentLocation || isLoading) return;

      // Check cache first unless forcing refresh
      if (!forceRefresh) {
        const cachedData = getCachedData();
        if (cachedData) {
          setRecommendationData(cachedData);
          setHasFetched(true);
          if (showToast) {
            toast.success("Loaded cached recommendations", {
              id: "fetch-restaurants",
            });
          }
          return;
        }
      }

      try {
        setIsLoading(true);
        setError(null);

        if (showToast) {
          toast.loading("Finding restaurants near you...", {
            id: "fetch-restaurants",
          });
        }

        const locationData = {
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
          address: currentLocation.address,
          city: currentLocation.city,
          state: currentLocation.state,
          country: currentLocation.country,
        };

        const response = await fetch("/api/home-recommendation", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ location: locationData }),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Failed to fetch recommendations");
        }

        // Set data first, then cache and track (non-blocking)
        setRecommendationData(result.data);
        setHasFetched(true);

        // Cache the data
        const locationKey = `${currentLocation.latitude.toFixed(
          4
        )}_${currentLocation.longitude.toFixed(4)}`;
        dispatch(
          setCachedRecommendations({
            locationKey,
            data: result.data,
            ttl: 60, // Cache for 60 minutes
          })
        );

        if (showToast) {
          toast.success(
            `Found ${result.data.search_metadata.total_restaurants_found} restaurants!`,
            { id: "fetch-restaurants" }
          );
        }

        // Track behavior after successful display (non-blocking)
        trackBehavior("search", "auto_fetch_recommendations", undefined, {
          location: currentLocation.address,
          totalRestaurants: result.data.search_metadata.total_restaurants_found,
          categories:
            Object.keys(result.data.restaurants.dietary_based).length +
            Object.keys(result.data.restaurants.preference_based).length,
        });
      } catch (error) {
        console.error("Error fetching recommendations:", error);
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Failed to fetch recommendations";
        setError(errorMessage);

        if (showToast) {
          toast.error(errorMessage, { id: "fetch-restaurants" });
        }

        // Track error (non-blocking)
        trackBehavior("interaction", "recommendations_error", undefined, {
          error: errorMessage,
        });
      } finally {
        setIsLoading(false);
      }
    },
    [currentLocation, trackBehavior, getCachedData, dispatch]
  );

  // Only fetch when location changes and we haven't fetched yet for this location
  useEffect(() => {
    if (currentLocation && !hasFetched && !isLoading) {
      fetchRecommendations(true);
    }
  }, [currentLocation?.id, hasFetched, isLoading, fetchRecommendations]);

  // Reset hasFetched when location changes
  useEffect(() => {
    if (currentLocation) {
      setHasFetched(false);
      setRecommendationData(null);
      setError(null);
    }
  }, [currentLocation?.id]);

  // Manual refresh
  const handleRefresh = () => {
    setHasFetched(false);
    setRecommendationData(null);
    setError(null);
    fetchRecommendations(true, true); // Force refresh
  };

  // Handle location set from onboarding
  const handleLocationSet = () => {
    setHasFetched(false);
  };

  // Show location onboarding if no location is set
  if (!currentLocation) {
    return <LocationOnboarding onLocationSet={handleLocationSet} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
          <div className="mb-6 lg:mb-0">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Welcome to Kensho
            </h1>
            <p className="text-lg text-gray-600">
              Discover amazing restaurants personalized to your taste
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            {/* Location Selector */}
            <LocationSelector className="w-full sm:w-auto" />

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleRefresh}
                disabled={isLoading}
                className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FiRefreshCw
                  className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`}
                />
                <span className="hidden sm:inline">Refresh</span>
              </button>

              <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                <FiSettings className="w-4 h-4" />
                <span className="hidden sm:inline">Preferences</span>
              </button>
            </div>
          </div>
        </div>

        {/* Current Location Display */}
        <div className="mb-8 p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-500 mb-1">
                Currently showing restaurants near:
              </div>
              <div className="font-medium text-gray-900">
                {currentLocation.address}
              </div>
            </div>
            {recommendationData && (
              <div className="text-right">
                <div className="text-sm text-gray-500">Last updated:</div>
                <div className="text-sm font-medium text-gray-700">
                  {new Date(
                    recommendationData.search_metadata.timestamp
                  ).toLocaleTimeString()}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Error State */}
        {error && !isLoading && (
          <div className="mb-8 p-6 bg-red-50 border border-red-200 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="text-red-600 text-xl">⚠️</div>
              <div>
                <h3 className="font-semibold text-red-800 mb-1">
                  Unable to load restaurants
                </h3>
                <p className="text-red-700 text-sm">{error}</p>
                <button
                  onClick={handleRefresh}
                  className="mt-3 text-red-800 hover:text-red-900 font-medium text-sm underline"
                >
                  Try again
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Restaurant Sections - Show data if available, regardless of loading state */}
        {recommendationData && !error ? (
          <RestaurantSections data={recommendationData} loading={false} />
        ) : isLoading ? (
          <RestaurantSections data={null as any} loading={true} />
        ) : !error && !recommendationData && hasFetched ? (
          /* No results found */
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              No restaurants found
            </h3>
            <p className="text-gray-600 mb-6">
              We couldn&apos;t find any restaurants in your area. Try changing
              your location or refreshing.
            </p>
            <button
              onClick={handleRefresh}
              className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
            >
              Try Different Location
            </button>
          </div>
        ) : !hasFetched && !isLoading ? (
          /* Initial state */
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🍽️</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              Ready to find amazing restaurants?
            </h3>
            <p className="text-gray-600 mb-6">
              Click refresh to discover personalized restaurant recommendations
              near you.
            </p>
            <button
              onClick={handleRefresh}
              className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
            >
              Find Restaurants
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default HomeContent;
