"use client";

import { useState } from "react";
import { useOnboarding } from "../OnboardingContext";

export const CustomFoodsStep = () => {
  const { data, updateCustomFoods, getKnowledgeGraphData } = useOnboarding();
  const [likedFood, setLikedFood] = useState("");
  const [dislikedFood, setDislikedFood] = useState("");

  const addLikedFood = () => {
    if (likedFood.trim()) {
      const newLikedFoods = [...data.customFoods.likedFoods, likedFood.trim()];
      updateCustomFoods({ likedFoods: newLikedFoods });
      setLikedFood("");
    }
  };

  const addDislikedFood = () => {
    if (dislikedFood.trim()) {
      const newDislikedFoods = [
        ...data.customFoods.dislikedFoods,
        dislikedFood.trim(),
      ];
      updateCustomFoods({ dislikedFoods: newDislikedFoods });
      setDislikedFood("");
    }
  };

  const removeLikedFood = (food: string) => {
    const newLikedFoods = data.customFoods.likedFoods.filter((f) => f !== food);
    updateCustomFoods({ likedFoods: newLikedFoods });
  };

  const removeDislikedFood = (food: string) => {
    const newDislikedFoods = data.customFoods.dislikedFoods.filter(
      (f) => f !== food
    );
    updateCustomFoods({ dislikedFoods: newDislikedFoods });
  };

  const handleKeyPress = (
    e: React.KeyboardEvent,
    type: "liked" | "disliked"
  ) => {
    if (e.key === "Enter") {
      if (type === "liked") {
        addLikedFood();
      } else {
        addDislikedFood();
      }
    }
  };

  const previewData = () => {
    const knowledgeGraphData = getKnowledgeGraphData();
    console.log(
      "Final Knowledge Graph Data:",
      JSON.stringify(knowledgeGraphData, null, 2)
    );
  };

  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <div className="text-6xl mb-4">✨</div>
        <h2 className="text-3xl font-bold text-gray-800 mb-2">
          Almost done! Any specific foods?
        </h2>
        <p className="text-gray-600 text-lg">
          Tell us about any other foods you love or want to avoid (optional)
        </p>
      </div>

      {/* Liked Foods Section */}
      <div className="space-y-6">
        <div className="bg-green-50 rounded-xl p-6 border-2 border-green-200">
          <div className="flex items-center space-x-3 mb-4">
            <span className="text-3xl">😍</span>
            <h3 className="text-xl font-bold text-gray-800">
              Foods you absolutely love
            </h3>
          </div>

          <div className="flex space-x-2 mb-4">
            <input
              type="text"
              value={likedFood}
              onChange={(e) => setLikedFood(e.target.value)}
              onKeyPress={(e) => handleKeyPress(e, "liked")}
              placeholder="e.g., Thai curry, chocolate chip cookies, grilled salmon..."
              className="flex-1 px-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
            <button
              onClick={addLikedFood}
              className="px-6 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-all duration-300 font-medium"
            >
              Add
            </button>
          </div>

          {/* Display liked foods */}
          {data.customFoods.likedFoods.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {data.customFoods.likedFoods.map((food, index) => (
                <span
                  key={index}
                  className="px-4 py-2 bg-green-500 text-white rounded-full text-sm font-medium flex items-center space-x-2 transition-all duration-300 hover:bg-green-600"
                >
                  <span>😍 {food}</span>
                  <button
                    onClick={() => removeLikedFood(food)}
                    className="text-white hover:text-green-200 font-bold"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}

          {data.customFoods.likedFoods.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <span className="text-4xl mb-2 block">🤷‍♀️</span>
              <p>No specific foods added yet. That&apos;s totally fine!</p>
            </div>
          )}
        </div>

        {/* Disliked Foods Section */}
        <div className="bg-red-50 rounded-xl p-6 border-2 border-red-200">
          <div className="flex items-center space-x-3 mb-4">
            <span className="text-3xl">😤</span>
            <h3 className="text-xl font-bold text-gray-800">
              Foods you want to avoid
            </h3>
          </div>

          <div className="flex space-x-2 mb-4">
            <input
              type="text"
              value={dislikedFood}
              onChange={(e) => setDislikedFood(e.target.value)}
              onKeyPress={(e) => handleKeyPress(e, "disliked")}
              placeholder="e.g., mushrooms, spicy food, liver..."
              className="flex-1 px-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
            />
            <button
              onClick={addDislikedFood}
              className="px-6 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-all duration-300 font-medium"
            >
              Add
            </button>
          </div>

          {/* Display disliked foods */}
          {data.customFoods.dislikedFoods.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {data.customFoods.dislikedFoods.map((food, index) => (
                <span
                  key={index}
                  className="px-4 py-2 bg-red-500 text-white rounded-full text-sm font-medium flex items-center space-x-2 transition-all duration-300 hover:bg-red-600"
                >
                  <span>😤 {food}</span>
                  <button
                    onClick={() => removeDislikedFood(food)}
                    className="text-white hover:text-red-200 font-bold"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}

          {data.customFoods.dislikedFoods.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <span className="text-4xl mb-2 block">🤷‍♂️</span>
              <p>No foods to avoid. You&apos;re adventurous!</p>
            </div>
          )}
        </div>
      </div>

      {/* Summary Section */}
      <div className="bg-orange-50 rounded-xl p-6 border-2 border-orange-200">
        <div className="text-center">
          <span className="text-3xl mb-3 block">📋</span>
          <h3 className="text-xl font-bold text-gray-800 mb-4">
            Your Profile Summary
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="font-semibold text-gray-800">Personal Info</div>
              <div className="text-gray-600">
                {data.personalInfo.name && `${data.personalInfo.name}, `}
                {data.personalInfo.age && `${data.personalInfo.age} years`}
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="font-semibold text-gray-800">Diet Type</div>
              <div className="text-gray-600">
                {data.dietaryPreferences.dietType || "Not specified"}
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="font-semibold text-gray-800">
                Food Preferences
              </div>
              <div className="text-gray-600">
                {data.foodPreferences.length} items rated
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="font-semibold text-gray-800">Custom Foods</div>
              <div className="text-gray-600">
                {data.customFoods.likedFoods.length +
                  data.customFoods.dislikedFoods.length}{" "}
                added
              </div>
            </div>
          </div>
        </div>

        {/* Preview button */}
        <div className="mt-6 text-center">
          <button
            onClick={previewData}
            className="px-6 py-3 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-all duration-300 font-medium"
          >
            🔍 Preview Your Data (Check Console)
          </button>
        </div>
      </div>

      {/* Completion message */}
      <div className="text-center bg-gradient-to-r from-orange-100 to-yellow-100 rounded-xl p-8 border-2 border-orange-200">
        <div className="text-6xl mb-4">🎉</div>
        <h3 className="text-2xl font-bold text-gray-800 mb-2">
          You&apos;re all set!
        </h3>
        <p className="text-gray-600 text-lg mb-4">
          Click &quot;Finish&quot; to complete your onboarding and start
          discovering amazing food recommendations!
        </p>
        <div className="text-sm text-gray-500">
          We&apos;ll use this information to create your personalized food AI
          assistant
        </div>
      </div>
    </div>
  );
};
