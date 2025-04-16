import { createSlice } from "@reduxjs/toolkit";

const checkouSlice = createSlice({
  name: 'checkout',
  initialState: null,
  reducers: {
    setCheckout(state, action){
      return action.payload
    },
    clearCheckout(_state, _action){
      return null
    }
  }
})

export const {setCheckout, clearCheckout} = checkouSlice.actions

export default checkouSlice.reducer