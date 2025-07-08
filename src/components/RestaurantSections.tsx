"use client";

import { RecommendationData } from "@/lib/restaurantRecommendationService";
import {
  addLikedRestaurant,
  LikedRestaurant,
  removeLikedRestaurant,
} from "@/redux/features/restaurants/restaurantSlice";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import React, { useEffect } from "react";
import {
  FiClock,
  FiDollarSign,
  FiExternalLink,
  FiHeart,
  FiMapPin,
  FiPhone,
  FiStar,
} from "react-icons/fi";
import { toast } from "sonner";

interface RestaurantSectionsProps {
  data: RecommendationData;
  loading?: boolean;
}

interface RestaurantCardProps {
  restaurant: any;
  category: string;
}

const RestaurantCard: React.FC<RestaurantCardProps> = ({
  restaurant,
  category,
}) => {
  const dispatch = useAppDispatch();
  const likedRestaurants = useAppSelector(
    (state) => state.restaurants.likedRestaurants
  );
  const imageUrl = restaurant.thumbnail || restaurant.serpapi_thumbnail;

  const isLiked = likedRestaurants.some(
    (liked) =>
      liked.id === restaurant.data_id || liked.id === restaurant.place_id
  );

  const handleLikeToggle = () => {
    const restaurantId =
      restaurant.data_id || restaurant.place_id || restaurant.title;

    if (isLiked) {
      dispatch(removeLikedRestaurant(restaurantId));
      toast.success("Removed from favorites");
    } else {
      const likedRestaurant: LikedRestaurant = {
        id: restaurantId,
        title: restaurant.title,
        type: restaurant.type,
        rating: restaurant.rating,
        reviews: restaurant.reviews,
        price: restaurant.price,
        address: restaurant.address,
        phone: restaurant.phone,
        website: restaurant.website,
        thumbnail: imageUrl,
        open_state: restaurant.open_state,
        category,
        likedAt: new Date().toISOString(),
      };
      dispatch(addLikedRestaurant(likedRestaurant));
      toast.success("Added to favorites");
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-300 group">
      {/* Restaurant Image */}
      {imageUrl && (
        <div className="relative h-48 bg-gray-100">
          <img
            src={imageUrl}
            alt={restaurant.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = "none";
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        </div>
      )}

      <div className="p-6">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 group-hover:text-orange-600 transition-colors">
              {restaurant.title}
            </h3>
            <p className="text-sm text-gray-600 mt-1">{restaurant.type}</p>
          </div>
          <button
            onClick={handleLikeToggle}
            className="p-2 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <FiHeart
              className={`w-5 h-5 transition-colors ${
                isLiked
                  ? "text-red-500 fill-current"
                  : "text-gray-400 hover:text-red-500"
              }`}
            />
          </button>
        </div>

        <div className="flex items-center gap-4 mb-4">
          {restaurant.rating && (
            <div className="flex items-center gap-1">
              <FiStar className="w-4 h-4 text-yellow-400 fill-current" />
              <span className="text-sm font-medium text-gray-700">
                {restaurant.rating}
              </span>
              {restaurant.reviews && (
                <span className="text-sm text-gray-500">
                  ({restaurant.reviews})
                </span>
              )}
            </div>
          )}

          {restaurant.price && (
            <div className="flex items-center gap-1">
              <FiDollarSign className="w-4 h-4 text-green-600" />
              <span className="text-sm text-gray-700">{restaurant.price}</span>
            </div>
          )}

          {restaurant.open_state && (
            <div
              className={`flex items-center gap-1 ${
                restaurant.open_state.toLowerCase().includes("open")
                  ? "text-green-600"
                  : "text-red-600"
              }`}
            >
              <FiClock className="w-4 h-4" />
              <span className="text-sm font-medium">
                {restaurant.open_state}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 mb-4">
          <FiMapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <span className="text-sm text-gray-600 truncate">
            {restaurant.address}
          </span>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="text-xs text-gray-500 bg-orange-50 px-2 py-1 rounded-full">
            {category}
          </div>
          <div className="flex items-center gap-2">
            {restaurant.phone && (
              <button className="p-2 hover:bg-gray-50 rounded-lg transition-colors">
                <FiPhone className="w-4 h-4 text-gray-400" />
              </button>
            )}
            {restaurant.website && (
              <button className="p-2 hover:bg-gray-50 rounded-lg transition-colors">
                <FiExternalLink className="w-4 h-4 text-gray-400" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const RestaurantSections: React.FC<RestaurantSectionsProps> = ({
  data,
  loading = false,
}) => {
  const likedRestaurants = useAppSelector(
    (state) => state.restaurants.likedRestaurants
  );

  // Save to localStorage whenever likedRestaurants changes
  useEffect(() => {
    localStorage.setItem("likedRestaurants", JSON.stringify(likedRestaurants));
  }, [likedRestaurants]);
  if (loading) {
    return (
      <div className="space-y-8">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, j) => (
                <div
                  key={j}
                  className="bg-white rounded-xl p-6 border border-gray-100"
                >
                  <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-200 rounded w-full"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  const formatSectionTitle = (query: string) => {
    return query
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const getDietaryIcon = (query: string) => {
    const lower = query.toLowerCase();
    if (lower.includes("vegan")) return "🌱";
    if (lower.includes("vegetarian")) return "🥗";
    if (lower.includes("gluten")) return "🌾";
    if (lower.includes("keto")) return "🥑";
    if (lower.includes("healthy")) return "💚";
    return "🍽️";
  };

  const getPreferenceIcon = (query: string) => {
    const lower = query.toLowerCase();
    if (lower.includes("italian")) return "🍝";
    if (lower.includes("chinese")) return "🥡";
    if (lower.includes("mexican")) return "🌮";
    if (lower.includes("indian")) return "🍛";
    if (lower.includes("thai")) return "🍜";
    if (lower.includes("japanese")) return "🍣";
    if (lower.includes("pizza")) return "🍕";
    if (lower.includes("burger")) return "🍔";
    if (lower.includes("coffee")) return "☕";
    if (lower.includes("dessert")) return "🍰";
    return "🍴";
  };

  return (
    <div className="space-y-12">
      {/* Summary Stats */}
      <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-2xl p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-orange-600">
              {data.search_metadata.total_restaurants_found}
            </div>
            <div className="text-sm text-gray-600 mt-1">Total Restaurants</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-red-600">
              {Object.keys(data.restaurants.dietary_based).length +
                Object.keys(data.restaurants.preference_based).length}
            </div>
            <div className="text-sm text-gray-600 mt-1">Categories</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600">
              {data.search_metadata.search_radius_km}km
            </div>
            <div className="text-sm text-gray-600 mt-1">Search Radius</div>
          </div>
        </div>
      </div>

      {/* Dietary-Based Recommendations */}
      {Object.keys(data.restaurants.dietary_based).length > 0 && (
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-green-100 rounded-xl">
              <span className="text-2xl">🌱</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Dietary Preferences
              </h2>
              <p className="text-gray-600">
                Restaurants matching your dietary needs
              </p>
            </div>
          </div>

          <div className="space-y-8">
            {Object.entries(data.restaurants.dietary_based).map(
              ([query, restaurants]) => (
                <div key={query}>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-xl">{getDietaryIcon(query)}</span>
                    <h3 className="text-xl font-semibold text-gray-800">
                      {formatSectionTitle(query)}
                    </h3>
                    <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                      {restaurants.length} restaurants
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {restaurants.slice(0, 6).map((restaurant, index) => (
                      <RestaurantCard
                        key={`${query}-${index}`}
                        restaurant={restaurant}
                        category={formatSectionTitle(query)}
                      />
                    ))}
                  </div>

                  {restaurants.length > 6 && (
                    <div className="text-center mt-6">
                      <button className="text-orange-600 hover:text-orange-700 font-medium text-sm">
                        View all {restaurants.length}{" "}
                        {formatSectionTitle(query)} restaurants →
                      </button>
                    </div>
                  )}
                </div>
              )
            )}
          </div>
        </section>
      )}

      {/* Preference-Based Recommendations */}
      {Object.keys(data.restaurants.preference_based).length > 0 && (
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-blue-100 rounded-xl">
              <span className="text-2xl">❤️</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Your Preferences
              </h2>
              <p className="text-gray-600">
                Based on your favorite foods and cuisines
              </p>
            </div>
          </div>

          <div className="space-y-8">
            {Object.entries(data.restaurants.preference_based).map(
              ([query, restaurants]) => (
                <div key={query}>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-xl">{getPreferenceIcon(query)}</span>
                    <h3 className="text-xl font-semibold text-gray-800">
                      {formatSectionTitle(query)}
                    </h3>
                    <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                      {restaurants.length} restaurants
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {restaurants.slice(0, 6).map((restaurant, index) => (
                      <RestaurantCard
                        key={`${query}-${index}`}
                        restaurant={restaurant}
                        category={formatSectionTitle(query)}
                      />
                    ))}
                  </div>

                  {restaurants.length > 6 && (
                    <div className="text-center mt-6">
                      <button className="text-orange-600 hover:text-orange-700 font-medium text-sm">
                        View all {restaurants.length}{" "}
                        {formatSectionTitle(query)} restaurants →
                      </button>
                    </div>
                  )}
                </div>
              )
            )}
          </div>
        </section>
      )}

      {/* Empty State */}
      {Object.keys(data.restaurants.dietary_based).length === 0 &&
        Object.keys(data.restaurants.preference_based).length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">
              No restaurants found
            </h3>
            <p className="text-gray-600">
              Try adjusting your location or completing your preferences in
              onboarding.
            </p>
          </div>
        )}
    </div>
  );
};

export default RestaurantSections;
