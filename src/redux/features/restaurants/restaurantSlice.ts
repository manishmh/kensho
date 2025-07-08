import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface LikedRestaurant {
  id: string;
  title: string;
  type: string;
  rating?: number;
  reviews?: number;
  price?: string;
  address: string;
  phone?: string;
  website?: string;
  thumbnail?: string;
  open_state?: string;
  category: string;
  likedAt: string;
}

interface RestaurantState {
  likedRestaurants: LikedRestaurant[];
  cachedRecommendations: {
    [locationKey: string]: {
      data: any;
      timestamp: number;
      expiresAt: number;
    };
  };
}

const initialState: RestaurantState = {
  likedRestaurants: [],
  cachedRecommendations: {},
};

const restaurantSlice = createSlice({
  name: 'restaurants',
  initialState,
  reducers: {
    addLikedRestaurant: (state, action: PayloadAction<LikedRestaurant>) => {
      const existing = state.likedRestaurants.find(
        (restaurant) => restaurant.id === action.payload.id
      );
      if (!existing) {
        state.likedRestaurants.unshift(action.payload);
      }
    },
    removeLikedRestaurant: (state, action: PayloadAction<string>) => {
      state.likedRestaurants = state.likedRestaurants.filter(
        (restaurant) => restaurant.id !== action.payload
      );
    },
    setLikedRestaurants: (state, action: PayloadAction<LikedRestaurant[]>) => {
      state.likedRestaurants = action.payload;
    },
    clearLikedRestaurants: (state) => {
      state.likedRestaurants = [];
    },
    setCachedRecommendations: (
      state,
      action: PayloadAction<{
        locationKey: string;
        data: any;
        ttl?: number; // Time to live in minutes, default 60
      }>
    ) => {
      const { locationKey, data, ttl = 60 } = action.payload;
      const now = Date.now();
      state.cachedRecommendations[locationKey] = {
        data,
        timestamp: now,
        expiresAt: now + ttl * 60 * 1000,
      };
    },
    clearExpiredCache: (state) => {
      const now = Date.now();
      Object.keys(state.cachedRecommendations).forEach((key) => {
        if (state.cachedRecommendations[key].expiresAt < now) {
          delete state.cachedRecommendations[key];
        }
      });
    },
    clearAllCache: (state) => {
      state.cachedRecommendations = {};
    },
  },
});

export const {
  addLikedRestaurant,
  removeLikedRestaurant,
  setLikedRestaurants,
  clearLikedRestaurants,
  setCachedRecommendations,
  clearExpiredCache,
  clearAllCache,
} = restaurantSlice.actions;

export default restaurantSlice.reducer; 