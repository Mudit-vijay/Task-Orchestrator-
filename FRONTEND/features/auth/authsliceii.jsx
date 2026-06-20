import { createSlice } from "@reduxjs/toolkit";

const authSliceii = createSlice({
  name: "authh",
  initialState: {
    otp: " ",
    token: null,
    user: null,
  },
  reducers: {
    setOtp: (state, action) => {
      state.otp = action.payload;
    },
  },
});

export const { setOtp } = authSliceii.actions;
export default authSliceii.reducer;
