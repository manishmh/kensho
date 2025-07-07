"use client";

import {
  addSavedLocation,
  clearLocation,
  Location,
  removeSavedLocation,
  setCurrentLocation,
  setLoading,
  setLocationPermission,
  setSavedLocations,
  updateSavedLocation,
} from "@/redux/features/location/locationSlice";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  FiBriefcase,
  FiChevronDown,
  FiEdit2,
  FiHome,
  FiMapPin,
  FiPlus,
  FiTrash2,
} from "react-icons/fi";
import { MdMyLocation } from "react-icons/md";
import { toast } from "sonner";
import PlacesAutocomplete, { PlaceResult } from "./PlacesAutocomplete";

interface LocationSelectorProps {
  className?: string;
}

const LocationSelector: React.FC<LocationSelectorProps> = ({
  className = "",
}) => {
  const dispatch = useAppDispatch();
  const { currentLocation, savedLocations, isLoading } = useAppSelector(
    (state) => state.location
  );

  const [isOpen, setIsOpen] = useState(false);
  const [showAddLocation, setShowAddLocation] = useState(false);
  const [locationType, setLocationType] = useState<"HOME" | "OFFICE" | "OTHER">(
    "OTHER"
  );
  const [customLabel, setCustomLabel] = useState("");
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch saved locations
  const fetchSavedLocations = useCallback(async () => {
    try {
      const response = await fetch("/api/locations");
      if (response.ok) {
        const locations = await response.json();
        dispatch(setSavedLocations(locations));

        // Set default location as current if available and no current location is set
        if (!currentLocation) {
          const defaultLocation = locations.find(
            (loc: Location) => loc.isDefault
          );
          if (defaultLocation) {
            dispatch(setCurrentLocation(defaultLocation));
          }
        }
      }
    } catch (error) {
      console.error("Error fetching locations:", error);
    }
  }, [dispatch, currentLocation]);

  // Fetch saved locations on mount
  useEffect(() => {
    fetchSavedLocations();
  }, [fetchSavedLocations]);

  // Save location to backend and set as current
  const saveAndSetCurrentLocation = async (location: Location) => {
    try {
      dispatch(setLoading(true));

      // Check if this location already exists in saved locations
      const existingLocation = savedLocations.find(
        (savedLoc) =>
          savedLoc.placeId === location.placeId ||
          (Math.abs(savedLoc.latitude - location.latitude) < 0.0001 &&
            Math.abs(savedLoc.longitude - location.longitude) < 0.0001)
      );

      let savedLocation: Location;

      if (existingLocation) {
        // Location already exists, just set it as current
        savedLocation = existingLocation;

        // Update it to be the default if it's not already
        if (!existingLocation.isDefault) {
          const response = await fetch(
            `/api/locations/${existingLocation.id}`,
            {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ isDefault: true }),
            }
          );

          if (response.ok) {
            const updatedLocation = await response.json();
            dispatch(updateSavedLocation(updatedLocation));
            savedLocation = updatedLocation;
          }
        }
      } else {
        // Save new location to backend
        const locationToSave = {
          ...location,
          type: "OTHER" as const,
          isDefault: true, // Make this the default location
        };

        const response = await fetch("/api/locations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(locationToSave),
        });

        if (response.ok) {
          savedLocation = await response.json();
          dispatch(addSavedLocation(savedLocation));
        } else {
          throw new Error("Failed to save location");
        }
      }

      // Set as current location in Redux
      dispatch(setCurrentLocation(savedLocation));
      setIsOpen(false);
      toast.success("Location updated successfully");
    } catch (error) {
      console.error("Error saving location:", error);
      toast.error("Failed to save location");
    } finally {
      dispatch(setLoading(false));
    }
  };

  const getCurrentLocation = () => {
    dispatch(setLoading(true));

    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      dispatch(setLoading(false));
      return;
    }

    navigator.permissions.query({ name: "geolocation" }).then((result) => {
      dispatch(
        setLocationPermission(result.state as "granted" | "denied" | "prompt")
      );
    });

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
          dispatch(setLoading(false));
        }
      },
      (error) => {
        dispatch(setLoading(false));
        console.error("Error getting location:", error);

        switch (error.code) {
          case error.PERMISSION_DENIED:
            toast.error("Location permission denied");
            dispatch(setLocationPermission("denied"));
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
      type: locationType,
      label: locationType === "OTHER" ? customLabel || undefined : undefined,
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

    if (showAddLocation || editingLocation) {
      // Save location to backend with specific type and label
      try {
        const url = editingLocation
          ? `/api/locations/${editingLocation.id}`
          : "/api/locations";

        const method = editingLocation ? "PUT" : "POST";

        const response = await fetch(url, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(location),
        });

        if (response.ok) {
          const savedLocation = await response.json();

          if (editingLocation) {
            dispatch(updateSavedLocation(savedLocation));
            toast.success("Location updated successfully");
          } else {
            dispatch(addSavedLocation(savedLocation));
            toast.success("Location saved successfully");
          }

          // Reset form
          setShowAddLocation(false);
          setEditingLocation(null);
          setLocationType("OTHER");
          setCustomLabel("");
        } else {
          toast.error("Failed to save location");
        }
      } catch (error) {
        console.error("Error saving location:", error);
        toast.error("Failed to save location");
      }
    } else {
      // Regular location selection - save and set as current
      await saveAndSetCurrentLocation(location);
    }
  };

  const handleSelectSavedLocation = async (location: Location) => {
    try {
      // Update the selected location to be the default
      const response = await fetch(`/api/locations/${location.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isDefault: true }),
      });

      if (response.ok) {
        const updatedLocation = await response.json();
        dispatch(updateSavedLocation(updatedLocation));
        dispatch(setCurrentLocation(updatedLocation));
        setIsOpen(false);
        toast.success("Location updated successfully");
      } else {
        // Fallback to just setting in Redux if API call fails
        dispatch(setCurrentLocation(location));
        setIsOpen(false);
      }
    } catch (error) {
      console.error("Error updating default location:", error);
      // Fallback to just setting in Redux
      dispatch(setCurrentLocation(location));
      setIsOpen(false);
    }
  };

  const handleDeleteLocation = async (locationId: string) => {
    try {
      const response = await fetch(`/api/locations/${locationId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        dispatch(removeSavedLocation(locationId));

        // If the deleted location was the current location, clear it
        if (currentLocation?.id === locationId) {
          dispatch(clearLocation());
        }

        toast.success("Location deleted successfully");
      } else {
        toast.error("Failed to delete location");
      }
    } catch (error) {
      console.error("Error deleting location:", error);
      toast.error("Failed to delete location");
    }
  };

  const getLocationIcon = (type: string) => {
    switch (type) {
      case "HOME":
        return <FiHome className="w-4 h-4" />;
      case "OFFICE":
        return <FiBriefcase className="w-4 h-4" />;
      default:
        return <FiMapPin className="w-4 h-4" />;
    }
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:border-gray-300 min-w-0 transition-all duration-300 ${isOpen ? "max-w-sm" : "max-w-xs"} `}
      >
        <FiMapPin className="w-5 h-5 text-orange-500 flex-shrink-0" />
        <div className="text-left min-w-0 flex-1">
          <div className="text-xs text-gray-500">Deliver to</div>
          <div className="text-sm font-medium truncate">
            {currentLocation ? currentLocation.address : "Select location"}
          </div>
        </div>
        <FiChevronDown
          className={`w-4 h-4 text-gray-500 transition-transform flex-shrink-0 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-96 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="p-4">
            {/* Live location detection */}
            <button
              onClick={getCurrentLocation}
              disabled={isLoading}
              className="w-full flex items-center gap-3 p-3 bg-orange-50 text-orange-600 rounded-lg hover:bg-orange-100 transition-colors disabled:opacity-50"
            >
              <MdMyLocation className="w-5 h-5 flex-shrink-0" />
              <div className="text-left min-w-0 flex-1">
                <div className="font-medium">Detect my location</div>
                <div className="text-xs text-orange-500">Using GPS</div>
              </div>
              {isLoading && (
                <div className="ml-auto flex-shrink-0">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-500"></div>
                </div>
              )}
            </button>

            {/* Location search */}
            <div className="mt-4">
              <PlacesAutocomplete
                onPlaceSelect={handlePlaceSelect}
                placeholder="Search for area, street name..."
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-orange-500"
              />
            </div>

            {/* Saved locations */}
            {savedLocations.length > 0 && (
              <div className="mt-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2">
                  Saved Locations
                </h3>
                <div className="space-y-2">
                  {savedLocations.map((location) => (
                    <div
                      key={location.id}
                      className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer group min-w-0"
                    >
                      <div
                        className="flex items-center gap-2 flex-1 min-w-0"
                        onClick={() => handleSelectSavedLocation(location)}
                      >
                        <div className="flex-shrink-0">
                          {getLocationIcon(location.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">
                            {location.type === "OTHER" && location.label
                              ? location.label
                              : location.type}
                          </div>
                          <div className="text-xs text-gray-500 truncate">
                            {location.formattedAddress}
                          </div>
                        </div>
                        {location.isDefault && (
                          <div className="text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded flex-shrink-0">
                            Current
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingLocation(location);
                            setLocationType(location.type);
                            setCustomLabel(location.label || "");
                            setShowAddLocation(true);
                          }}
                          className="p-1 hover:bg-gray-200 rounded"
                        >
                          <FiEdit2 className="w-3 h-3 text-gray-600" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteLocation(location.id!);
                          }}
                          className="p-1 hover:bg-gray-200 rounded"
                        >
                          <FiTrash2 className="w-3 h-3 text-red-600" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add new location */}
            {!showAddLocation && (
              <button
                onClick={() => setShowAddLocation(true)}
                className="mt-4 w-full flex items-center justify-center gap-2 p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
              >
                <FiPlus className="w-4 h-4" />
                <span className="text-sm font-medium">Add new address</span>
              </button>
            )}

            {/* Add location form */}
            {showAddLocation && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <h4 className="text-sm font-medium mb-3">
                  {editingLocation ? "Edit Location" : "Add New Location"}
                </h4>

                <div className="flex gap-2 mb-3">
                  <button
                    onClick={() => setLocationType("HOME")}
                    className={`flex-1 flex items-center justify-center gap-2 p-2 rounded-lg border ${
                      locationType === "HOME"
                        ? "border-orange-500 bg-orange-50 text-orange-600"
                        : "border-gray-200 bg-white"
                    }`}
                  >
                    <FiHome className="w-4 h-4" />
                    <span className="text-sm">Home</span>
                  </button>
                  <button
                    onClick={() => setLocationType("OFFICE")}
                    className={`flex-1 flex items-center justify-center gap-2 p-2 rounded-lg border ${
                      locationType === "OFFICE"
                        ? "border-orange-500 bg-orange-50 text-orange-600"
                        : "border-gray-200 bg-white"
                    }`}
                  >
                    <FiBriefcase className="w-4 h-4" />
                    <span className="text-sm">Office</span>
                  </button>
                  <button
                    onClick={() => setLocationType("OTHER")}
                    className={`flex-1 flex items-center justify-center gap-2 p-2 rounded-lg border ${
                      locationType === "OTHER"
                        ? "border-orange-500 bg-orange-50 text-orange-600"
                        : "border-gray-200 bg-white"
                    }`}
                  >
                    <FiMapPin className="w-4 h-4" />
                    <span className="text-sm">Other</span>
                  </button>
                </div>

                {locationType === "OTHER" && (
                  <input
                    type="text"
                    value={customLabel}
                    onChange={(e) => setCustomLabel(e.target.value)}
                    placeholder="Label (e.g., Friend's place)"
                    className="w-full px-3 py-2 mb-3 border border-gray-200 rounded-lg focus:outline-none focus:border-orange-500 text-sm"
                  />
                )}

                <PlacesAutocomplete
                  onPlaceSelect={handlePlaceSelect}
                  placeholder="Search and select location..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-orange-500 text-sm"
                  initialValue={editingLocation?.formattedAddress || ""}
                />

                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => {
                      setShowAddLocation(false);
                      setEditingLocation(null);
                      setLocationType("OTHER");
                      setCustomLabel("");
                    }}
                    className="flex-1 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default LocationSelector;
