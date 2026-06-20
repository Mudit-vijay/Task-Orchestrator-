import { createSlice } from "@reduxjs/toolkit";
const userIdslice = createSlice({
  name: "userId",
  initialState: null,
  reducers: {
    setUserId: (state, action) => {
      state = action.payload;
    },
  },
});
export const { setUserId } = userIdslice.actions;
export default userIdslice.reducer;
