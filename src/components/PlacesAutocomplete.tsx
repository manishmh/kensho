"use client";

import { useCombobox } from "downshift";
import React, { useEffect, useState } from "react";
import usePlacesAutocomplete, {
  getGeocode,
  getLatLng,
} from "use-places-autocomplete";

// Global type declaration for Google Maps
declare global {
  interface Window {
    google?: {
      maps?: {
        places?: {
          PlacesService?: unknown;
          AutocompleteService?: unknown;
        };
      };
    };
  }
}

export interface PlaceResult {
  name: string;
  formattedAddress: string;
  placeId: string;
  latitude: number;
  longitude: number;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
}

interface PlacesAutocompleteProps {
  onPlaceSelect: (place: PlaceResult) => void;
  placeholder?: string;
  className?: string;
  initialValue?: string;
}

// Check if Google Maps Places API is fully loaded
const isGoogleMapsPlacesReady = (): boolean => {
  return !!(
    window.google?.maps?.places?.PlacesService &&
    window.google?.maps?.places?.AutocompleteService
  );
};

// Google Maps API loader
const loadGoogleMapsAPI = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    // Check if already loaded
    if (isGoogleMapsPlacesReady()) {
      resolve();
      return;
    }

    // Check if script is already being loaded
    const existingScript = document.querySelector(
      'script[src*="maps.googleapis.com"]'
    );
    if (existingScript) {
      let attempts = 0;
      const maxAttempts = 100; // 10 seconds max

      const checkReady = () => {
        attempts++;
        if (isGoogleMapsPlacesReady()) {
          resolve();
        } else if (attempts >= maxAttempts) {
          reject(new Error("Google Maps API loading timeout"));
        } else {
          setTimeout(checkReady, 100);
        }
      };
      checkReady();
      return;
    }

    // Create and load the script
    const script = document.createElement("script");
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      reject(new Error("Google Maps API key not configured"));
      return;
    }

    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&loading=async`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      let attempts = 0;
      const maxAttempts = 50; // 5 seconds max

      const checkReady = () => {
        attempts++;
        if (isGoogleMapsPlacesReady()) {
          resolve();
        } else if (attempts >= maxAttempts) {
          reject(new Error("Google Maps Places API initialization timeout"));
        } else {
          setTimeout(checkReady, 100);
        }
      };
      checkReady();
    };

    script.onerror = () => {
      reject(new Error("Failed to load Google Maps API script"));
    };

    document.head.appendChild(script);
  });
};

const PlacesAutocomplete: React.FC<PlacesAutocompleteProps> = ({
  onPlaceSelect,
  placeholder = "Search for a location...",
  className = "",
  initialValue = "",
}) => {
  const [isGoogleMapsLoaded, setIsGoogleMapsLoaded] = useState(false);
  const [loadingError, setLoadingError] = useState<string | null>(null);

  // Load Google Maps API on component mount
  useEffect(() => {
    const loadAPI = async () => {
      try {
        await loadGoogleMapsAPI();
        setIsGoogleMapsLoaded(true);
      } catch (error) {
        console.error("Error loading Google Maps API:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        setLoadingError(errorMessage);
      }
    };

    loadAPI();
  }, []);

  const {
    ready,
    suggestions: { status, data },
    setValue,
    clearSuggestions,
  } = usePlacesAutocomplete({
    requestOptions: {
      // Configure for Indian locations
      componentRestrictions: { country: "in" },
      types: ["establishment", "geocode"],
    },
    debounce: 300,
    defaultValue: initialValue,
    initOnMount: isGoogleMapsLoaded,
  });

  const handleSelect = async (address: string) => {
    setValue(address, false);
    clearSuggestions();

    try {
      const results = await getGeocode({ address });
      const { lat, lng } = await getLatLng(results[0]);

      // Extract city, state, country, and postal code from address components
      const addressComponents = results[0].address_components;
      let city = "";
      let state = "";
      let country = "";
      let postalCode = "";

      addressComponents.forEach((component) => {
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
      });

      const placeResult: PlaceResult = {
        name: results[0].address_components[0]?.long_name || address,
        formattedAddress: results[0].formatted_address,
        placeId: results[0].place_id,
        latitude: lat,
        longitude: lng,
        city,
        state,
        country,
        postalCode,
      };

      onPlaceSelect(placeResult);
    } catch (error) {
      console.error("Geocoding error: ", error);
    }
  };

  const {
    isOpen,
    getMenuProps,
    getInputProps,
    getItemProps,
    highlightedIndex,
  } = useCombobox({
    items: data || [],
    onInputValueChange: ({ inputValue }) => {
      setValue(inputValue || "");
    },
    onSelectedItemChange: ({ selectedItem }) => {
      if (selectedItem) {
        handleSelect(selectedItem.description);
      }
    },
    itemToString: (item) => (item ? item.description : ""),
  });

  // Show loading state
  if (!isGoogleMapsLoaded && !loadingError) {
    return (
      <div className="relative">
        <input
          {...getInputProps({
            placeholder: "Loading location search...",
            className: `${className} bg-gray-100 cursor-not-allowed`,
            disabled: true,
            value: "",
          })}
        />
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-500"></div>
        </div>
        <ul {...getMenuProps()} style={{ display: "none" }}></ul>
      </div>
    );
  }

  // Show error state
  if (loadingError) {
    return (
      <div className="relative">
        <input
          {...getInputProps({
            placeholder: "Location search unavailable",
            className: `${className} bg-red-50 border-red-300 text-red-700`,
            disabled: true,
            value: "",
          })}
        />
        <ul {...getMenuProps()} style={{ display: "none" }}></ul>
      </div>
    );
  }

  // Normal autocomplete input
  const isInputReady = isGoogleMapsLoaded && ready;

  return (
    <div className="relative">
      <input
        {...getInputProps({
          placeholder: isInputReady ? placeholder : "Initializing search...",
          className: `${className} ${
            !isInputReady ? "bg-gray-100 cursor-not-allowed" : ""
          }`,
          disabled: !isInputReady,
        })}
      />

      <ul
        {...getMenuProps()}
        className={`absolute z-50 w-full bg-white border border-gray-200 rounded-md shadow-lg mt-1 max-h-60 overflow-auto ${
          !isOpen || status !== "OK" || !data?.length ? "hidden" : ""
        }`}
      >
        {isOpen &&
          status === "OK" &&
          data &&
          data.map((suggestion, index) => (
            <li
              key={suggestion.place_id}
              {...getItemProps({ item: suggestion, index })}
              className={`px-3 py-2 cursor-pointer hover:bg-gray-100 ${
                highlightedIndex === index ? "bg-gray-100" : ""
              }`}
            >
              <div className="text-sm">{suggestion.description}</div>
            </li>
          ))}
      </ul>
    </div>
  );
};

export default PlacesAutocomplete;
