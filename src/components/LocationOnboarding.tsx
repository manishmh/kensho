"use client";

import {
  Location,
  setCurrentLocation,
  setLoading,
} from "@/redux/features/location/locationSlice";
import { useAppDispatch } from "@/redux/hooks";
import React, { useState } from "react";
import { FiChevronRight, FiMapPin } from "react-icons/fi";
import { MdMyLocation } from "react-icons/md";
import { toast } from "sonner";
import PlacesAutocomplete, { PlaceResult } from "./PlacesAutocomplete";

interface LocationOnboardingProps {
  onLocationSet: () => void;
}

const LocationOnboarding: React.FC<LocationOnboardingProps> = ({
  onLocationSet,
}) => {
  const dispatch = useAppDispatch();
  const [isDetecting, setIsDetecting] = useState(false);

  const saveAndSetCurrentLocation = async (location: Location) => {
    try {
      dispatch(setLoading(true));

      // Save location to backend
      const locationToSave = {
        ...location,
        type: "OTHER" as const,
        isDefault: true,
      };

      const response = await fetch("/api/locations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(locationToSave),
      });

      if (response.ok) {
        const savedLocation = await response.json();
        dispatch(setCurrentLocation(savedLocation));
        toast.success(
          "Location set successfully! Fetching restaurant recommendations..."
        );
        onLocationSet();
      } else {
        throw new Error("Failed to save location");
      }
    } catch (error) {
      console.error("Error saving location:", error);
      toast.error("Failed to save location");
    } finally {
      dispatch(setLoading(false));
    }
  };

  const getCurrentLocation = () => {
    setIsDetecting(true);

    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      setIsDetecting(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        try {
          // Reverse geocode to get address
          const response = await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
          );

          if (response.ok) {
            const data = await response.json();
            if (data.results && data.results[0]) {
              const result = data.results[0];
              const addressComponents = result.address_components;

              let city = "";
              let state = "";
              let country = "";
              let postalCode = "";

              addressComponents.forEach(
                (component: { types: string[]; long_name: string }) => {
                  if (component.types.includes("locality")) {
                    city = component.long_name;
                  }
                  if (component.types.includes("administrative_area_level_1")) {
                    state = component.long_name;
                  }
                  if (component.types.includes("country")) {
                    country = component.long_name;
                  }
                  if (component.types.includes("postal_code")) {
                    postalCode = component.long_name;
                  }
                }
              );

              const location: Location = {
                type: "OTHER",
                address: result.formatted_address,
                formattedAddress: result.formatted_address,
                placeId: result.place_id,
                latitude,
                longitude,
                city,
                state,
                country,
                postalCode,
              };

              await saveAndSetCurrentLocation(location);
            }
          }
        } catch (error) {
          console.error("Error reverse geocoding:", error);
          toast.error("Failed to get address details");
        } finally {
          setIsDetecting(false);
        }
      },
      (error) => {
        setIsDetecting(false);
        console.error("Error getting location:", error);

        switch (error.code) {
          case error.PERMISSION_DENIED:
            toast.error("Location permission denied");
            break;
          case error.POSITION_UNAVAILABLE:
            toast.error("Location information unavailable");
            break;
          case error.TIMEOUT:
            toast.error("Location request timed out");
            break;
          default:
            toast.error("An unknown error occurred");
        }
      }
    );
  };

  const handlePlaceSelect = async (place: PlaceResult) => {
    const location: Location = {
      type: "OTHER",
      address: place.name,
      formattedAddress: place.formattedAddress,
      placeId: place.placeId,
      latitude: place.latitude,
      longitude: place.longitude,
      city: place.city,
      state: place.state,
      country: place.country,
      postalCode: place.postalCode,
    };

    await saveAndSetCurrentLocation(location);
  };

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="max-w-2xl w-full">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-orange-100 rounded-full mb-6">
            <FiMapPin className="w-10 h-10 text-orange-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Where would you like to eat?
          </h1>
          <p className="text-lg text-gray-600 max-w-md mx-auto">
            Set your location to discover amazing restaurants near you,
            personalized to your taste preferences.
          </p>
        </div>

        {/* Location Selection Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 mb-8">
          {/* Auto-detect Location */}
          <button
            onClick={getCurrentLocation}
            disabled={isDetecting}
            className="w-full flex items-center justify-between p-6 bg-gradient-to-r from-orange-50 to-red-50 rounded-xl hover:from-orange-100 hover:to-red-100 transition-all duration-300 border border-orange-200 mb-6 group disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-100 rounded-lg group-hover:bg-orange-200 transition-colors">
                <MdMyLocation className="w-6 h-6 text-orange-600" />
              </div>
              <div className="text-left">
                <div className="font-semibold text-gray-900 text-lg">
                  Use my current location
                </div>
                <div className="text-sm text-gray-600">
                  We&apos;ll detect your location automatically
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isDetecting ? (
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500"></div>
              ) : (
                <FiChevronRight className="w-5 h-5 text-orange-600 group-hover:translate-x-1 transition-transform" />
              )}
            </div>
          </button>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">or</span>
            </div>
          </div>

          {/* Manual Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Search for your location
            </label>
            <PlacesAutocomplete
              onPlaceSelect={handlePlaceSelect}
              placeholder="Enter your address, city, or area..."
              className="w-full px-4 py-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent text-lg"
            />
            <p className="text-sm text-gray-500 mt-2">
              Try searching for your neighborhood, street address, or landmark
            </p>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
          <div className="p-6">
            <div className="text-3xl mb-3">🎯</div>
            <h3 className="font-semibold text-gray-900 mb-2">Personalized</h3>
            <p className="text-sm text-gray-600">
              Recommendations based on your dietary preferences and taste
            </p>
          </div>
          <div className="p-6">
            <div className="text-3xl mb-3">📍</div>
            <h3 className="font-semibold text-gray-900 mb-2">Location-Based</h3>
            <p className="text-sm text-gray-600">
              Find the best restaurants within your preferred distance
            </p>
          </div>
          <div className="p-6">
            <div className="text-3xl mb-3">⚡</div>
            <h3 className="font-semibold text-gray-900 mb-2">Real-Time</h3>
            <p className="text-sm text-gray-600">
              Always up-to-date restaurant information and availability
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocationOnboarding;
