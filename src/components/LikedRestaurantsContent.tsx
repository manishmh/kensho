"use client";

import {
  LikedRestaurant,
  removeLikedRestaurant,
  setLikedRestaurants,
} from "@/redux/features/restaurants/restaurantSlice";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import Link from "next/link";
import React, { useEffect } from "react";
import {
  FiClock,
  FiDollarSign,
  FiExternalLink,
  FiHeart,
  FiMapPin,
  FiPhone,
  FiStar,
  FiTrash2,
} from "react-icons/fi";
import { toast } from "sonner";

const LikedRestaurantCard: React.FC<{ restaurant: LikedRestaurant }> = ({
  restaurant,
}) => {
  const dispatch = useAppDispatch();

  const handleRemove = () => {
    dispatch(removeLikedRestaurant(restaurant.id));
    toast.success("Removed from favorites");
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-300 group">
      {/* Restaurant Image */}
      {restaurant.thumbnail && (
        <div className="relative h-48 bg-gray-100">
          <img
            src={restaurant.thumbnail}
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
            onClick={handleRemove}
            className="p-2 hover:bg-red-50 rounded-lg transition-colors"
          >
            <FiTrash2 className="w-4 h-4 text-red-500" />
          </button>
        </div>

        <div className="flex items-center gap-4 mb-4 flex-wrap">
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
          <span className="text-sm text-gray-600 line-clamp-2">
            {restaurant.address}
          </span>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <div className="text-xs text-gray-500 bg-orange-50 px-2 py-1 rounded-full">
              {restaurant.category}
            </div>
            <div className="text-xs text-gray-400">
              Liked {new Date(restaurant.likedAt).toLocaleDateString()}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {restaurant.phone && (
              <button className="p-2 hover:bg-gray-50 rounded-lg transition-colors">
                <FiPhone className="w-4 h-4 text-gray-400" />
              </button>
            )}
            {restaurant.website && (
              <a
                href={restaurant.website}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <FiExternalLink className="w-4 h-4 text-gray-400" />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const LikedRestaurantsContent: React.FC = () => {
  const dispatch = useAppDispatch();
  const likedRestaurants = useAppSelector(
    (state) => state.restaurants.likedRestaurants
  );

  // Load liked restaurants from localStorage on mount
  useEffect(() => {
    const savedLikes = localStorage.getItem("likedRestaurants");
    if (savedLikes) {
      try {
        const parsedLikes = JSON.parse(savedLikes);
        dispatch(setLikedRestaurants(parsedLikes));
      } catch (error) {
        console.error("Error loading liked restaurants:", error);
      }
    }
  }, [dispatch]);

  // Save to localStorage whenever likedRestaurants changes
  useEffect(() => {
    localStorage.setItem("likedRestaurants", JSON.stringify(likedRestaurants));
  }, [likedRestaurants]);

  if (likedRestaurants.length === 0) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-full mb-6">
            <FiHeart className="w-10 h-10 text-red-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            No Liked Restaurants Yet
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            Start exploring restaurants and save your favorites to see them
            here!
          </p>
          <Link
            href="/"
            className="inline-flex items-center px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
          >
            Discover Restaurants
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Liked Restaurants
            </h1>
            <p className="text-gray-600">
              {likedRestaurants.length} restaurant
              {likedRestaurants.length !== 1 ? "s" : ""} saved
            </p>
          </div>
          <Link
            href="/"
            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
          >
            Discover More
          </Link>
        </div>

        {/* Restaurant Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {likedRestaurants.map((restaurant) => (
            <LikedRestaurantCard key={restaurant.id} restaurant={restaurant} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default LikedRestaurantsContent;
