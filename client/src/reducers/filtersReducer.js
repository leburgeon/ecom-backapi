import { createSlice } from "@reduxjs/toolkit";

const filtersSlice = createSlice({
  name: 'filters',
  initialState: {},
  reducers: {
    updateFilter(state, action){
      return {...state, ...action.payload}
    },
    clearFilters(state, action){
      return {}
    }
  }
})

export const { updateFilter, clearFilters } = filtersSlice.actions

export default filtersSlice.reducer