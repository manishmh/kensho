"use client";

import { useAppSelector } from "@/redux/hooks";
import React, { useState } from "react";
import {
  FiAlertCircle,
  FiCheckCircle,
  FiLoader,
  FiMapPin,
  FiSearch,
} from "react-icons/fi";
import { toast } from "sonner";

interface RecommendationStatus {
  status: "idle" | "checking" | "fetching" | "success" | "error";
  message: string;
  data?: any; // eslint-disable-line @typescript-eslint/no-explicit-any
}

const RestaurantRecommendationTrigger: React.FC = () => {
  const currentLocation = useAppSelector(
    (state) => state.location.currentLocation
  );
  const [recommendationStatus, setRecommendationStatus] =
    useState<RecommendationStatus>({
      status: "idle",
      message: "",
    });

  const checkRecommendationReadiness = async () => {
    try {
      setRecommendationStatus({
        status: "checking",
        message: "Checking recommendation readiness...",
      });

      const response = await fetch("/api/home-recommendation", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to check readiness");
      }

      if (data.user_ready) {
        setRecommendationStatus({
          status: "success",
          message: `Ready! Will search for ${
            (data.search_queries_preview?.dietary?.length || 0) +
            (data.search_queries_preview?.preference?.length || 0)
          } restaurant types.`,
          data: data.search_queries_preview,
        });
        toast.success("Ready for restaurant recommendations!");
      } else {
        setRecommendationStatus({
          status: "error",
          message: data.message || "Not ready for recommendations",
        });
        toast.error(data.message || "Please complete onboarding first");
      }
    } catch (error) {
      console.error("Error checking readiness:", error);
      setRecommendationStatus({
        status: "error",
        message:
          error instanceof Error ? error.message : "Failed to check readiness",
      });
      toast.error("Failed to check recommendation readiness");
    }
  };

  const fetchRestaurantRecommendations = async () => {
    if (!currentLocation) {
      toast.error("Please select a location first");
      return;
    }

    try {
      setRecommendationStatus({
        status: "fetching",
        message: "Fetching restaurant recommendations...",
      });

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

      setRecommendationStatus({
        status: "success",
        message: `Successfully fetched ${result.data.search_metadata.total_restaurants_found} restaurants!`,
        data: result.data,
      });

      toast.success(
        `Found ${result.data.search_metadata.total_restaurants_found} restaurants for your preferences!`
      );

      // Log the data structure for debugging
      console.log("🎯 Restaurant Recommendation Data:", result.data);
    } catch (error) {
      console.error("Error fetching recommendations:", error);
      setRecommendationStatus({
        status: "error",
        message:
          error instanceof Error
            ? error.message
            : "Failed to fetch recommendations",
      });
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to fetch restaurant recommendations"
      );
    }
  };

  const getStatusIcon = () => {
    switch (recommendationStatus.status) {
      case "checking":
      case "fetching":
        return <FiLoader className="w-5 h-5 animate-spin" />;
      case "success":
        return <FiCheckCircle className="w-5 h-5 text-green-500" />;
      case "error":
        return <FiAlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <FiSearch className="w-5 h-5" />;
    }
  };

  const getStatusColor = () => {
    switch (recommendationStatus.status) {
      case "success":
        return "text-green-600 bg-green-50 border-green-200";
      case "error":
        return "text-red-600 bg-red-50 border-red-200";
      case "checking":
      case "fetching":
        return "text-blue-600 bg-blue-50 border-blue-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-xl shadow-lg border border-gray-200">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-orange-100 rounded-lg">
              <FiMapPin className="w-6 h-6 text-orange-500" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">
                Restaurant Recommendations
              </h2>
              <p className="text-gray-600">
                Get personalized restaurant suggestions based on your
                preferences
              </p>
            </div>
          </div>

          {/* Current Location Display */}
          {currentLocation ? (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <FiMapPin className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-800">
                  Current Location
                </span>
              </div>
              <p className="text-sm text-green-700">
                {currentLocation.address}
              </p>
              <p className="text-xs text-green-600">
                {currentLocation.latitude.toFixed(4)},{" "}
                {currentLocation.longitude.toFixed(4)}
              </p>
            </div>
          ) : (
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center gap-2">
                <FiAlertCircle className="w-4 h-4 text-yellow-600" />
                <span className="text-sm font-medium text-yellow-800">
                  No location selected
                </span>
              </div>
              <p className="text-sm text-yellow-700">
                Please select your location first to get recommendations
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <button
              onClick={checkRecommendationReadiness}
              disabled={recommendationStatus.status === "checking"}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {recommendationStatus.status === "checking" ? (
                <FiLoader className="w-4 h-4 animate-spin" />
              ) : (
                <FiSearch className="w-4 h-4" />
              )}
              Check Readiness
            </button>

            <button
              onClick={fetchRestaurantRecommendations}
              disabled={
                !currentLocation || recommendationStatus.status === "fetching"
              }
              className="flex items-center justify-center gap-2 px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {recommendationStatus.status === "fetching" ? (
                <FiLoader className="w-4 h-4 animate-spin" />
              ) : (
                <FiMapPin className="w-4 h-4" />
              )}
              Get Recommendations
            </button>
          </div>

          {/* Status Display */}
          {recommendationStatus.message && (
            <div className={`p-4 rounded-lg border ${getStatusColor()}`}>
              <div className="flex items-center gap-2">
                {getStatusIcon()}
                <span className="text-sm font-medium">
                  {recommendationStatus.message}
                </span>
              </div>

              {/* Search Queries Preview */}
              {recommendationStatus.data &&
                recommendationStatus.data.dietary && (
                  <div className="mt-4 space-y-2">
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-1">
                        Dietary-based searches:
                      </h4>
                      <div className="flex flex-wrap gap-1">
                        {recommendationStatus.data.dietary.map(
                          (query: string, index: number) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-white bg-opacity-50 rounded text-xs"
                            >
                              {query}
                            </span>
                          )
                        )}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-1">
                        Preference-based searches:
                      </h4>
                      <div className="flex flex-wrap gap-1">
                        {recommendationStatus.data.preference.map(
                          (query: string, index: number) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-white bg-opacity-50 rounded text-xs"
                            >
                              {query}
                            </span>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                )}
            </div>
          )}

          {/* Development Info */}
          <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <h3 className="text-sm font-medium text-gray-700 mb-2">
              Development Status
            </h3>
            <ul className="text-xs text-gray-600 space-y-1">
              <li>✅ SERP API integration complete</li>
              <li>✅ User preferences integration complete</li>
              <li>✅ Location-based restaurant search (8-10km radius)</li>
              <li>✅ 20 restaurants per search type</li>
              <li>⏳ AI recommendation processing (next step)</li>
              <li>⏳ Restaurant data storage after AI processing</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RestaurantRecommendationTrigger;
