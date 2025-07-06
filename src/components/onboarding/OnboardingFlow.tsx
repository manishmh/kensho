"use client";

import { completeOnboarding as completeOnboardingAction } from "@/actions/complete-onboarding";
import { useRouter } from "next/navigation";
import { OnboardingProvider, useOnboarding } from "./OnboardingContext";
import { CustomFoodsStep } from "./steps/CustomFoodsStep";
import { DietaryPreferencesStep } from "./steps/DietaryPreferencesStep";
import { FoodPreferencesStep } from "./steps/FoodPreferencesStep";
import { PersonalInfoStep } from "./steps/PersonalInfoStep";

const OnboardingContent = () => {
  const {
    data,
    nextStep,
    prevStep,
    completeOnboarding,
    getKnowledgeGraphData,
  } = useOnboarding();
  const router = useRouter();

  const steps = [
    { title: "Personal Info", component: PersonalInfoStep },
    { title: "Dietary Preferences", component: DietaryPreferencesStep },
    { title: "Food Preferences", component: FoodPreferencesStep },
    { title: "Custom Foods", component: CustomFoodsStep },
  ];

  const currentStepComponent = steps[data.currentStep]?.component;
  const CurrentComponent = currentStepComponent || PersonalInfoStep;

  const handleNext = async () => {
    if (data.currentStep < steps.length - 1) {
      nextStep();
    } else {
      // Complete onboarding
      completeOnboarding();
      const knowledgeGraphData = getKnowledgeGraphData();
      console.log(
        "Knowledge Graph Data:",
        JSON.stringify(knowledgeGraphData, null, 2)
      );

      // Mark onboarding as completed in database
      try {
        const result = await completeOnboardingAction(knowledgeGraphData);
        if (result.error) {
          console.error("Failed to complete onboarding:", result.error);
          // Could show an error message to user here
        }
      } catch (error) {
        console.error("Error completing onboarding:", error);
      }

      // Redirect to home page
      router.push("/");
    }
  };

  const handlePrev = () => {
    if (data.currentStep > 0) {
      prevStep();
    }
  };

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Subtle background decorative elements */}
      <div className="absolute top-16 left-16 w-16 h-16 bg-orange-100 rounded-full animate-bounce delay-300">
        <div className="w-full h-full flex items-center justify-center text-2xl">
          🍔
        </div>
      </div>
      <div className="absolute bottom-16 right-16 w-12 h-12 bg-orange-100 rounded-full animate-bounce delay-700">
        <div className="w-full h-full flex items-center justify-center text-xl">
          🍕
        </div>
      </div>
      <div className="absolute top-1/2 left-8 w-14 h-14 bg-orange-100 rounded-full animate-bounce delay-1000">
        <div className="w-full h-full flex items-center justify-center text-xl">
          ☕
        </div>
      </div>
      <div className="absolute bottom-1/3 left-1/4 w-10 h-10 bg-orange-100 rounded-full animate-bounce delay-500">
        <div className="w-full h-full flex items-center justify-center text-lg">
          🍩
        </div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Welcome to Kensho! 🍽️
          </h1>
          <p className="text-gray-600 text-lg">
            Let&apos;s personalize your food experience
          </p>
        </div>

        {/* Progress bar */}
        <div className="max-w-2xl mx-auto mb-8">
          <div className="flex items-center justify-between mb-4">
            {steps.map((step, index) => (
              <div key={index} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                    index <= data.currentStep
                      ? "bg-orange-500 text-white shadow-lg"
                      : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {index + 1}
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`h-1 w-16 mx-2 transition-all duration-300 ${
                      index < data.currentStep ? "bg-orange-500" : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="text-center">
            <span className="text-gray-700 font-medium">
              Step {data.currentStep + 1} of {steps.length}:{" "}
              {steps[data.currentStep]?.title}
            </span>
          </div>
        </div>

        {/* Step content */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200">
            <CurrentComponent />
          </div>
        </div>

        {/* Navigation buttons */}
        <div className="max-w-4xl mx-auto mt-8 flex justify-between">
          <button
            onClick={handlePrev}
            disabled={data.currentStep === 0}
            className={`px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
              data.currentStep === 0
                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300 hover:scale-105"
            }`}
          >
            ← Previous
          </button>

          <button
            onClick={handleNext}
            className="px-8 py-3 bg-orange-500 text-white font-bold rounded-xl shadow-lg hover:bg-orange-600 transition-all duration-300 transform hover:scale-105"
          >
            {data.currentStep === steps.length - 1 ? "🎉 Finish" : "Next →"}
          </button>
        </div>
      </div>
    </div>
  );
};

export const OnboardingFlow = () => {
  return (
    <OnboardingProvider>
      <OnboardingContent />
    </OnboardingProvider>
  );
};
