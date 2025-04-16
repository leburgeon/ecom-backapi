import { createSlice } from "@reduxjs/toolkit";
import userService from '../services/userService'
import { notify, clearAll as clearAllNotifications } from './notificationReducer'
import { AxiosError } from "axios";
import { resetBasket, setBasketCount } from "./basketReducer";

const userSlice = createSlice({
  name: 'user',
  initialState: userService.getFromLocalSync(),
  reducers: {
    setUser (state, action) {
      return action.payload
    },
    clearUser (_state, _action) {
      return null
    }
  }
})

export const {setUser, clearUser} = userSlice.actions

export default userSlice.reducer

export const login = (credentials) => {
  return async (dispatch) => {
    try {
      const { email, name, token, metaData } = await userService.login(credentials)
      dispatch(setUser({email, name, token}))
      window.localStorage.setItem('ecomUser', JSON.stringify({email, name, token}))
      userService.setAuthToken(token)
      dispatch(notify({
        message: `Welcome ${name}!`,
        severity: 'success'
      }))
      dispatch(setBasketCount(metaData.basketCount))
    } catch (error){
      dispatch(logout())
      let errorMessage = error.message
      if (error instanceof AxiosError){
        console.error(error)
        errorMessage = `Error logging in: ${error.response.data.error}`
      }
      dispatch(notify({message: errorMessage, severity: 'error'}))
    }
  }
}

export const logout = () => {
  return async (dispatch) => {
    dispatch(clearUser())
    window.localStorage.removeItem('ecomUser')
    dispatch(clearAllNotifications())
    dispatch(resetBasket())
  }
}

