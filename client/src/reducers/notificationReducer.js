import { createSlice } from "@reduxjs/toolkit";

const notificationSlice = createSlice({
  name: 'notifications',
  initialState: [],
  reducers: {
    addNotification(state, action){
      state.unshift(action.payload)
    },
    popOne(state, _action){
      state.pop()
    },
    clearAll(state, action){
      return []
    }
  }
})

export const { addNotification, popOne, clearAll } = notificationSlice.actions

export default notificationSlice.reducer

// Creates an async action, a thunk that adds a notification and sets a timeout to pop a notification off the array of notitifications
export const notify = (notification) => {
  return async (dispatch) => {
    dispatch(addNotification(notification))

    setTimeout(() => {
      dispatch(popOne())
    }, 5000)
  }
}