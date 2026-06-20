import { createSlice } from "@reduxjs/toolkit";

const tokenslice = createSlice({
  name: "token",
  initialState: {
    tokenn:"",
  },
  reducers: {
    setToken: (state, action) => {
      state.tokenn= action.payload;  // ✅ return the new token value
    },
  },
});

export const { setToken } = tokenslice.actions;
export default tokenslice.reducer;
