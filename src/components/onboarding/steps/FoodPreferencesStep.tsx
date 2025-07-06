"use client";

import { FoodPreference, useOnboarding } from "../OnboardingContext";

export const FoodPreferencesStep = () => {
  const { data, addFoodPreference, updateFoodPreference } = useOnboarding();

  const foodComparisons = [
    {
      category: "Fast Food",
      options: [
        { name: "Pizza", emoji: "🍕", description: "Cheesy, saucy goodness" },
        {
          name: "Burger",
          emoji: "🍔",
          description: "Juicy patty with toppings",
        },
      ],
    },
    {
      category: "Asian Cuisine",
      options: [
        { name: "Sushi", emoji: "🍣", description: "Fresh fish and rice" },
        { name: "Ramen", emoji: "🍜", description: "Hot noodle soup" },
      ],
    },
    {
      category: "Comfort Food",
      options: [
        {
          name: "Pasta",
          emoji: "🍝",
          description: "Italian noodles with sauce",
        },
        { name: "Tacos", emoji: "🌮", description: "Mexican tortilla wraps" },
      ],
    },
    {
      category: "Healthy Options",
      options: [
        { name: "Salad", emoji: "🥗", description: "Fresh greens and veggies" },
        {
          name: "Smoothie Bowl",
          emoji: "🍓",
          description: "Blended fruits and toppings",
        },
      ],
    },
    {
      category: "Desserts",
      options: [
        {
          name: "Ice Cream",
          emoji: "🍦",
          description: "Cold and creamy treat",
        },
        { name: "Cake", emoji: "🍰", description: "Sweet layered dessert" },
      ],
    },
    {
      category: "Beverages",
      options: [
        { name: "Coffee", emoji: "☕", description: "Rich caffeinated drink" },
        { name: "Tea", emoji: "🍵", description: "Soothing herbal beverage" },
      ],
    },
  ];

  const individualFoods = [
    { name: "Chocolate", emoji: "🍫", category: "Sweets" },
    { name: "Avocado", emoji: "🥑", category: "Healthy" },
    { name: "Cheese", emoji: "🧀", category: "Dairy" },
    { name: "Spicy Food", emoji: "🌶️", category: "Spicy" },
    { name: "Seafood", emoji: "🦐", category: "Protein" },
    { name: "Bread", emoji: "🍞", category: "Carbs" },
  ];

  const preferenceEmojis = {
    love: "😍",
    like: "😊",
    neutral: "😐",
    dislike: "😕",
    hate: "😤",
  };

  const handleFoodComparison = (
    food1: string,
    food2: string,
    category: string,
    selected: string
  ) => {
    // Update or add preference for selected food
    const existingPreference = data.foodPreferences.find(
      (fp) => fp.foodItem === selected
    );
    if (existingPreference) {
      updateFoodPreference(selected, "love");
    } else {
      addFoodPreference({
        foodItem: selected,
        preference: "love",
        category: category,
      });
    }

    // Update or add neutral preference for non-selected food
    const otherFood = selected === food1 ? food2 : food1;
    const otherExisting = data.foodPreferences.find(
      (fp) => fp.foodItem === otherFood
    );
    if (otherExisting) {
      updateFoodPreference(otherFood, "like");
    } else {
      addFoodPreference({
        foodItem: otherFood,
        preference: "like",
        category: category,
      });
    }
  };

  const handleIndividualFoodPreference = (
    food: string,
    preference: FoodPreference["preference"],
    category: string
  ) => {
    const existingPreference = data.foodPreferences.find(
      (fp) => fp.foodItem === food
    );
    if (existingPreference) {
      updateFoodPreference(food, preference);
    } else {
      addFoodPreference({
        foodItem: food,
        preference: preference,
        category: category,
      });
    }
  };

  const getFoodPreference = (
    food: string
  ): FoodPreference["preference"] | null => {
    const preference = data.foodPreferences.find((fp) => fp.foodItem === food);
    return preference?.preference || null;
  };

  const getSelectedInComparison = (
    food1: string,
    food2: string
  ): string | null => {
    const pref1 = getFoodPreference(food1);
    const pref2 = getFoodPreference(food2);

    if (pref1 === "love" && pref2 === "like") return food1;
    if (pref2 === "love" && pref1 === "like") return food2;
    return null;
  };

  return (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <div className="text-6xl mb-4">🤔</div>
        <h2 className="text-3xl font-bold text-gray-800 mb-2">
          What are your food preferences?
        </h2>
        <p className="text-gray-600 text-lg">
          Help us understand what you love to eat!
        </p>
      </div>

      {/* Food Comparisons */}
      <div className="space-y-8">
        <h3 className="text-2xl font-bold text-gray-800 text-center">
          Choose your favorites!
        </h3>

        {foodComparisons.map((comparison, index) => (
          <div key={index} className="space-y-4">
            <h4 className="text-lg font-semibold text-gray-700 text-center">
              {comparison.category}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {comparison.options.map((option, optionIndex) => {
                const isSelected =
                  getSelectedInComparison(
                    comparison.options[0].name,
                    comparison.options[1].name
                  ) === option.name;

                return (
                  <button
                    key={optionIndex}
                    onClick={() =>
                      handleFoodComparison(
                        comparison.options[0].name,
                        comparison.options[1].name,
                        comparison.category,
                        option.name
                      )
                    }
                    className={`p-8 rounded-2xl border-3 transition-all duration-300 transform hover:scale-105 ${
                      isSelected
                        ? "bg-orange-500 text-white border-orange-500 shadow-2xl scale-105"
                        : "bg-white text-gray-700 border-gray-200 hover:border-orange-300 hover:bg-orange-50"
                    }`}
                  >
                    <div className="text-6xl mb-4">{option.emoji}</div>
                    <div className="font-bold text-2xl mb-2">{option.name}</div>
                    <div className="text-sm opacity-80">
                      {option.description}
                    </div>
                    {isSelected && (
                      <div className="mt-4 text-2xl">✨ Chosen!</div>
                    )}
                  </button>
                );
              })}
            </div>
            <div className="text-center">
              <span className="text-gray-400 text-sm">vs</span>
            </div>
          </div>
        ))}
      </div>

      {/* Individual Food Preferences */}
      <div className="space-y-6">
        <h3 className="text-2xl font-bold text-gray-800 text-center">
          Rate these foods
        </h3>
        <p className="text-gray-600 text-center">
          Click the emoji that matches your feeling!
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {individualFoods.map((food, index) => {
            const currentPreference = getFoodPreference(food.name);

            return (
              <div
                key={index}
                className="bg-white rounded-xl p-6 border-2 border-gray-200 hover:border-orange-300 transition-all duration-300"
              >
                <div className="text-center mb-4">
                  <div className="text-4xl mb-2">{food.emoji}</div>
                  <div className="font-bold text-gray-800 text-lg">
                    {food.name}
                  </div>
                </div>

                <div className="flex justify-center space-x-2">
                  {Object.entries(preferenceEmojis).map(
                    ([preference, emoji]) => (
                      <button
                        key={preference}
                        onClick={() =>
                          handleIndividualFoodPreference(
                            food.name,
                            preference as FoodPreference["preference"],
                            food.category
                          )
                        }
                        className={`w-12 h-12 rounded-full text-2xl transition-all duration-300 transform hover:scale-110 ${
                          currentPreference === preference
                            ? "bg-orange-500 text-white shadow-lg scale-110"
                            : "bg-gray-100 hover:bg-orange-100"
                        }`}
                      >
                        {emoji}
                      </button>
                    )
                  )}
                </div>

                {currentPreference && (
                  <div className="text-center mt-2">
                    <span className="text-sm text-gray-600">
                      {currentPreference === "love" && "Love it!"}
                      {currentPreference === "like" && "Like it"}
                      {currentPreference === "neutral" && "Neutral"}
                      {currentPreference === "dislike" && "Dislike"}
                      {currentPreference === "hate" && "Hate it"}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Summary */}
      <div className="bg-orange-50 rounded-xl p-6 border border-orange-200">
        <h4 className="font-bold text-gray-800 mb-2">
          Your Food Preferences Summary:
        </h4>
        <div className="text-gray-600 space-y-2">
          <p>
            <strong>Favorites:</strong>{" "}
            {data.foodPreferences.filter((fp) => fp.preference === "love")
              .length > 0
              ? data.foodPreferences
                  .filter((fp) => fp.preference === "love")
                  .map((fp) => fp.foodItem)
                  .join(", ")
              : "None selected yet"}
          </p>
          <p>
            <strong>Dislikes:</strong>{" "}
            {data.foodPreferences.filter(
              (fp) => fp.preference === "dislike" || fp.preference === "hate"
            ).length > 0
              ? data.foodPreferences
                  .filter(
                    (fp) =>
                      fp.preference === "dislike" || fp.preference === "hate"
                  )
                  .map((fp) => fp.foodItem)
                  .join(", ")
              : "None"}
          </p>
        </div>
      </div>
    </div>
  );
};
