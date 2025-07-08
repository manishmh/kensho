import { combineReducers, configureStore } from '@reduxjs/toolkit';
import locationReducer from './features/location/locationSlice';
import restaurantReducer from './features/restaurants/restaurantSlice';
import userReducer from './features/user/userSlice';

const rootReducer = combineReducers({
  user: userReducer,
  location: locationReducer,
  restaurants: restaurantReducer,
});

export const store = configureStore({
  reducer: rootReducer,
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
