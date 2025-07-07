import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Location {
  id?: string;
  type: 'HOME' | 'OFFICE' | 'OTHER';
  label?: string;
  address: string;
  formattedAddress: string;
  placeId?: string;
  latitude: number;
  longitude: number;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  isDefault?: boolean;
}

interface LocationState {
  currentLocation: Location | null;
  savedLocations: Location[];
  isLoading: boolean;
  error: string | null;
  locationPermission: 'granted' | 'denied' | 'prompt' | null;
}

const initialState: LocationState = {
  currentLocation: null,
  savedLocations: [],
  isLoading: false,
  error: null,
  locationPermission: null,
};

const locationSlice = createSlice({
  name: 'location',
  initialState,
  reducers: {
    setCurrentLocation: (state, action: PayloadAction<Location>) => {
      state.currentLocation = action.payload;
      state.error = null;
    },
    setSavedLocations: (state, action: PayloadAction<Location[]>) => {
      state.savedLocations = action.payload;
      state.error = null;
    },
    addSavedLocation: (state, action: PayloadAction<Location>) => {
      state.savedLocations.push(action.payload);
      state.error = null;
    },
    updateSavedLocation: (state, action: PayloadAction<Location>) => {
      const index = state.savedLocations.findIndex(loc => loc.id === action.payload.id);
      if (index !== -1) {
        state.savedLocations[index] = action.payload;
      }
      state.error = null;
    },
    removeSavedLocation: (state, action: PayloadAction<string>) => {
      state.savedLocations = state.savedLocations.filter(loc => loc.id !== action.payload);
      state.error = null;
    },
    setLocationPermission: (state, action: PayloadAction<'granted' | 'denied' | 'prompt'>) => {
      state.locationPermission = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.isLoading = false;
    },
    clearLocation: (state) => {
      state.currentLocation = null;
      state.error = null;
    },
  },
});

export const {
  setCurrentLocation,
  setSavedLocations,
  addSavedLocation,
  updateSavedLocation,
  removeSavedLocation,
  setLocationPermission,
  setLoading,
  setError,
  clearLocation,
} = locationSlice.actions;

export default locationSlice.reducer; 