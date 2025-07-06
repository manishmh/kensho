"use client";

import React, { createContext, ReactNode, useContext, useState } from "react";

// Types for knowledge graph data structure
export interface PersonalInfo {
  name: string;
  age: number | null;
  location: string;
}

export interface DietaryPreferences {
  dietType:
    | "vegetarian"
    | "vegan"
    | "non-vegetarian"
    | "pescatarian"
    | "flexitarian"
    | null;
  allergies: string[];
  restrictions: string[];
  healthGoals: string[];
}

export interface FoodPreference {
  foodItem: string;
  preference: "love" | "like" | "neutral" | "dislike" | "hate";
  category: string;
}

export interface CustomFoods {
  likedFoods: string[];
  dislikedFoods: string[];
}

export interface OnboardingData {
  personalInfo: PersonalInfo;
  dietaryPreferences: DietaryPreferences;
  foodPreferences: FoodPreference[];
  customFoods: CustomFoods;
  currentStep: number;
  isCompleted: boolean;
}

// Initial state
const initialData: OnboardingData = {
  personalInfo: {
    name: "",
    age: null,
    location: "",
  },
  dietaryPreferences: {
    dietType: null,
    allergies: [],
    restrictions: [],
    healthGoals: [],
  },
  foodPreferences: [],
  customFoods: {
    likedFoods: [],
    dislikedFoods: [],
  },
  currentStep: 0,
  isCompleted: false,
};

// Context type
interface OnboardingContextType {
  data: OnboardingData;
  updatePersonalInfo: (info: Partial<PersonalInfo>) => void;
  updateDietaryPreferences: (prefs: Partial<DietaryPreferences>) => void;
  addFoodPreference: (preference: FoodPreference) => void;
  updateFoodPreference: (
    foodItem: string,
    preference: FoodPreference["preference"]
  ) => void;
  updateCustomFoods: (foods: Partial<CustomFoods>) => void;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (step: number) => void;
  completeOnboarding: () => void;
  resetOnboarding: () => void;
  getKnowledgeGraphData: () => Record<string, unknown>;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(
  undefined
);

export const useOnboarding = () => {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error("useOnboarding must be used within an OnboardingProvider");
  }
  return context;
};

interface OnboardingProviderProps {
  children: ReactNode;
}

export const OnboardingProvider: React.FC<OnboardingProviderProps> = ({
  children,
}) => {
  const [data, setData] = useState<OnboardingData>(initialData);

  const updatePersonalInfo = (info: Partial<PersonalInfo>) => {
    setData((prev) => ({
      ...prev,
      personalInfo: { ...prev.personalInfo, ...info },
    }));
  };

  const updateDietaryPreferences = (prefs: Partial<DietaryPreferences>) => {
    setData((prev) => ({
      ...prev,
      dietaryPreferences: { ...prev.dietaryPreferences, ...prefs },
    }));
  };

  const addFoodPreference = (preference: FoodPreference) => {
    setData((prev) => ({
      ...prev,
      foodPreferences: [...prev.foodPreferences, preference],
    }));
  };

  const updateFoodPreference = (
    foodItem: string,
    preference: FoodPreference["preference"]
  ) => {
    setData((prev) => ({
      ...prev,
      foodPreferences: prev.foodPreferences.map((fp) =>
        fp.foodItem === foodItem ? { ...fp, preference } : fp
      ),
    }));
  };

  const updateCustomFoods = (foods: Partial<CustomFoods>) => {
    setData((prev) => ({
      ...prev,
      customFoods: { ...prev.customFoods, ...foods },
    }));
  };

  const nextStep = () => {
    setData((prev) => ({
      ...prev,
      currentStep: Math.min(prev.currentStep + 1, 3),
    }));
  };

  const prevStep = () => {
    setData((prev) => ({
      ...prev,
      currentStep: Math.max(prev.currentStep - 1, 0),
    }));
  };

  const goToStep = (step: number) => {
    setData((prev) => ({
      ...prev,
      currentStep: Math.max(0, Math.min(step, 3)),
    }));
  };

  const completeOnboarding = () => {
    setData((prev) => ({
      ...prev,
      isCompleted: true,
    }));
  };

  const resetOnboarding = () => {
    setData(initialData);
  };

  // Format data for knowledge graph
  const getKnowledgeGraphData = () => {
    const { personalInfo, dietaryPreferences, foodPreferences, customFoods } =
      data;

    return {
      user: {
        profile: {
          name: personalInfo.name,
          age: personalInfo.age,
          location: personalInfo.location,
        },
        dietary: {
          type: dietaryPreferences.dietType,
          restrictions: [
            ...dietaryPreferences.allergies.map((a) => ({
              type: "allergy",
              value: a,
            })),
            ...dietaryPreferences.restrictions.map((r) => ({
              type: "restriction",
              value: r,
            })),
          ],
          goals: dietaryPreferences.healthGoals,
        },
        preferences: {
          foods: foodPreferences.reduce((acc, fp) => {
            acc[fp.foodItem] = {
              preference: fp.preference,
              category: fp.category,
              weight: getPreferenceWeight(fp.preference),
            };
            return acc;
          }, {} as Record<string, unknown>),
          customLikes: customFoods.likedFoods.map((food) => ({
            food,
            preference: "love",
            weight: 5,
            source: "user_input",
          })),
          customDislikes: customFoods.dislikedFoods.map((food) => ({
            food,
            preference: "hate",
            weight: 1,
            source: "user_input",
          })),
        },
        completedAt: new Date().toISOString(),
      },
    };
  };

  // Helper function to convert preference to numerical weight for AI
  const getPreferenceWeight = (
    preference: FoodPreference["preference"]
  ): number => {
    const weights = {
      hate: 1,
      dislike: 2,
      neutral: 3,
      like: 4,
      love: 5,
    };
    return weights[preference];
  };

  const value: OnboardingContextType = {
    data,
    updatePersonalInfo,
    updateDietaryPreferences,
    addFoodPreference,
    updateFoodPreference,
    updateCustomFoods,
    nextStep,
    prevStep,
    goToStep,
    completeOnboarding,
    resetOnboarding,
    getKnowledgeGraphData,
  };

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
};
