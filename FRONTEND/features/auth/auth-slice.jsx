import { createSlice } from "@reduxjs/toolkit";

export const authSlice = createSlice({
  name: "auth",
  initialState: {
    name: "",
    email: "",
    isAuthenticated: false,
    role: " ",
  },
  reducers: {
    setName: (state, action) => {
      state.name = action.payload;
    },
    setEmail: (state, action) => {
      state.email = action.payload;
    },
    login: (state) => {
      state.isAuthenticated = true; // 👈 update on login
    },
    logout: (state) => {
      state.isAuthenticated = false; // 👈 update on logout
    },
    setRole: (state, action) => {
      state.role = action.payload;
    },
  },
});

export const { setName, setEmail, login, logout, setRole } = authSlice.actions;

export default authSlice.reducer;
