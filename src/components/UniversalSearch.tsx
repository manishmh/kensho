"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  FiMapPin,
  FiSearch,
  FiSettings,
  FiShoppingBag,
  FiUser,
} from "react-icons/fi";

interface SearchResult {
  id: string;
  type: "restaurant" | "profile" | "setting" | "location";
  title: string;
  subtitle?: string;
  href?: string;
  action?: () => void;
  icon: React.ReactNode;
}

const UniversalSearch: React.FC = () => {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);

  // Mock search results for demonstration (replace with actual search logic later)
  const mockResults: SearchResult[] = [
    {
      id: "profile-settings",
      type: "profile",
      title: "Profile Settings",
      subtitle: "Manage your account and preferences",
      href: "/profile",
      icon: <FiUser className="w-4 h-4" />,
    },
    {
      id: "account-settings",
      type: "setting",
      title: "Account Settings",
      subtitle: "Privacy, security, and account options",
      href: "/profile",
      icon: <FiSettings className="w-4 h-4" />,
    },
    {
      id: "location-settings",
      type: "setting",
      title: "Location Settings",
      subtitle: "Manage saved locations",
      action: () => {
        // Future: Open location management modal
        console.log("Location settings clicked");
      },
      icon: <FiMapPin className="w-4 h-4" />,
    },
  ];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle search input changes
  const handleSearch = (value: string) => {
    setQuery(value);
    setIsOpen(value.length > 0);

    if (value.length > 0) {
      // Filter mock results based on query
      const filtered = mockResults.filter(
        (result) =>
          result.title.toLowerCase().includes(value.toLowerCase()) ||
          result.subtitle?.toLowerCase().includes(value.toLowerCase())
      );

      // Add placeholder restaurant results if query suggests restaurant search
      if (
        value.toLowerCase().includes("restaurant") ||
        value.toLowerCase().includes("food") ||
        value.toLowerCase().includes("eat")
      ) {
        filtered.unshift({
          id: "restaurants-placeholder",
          type: "restaurant",
          title: "Restaurants",
          subtitle: "Restaurant search coming soon...",
          icon: <FiShoppingBag className="w-4 h-4" />,
        });
      }

      setResults(filtered);
    } else {
      setResults([]);
    }
  };

  // Handle result selection
  const handleResultClick = (result: SearchResult) => {
    if (result.action) {
      result.action();
    } else if (result.href) {
      window.location.href = result.href;
    }
    setIsOpen(false);
    setQuery("");
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setIsOpen(false);
      setQuery("");
    }
  };

  return (
    <div className="relative flex-1 max-w-md mx-6" ref={searchRef}>
      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <FiSearch className="h-4 w-4 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Search restaurants, settings..."
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => query.length > 0 && setIsOpen(true)}
          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
        />
      </div>

      {/* Search Results Dropdown */}
      {isOpen && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
          <div className="py-2">
            {results.map((result) => (
              <button
                key={result.id}
                onClick={() => handleResultClick(result)}
                className="w-full flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
              >
                <div className="flex-shrink-0 mt-0.5 text-gray-500">
                  {result.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {result.title}
                  </div>
                  {result.subtitle && (
                    <div className="text-xs text-gray-500 mt-0.5 truncate">
                      {result.subtitle}
                    </div>
                  )}
                </div>
                <div className="flex-shrink-0">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 capitalize">
                    {result.type}
                  </span>
                </div>
              </button>
            ))}
          </div>

          {/* No results message */}
          {query.length > 0 && results.length === 0 && (
            <div className="px-4 py-6 text-center text-gray-500">
              <FiSearch className="mx-auto h-8 w-8 text-gray-300 mb-2" />
              <p className="text-sm">
                No results found for &quot;{query}&quot;
              </p>
              <p className="text-xs mt-1">
                Try searching for settings or features
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default UniversalSearch;
