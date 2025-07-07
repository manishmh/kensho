import { combineReducers, configureStore } from '@reduxjs/toolkit';
import locationReducer from './features/location/locationSlice';
import userReducer from './features/user/userSlice';

const rootReducer = combineReducers({
  user: userReducer,
  location: locationReducer,
});

export const store = configureStore({
  reducer: rootReducer,
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
