"use client";

import { useState } from "react";
import { DietaryPreferences, useOnboarding } from "../OnboardingContext";

export const DietaryPreferencesStep = () => {
  const { data, updateDietaryPreferences } = useOnboarding();
  const [customAllergy, setCustomAllergy] = useState("");

  const dietTypes = [
    {
      id: "non-vegetarian",
      label: "Non-Vegetarian",
      emoji: "🥩",
      description: "I eat all types of food",
    },
    {
      id: "vegetarian",
      label: "Vegetarian",
      emoji: "🥬",
      description: "No meat, but dairy & eggs are okay",
    },
    {
      id: "vegan",
      label: "Vegan",
      emoji: "🌱",
      description: "No animal products at all",
    },
    {
      id: "pescatarian",
      label: "Pescatarian",
      emoji: "🐟",
      description: "Vegetarian + fish & seafood",
    },
    {
      id: "flexitarian",
      label: "Flexitarian",
      emoji: "🥗",
      description: "Mostly vegetarian, occasional meat",
    },
  ];

  const commonAllergies = [
    { id: "nuts", label: "Nuts", emoji: "🥜" },
    { id: "dairy", label: "Dairy", emoji: "🥛" },
    { id: "gluten", label: "Gluten", emoji: "🌾" },
    { id: "eggs", label: "Eggs", emoji: "🥚" },
    { id: "seafood", label: "Seafood", emoji: "🦐" },
    { id: "soy", label: "Soy", emoji: "🫘" },
  ];

  const healthGoals = [
    { id: "weight-loss", label: "Weight Loss", emoji: "⚖️" },
    { id: "muscle-gain", label: "Muscle Gain", emoji: "💪" },
    { id: "heart-health", label: "Heart Health", emoji: "❤️" },
    { id: "diabetes-friendly", label: "Diabetes Friendly", emoji: "🩺" },
    { id: "low-sodium", label: "Low Sodium", emoji: "🧂" },
    { id: "high-protein", label: "High Protein", emoji: "🥩" },
  ];

  const handleDietTypeSelect = (dietType: DietaryPreferences["dietType"]) => {
    updateDietaryPreferences({ dietType });
  };

  const handleAllergyToggle = (allergy: string) => {
    const currentAllergies = data.dietaryPreferences.allergies;
    const newAllergies = currentAllergies.includes(allergy)
      ? currentAllergies.filter((a) => a !== allergy)
      : [...currentAllergies, allergy];
    updateDietaryPreferences({ allergies: newAllergies });
  };

  const handleHealthGoalToggle = (goal: string) => {
    const currentGoals = data.dietaryPreferences.healthGoals;
    const newGoals = currentGoals.includes(goal)
      ? currentGoals.filter((g) => g !== goal)
      : [...currentGoals, goal];
    updateDietaryPreferences({ healthGoals: newGoals });
  };

  const addCustomAllergy = () => {
    if (customAllergy.trim()) {
      const newAllergies = [
        ...data.dietaryPreferences.allergies,
        customAllergy.trim(),
      ];
      updateDietaryPreferences({ allergies: newAllergies });
      setCustomAllergy("");
    }
  };

  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <div className="text-6xl mb-4">🍽️</div>
        <h2 className="text-3xl font-bold text-gray-800 mb-2">
          Tell us about your dietary preferences
        </h2>
        <p className="text-gray-600 text-lg">
          This helps us recommend the perfect meals for you
        </p>
      </div>

      {/* Diet Type Selection */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-gray-800">
          What&apos;s your diet type?
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {dietTypes.map((diet) => (
            <button
              key={diet.id}
              onClick={() =>
                handleDietTypeSelect(diet.id as DietaryPreferences["dietType"])
              }
              className={`p-6 rounded-xl border-2 transition-all duration-300 transform hover:scale-105 ${
                data.dietaryPreferences.dietType === diet.id
                  ? "bg-orange-500 text-white border-orange-500 shadow-lg"
                  : "bg-white text-gray-700 border-gray-200 hover:border-orange-300 hover:bg-orange-50"
              }`}
            >
              <div className="text-4xl mb-2">{diet.emoji}</div>
              <div className="font-bold text-lg mb-1">{diet.label}</div>
              <div className="text-sm opacity-80">{diet.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Allergies */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-gray-800">
          Any allergies or foods to avoid?
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {commonAllergies.map((allergy) => (
            <button
              key={allergy.id}
              onClick={() => handleAllergyToggle(allergy.id)}
              className={`p-4 rounded-xl border-2 transition-all duration-300 transform hover:scale-105 ${
                data.dietaryPreferences.allergies.includes(allergy.id)
                  ? "bg-red-500 text-white border-red-500 shadow-lg"
                  : "bg-white text-gray-700 border-gray-200 hover:border-red-300 hover:bg-red-50"
              }`}
            >
              <div className="text-2xl mb-1">{allergy.emoji}</div>
              <div className="font-medium text-sm">{allergy.label}</div>
            </button>
          ))}
        </div>

        {/* Custom allergy input */}
        <div className="flex space-x-2">
          <input
            type="text"
            value={customAllergy}
            onChange={(e) => setCustomAllergy(e.target.value)}
            placeholder="Add custom allergy..."
            className="flex-1 px-4 py-3 bg-white border-2 border-gray-200 rounded-xl text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            onKeyPress={(e) => e.key === "Enter" && addCustomAllergy()}
          />
          <button
            onClick={addCustomAllergy}
            className="px-6 py-3 bg-orange-500 text-white rounded-xl border-2 border-orange-500 hover:bg-orange-600 transition-all duration-300"
          >
            Add
          </button>
        </div>

        {/* Display custom allergies */}
        {data.dietaryPreferences.allergies.filter(
          (a) => !commonAllergies.find((ca) => ca.id === a)
        ).length > 0 && (
          <div className="flex flex-wrap gap-2">
            {data.dietaryPreferences.allergies
              .filter((a) => !commonAllergies.find((ca) => ca.id === a))
              .map((allergy, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-red-500 text-white rounded-full text-sm font-medium flex items-center space-x-1"
                >
                  <span>{allergy}</span>
                  <button
                    onClick={() => handleAllergyToggle(allergy)}
                    className="text-white hover:text-red-200"
                  >
                    ×
                  </button>
                </span>
              ))}
          </div>
        )}
      </div>

      {/* Health Goals */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-gray-800">
          Any health goals? (Optional)
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {healthGoals.map((goal) => (
            <button
              key={goal.id}
              onClick={() => handleHealthGoalToggle(goal.id)}
              className={`p-4 rounded-xl border-2 transition-all duration-300 transform hover:scale-105 ${
                data.dietaryPreferences.healthGoals.includes(goal.id)
                  ? "bg-green-500 text-white border-green-500 shadow-lg"
                  : "bg-white text-gray-700 border-gray-200 hover:border-green-300 hover:bg-green-50"
              }`}
            >
              <div className="text-2xl mb-1">{goal.emoji}</div>
              <div className="font-medium text-sm">{goal.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Summary */}
      <div className="bg-orange-50 rounded-xl p-6 border border-orange-200">
        <h4 className="font-bold text-gray-800 mb-2">Your Preferences Summary:</h4>
        <div className="text-gray-600 space-y-1">
          <p>
            <strong>Diet:</strong>{" "}
            {data.dietaryPreferences.dietType
              ? dietTypes.find((d) => d.id === data.dietaryPreferences.dietType)
                  ?.label
              : "Not selected"}
          </p>
          <p>
            <strong>Allergies:</strong>{" "}
            {data.dietaryPreferences.allergies.length > 0
              ? data.dietaryPreferences.allergies.join(", ")
              : "None"}
          </p>
          <p>
            <strong>Health Goals:</strong>{" "}
            {data.dietaryPreferences.healthGoals.length > 0
              ? data.dietaryPreferences.healthGoals.join(", ")
              : "None"}
          </p>
        </div>
      </div>
    </div>
  );
};
