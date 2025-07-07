"use client";

import { useState } from "react";
import { useOnboarding } from "../OnboardingContext";

export const PersonalInfoStep = () => {
  const { data, updatePersonalInfo } = useOnboarding();
  const [localData, setLocalData] = useState({
    name: data.personalInfo.name,
    age: data.personalInfo.age?.toString() || "",
    location: data.personalInfo.location,
  });

  const handleInputChange = (field: string, value: string) => {
    setLocalData((prev) => ({ ...prev, [field]: value }));

    if (field === "age") {
      const ageNum = value ? parseInt(value) : null;
      updatePersonalInfo({ [field]: ageNum });
    } else {
      updatePersonalInfo({ [field]: value });
    }
  };

  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <div className="text-6xl mb-4">👋</div>
        <h2 className="text-3xl font-bold text-gray-800 mb-2">
          Nice to meet you!
        </h2>
        <p className="text-gray-600 text-lg">
          Let&apos;s start with some basic information about you
        </p>
      </div>

      <div className="space-y-6">
        {/* Name Input */}
        <div className="space-y-3">
          <label className="block text-gray-800 font-medium text-lg">
            What&apos;s your name?
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <span className="text-2xl">🙂</span>
            </div>
            <input
              type="text"
              autoFocus
              value={localData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              placeholder="Enter your name"
              className="w-full pl-14 pr-4 py-4 bg-white border-2 border-gray-200 rounded-xl text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-lg font-medium transition-all duration-300"
            />
          </div>
        </div>

        {/* Age Input */}
        <div className="space-y-3">
          <label className="block text-gray-800 font-medium text-lg">
            How old are you?
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <span className="text-2xl">🎂</span>
            </div>
            <input
              type="number"
              value={localData.age}
              onChange={(e) => handleInputChange("age", e.target.value)}
              placeholder="Enter your age"
              min="13"
              max="120"
              className="w-full pl-14 pr-4 py-4 bg-white border-2 border-gray-200 rounded-xl text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-lg font-medium transition-all duration-300"
            />
          </div>
        </div>

        {/* Location Input */}
        <div className="space-y-3">
          <label className="block text-gray-800 font-medium text-lg">
            Where are you located?
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <span className="text-2xl">📍</span>
            </div>
            <input
              type="text"
              value={localData.location}
              onChange={(e) => handleInputChange("location", e.target.value)}
              placeholder="Enter your city or region"
              className="w-full pl-14 pr-4 py-4 bg-white border-2 border-gray-200 rounded-xl text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-lg font-medium transition-all duration-300"
            />
          </div>
          <p className="text-gray-500 text-sm">
            This helps us suggest local restaurants and cuisines
          </p>
        </div>
      </div>

      {/* Fun fact box */}
      <div className="bg-orange-50 rounded-xl p-6 border border-orange-200">
        <div className="flex items-center space-x-3">
          <span className="text-2xl">💡</span>
          <div>
            <h3 className="text-gray-800 font-medium">Did you know?</h3>
            <p className="text-gray-600 text-sm">
              We use this information to personalize your food recommendations
              and find restaurants near you!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
