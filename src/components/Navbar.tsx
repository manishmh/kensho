"use client";

import { logout } from "@/actions/logout";
import { useAppSelector } from "@/redux/hooks";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";
import { FiChevronDown, FiHeart, FiLogOut, FiUser } from "react-icons/fi";
import { toast } from "sonner";
import UniversalSearch from "./UniversalSearch";

const Navbar: React.FC = () => {
  const router = useRouter();
  const { data: session } = useSession();
  const likedRestaurants = useAppSelector(
    (state) => state.restaurants.likedRestaurants
  );
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close profile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target as Node)
      ) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Logged out successfully");
      router.push("/login");
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Failed to logout");
    }
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-16 gap-4">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <h1 className="text-2xl font-bold text-orange-500">Kensho</h1>
            </Link>
          </div>

          {/* Universal Search */}
          <UniversalSearch />

          {/* Liked Restaurants */}
          {session?.user && (
            <Link
              href="/liked-restaurants"
              className="relative flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-orange-600 transition-colors"
            >
              <FiHeart className="w-5 h-5" />
              {likedRestaurants.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {likedRestaurants.length > 99
                    ? "99+"
                    : likedRestaurants.length}
                </span>
              )}
              <span className="hidden sm:inline">Favorites</span>
            </Link>
          )}

          {/* User Profile */}
          {session?.user && (
            <div className="relative ml-auto" ref={profileRef}>
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white font-medium">
                  {session.user.name
                    ? session.user.name[0].toUpperCase()
                    : session.user.email?.[0].toUpperCase()}
                </div>
                <div className="text-left">
                  <div className="text-sm font-medium">
                    {session.user.name || "User"}
                  </div>
                  <div className="text-xs text-gray-500">
                    {session.user.email}
                  </div>
                </div>
                <FiChevronDown
                  className={`w-4 h-4 text-gray-500 transition-transform ${
                    isProfileOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {isProfileOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                  <div className="p-2">
                    <Link
                      href="/profile"
                      className="flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      <FiUser className="w-4 h-4" />
                      <span className="text-sm">Profile</span>
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <FiLogOut className="w-4 h-4" />
                      <span className="text-sm">Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
