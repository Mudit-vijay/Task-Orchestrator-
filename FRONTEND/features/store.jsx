/* eslint-disable no-unused-vars */
import { configureStore } from "@reduxjs/toolkit";
import storage from "redux-persist/lib/storage"; // defaults to localStorage for web
import { persistReducer, persistStore } from "redux-persist";
import { combineReducers } from "redux";

import authReducer from "./auth/auth-slice";
import otpReducer from "./auth/authsliceii.jsx";
import idReducer from "./userID/userId-slics.jsx";
// Persist config for selected reducers
const authPersistConfig = {
  key: "auth",
  storage,
};

// Wrap only the reducers you want persisted
const rootReducer = combineReducers({
  auth: persistReducer(authPersistConfig, authReducer), // persisted
  otp: otpReducer, // normal (not persisted)
  id: persistReducer(authPersistConfig, idReducer),
});

const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false, // required for redux-persist
    }),
});

export const persistor = persistStore(store);
export default store;
