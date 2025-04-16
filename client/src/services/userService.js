import axios from "axios";

// Sets the global authorisation token for requests in this module
const setAuthToken = (token) => {
  axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
}

// For attempting to parse user info from localstorage for user initial state
const getFromLocalSync = () => {
  // Attempt to retrieve the user data from local storage
  const userInLocal = window.localStorage.getItem('ecomUser')

  // Returns null if there is no user data in local storage
  if (!userInLocal){
    return null
  }

  // Attempts to parse the JSON formatted data, loggs the error if error parsing and returns null
  try {
    const parsed = {...JSON.parse(userInLocal)}
    setAuthToken(parsed.token)
    return parsed
  } catch (error){
    console.error(error)
    window.localStorage.removeItem('ecomUser')
    return null
  }
}

// For logging using credentials
const login = async (credentials) => {
  const { email, password } = credentials
  const response = await axios.post('/api/login', {email, password})
  return response.data
}

const registerNewUser = async (credentials) => {
  const { name, email, password } = credentials
  const response = await axios.post('/api/users', {name, email, password})
  return response.data
}

// For checking if the current user is an admin, returns true if so
const authenticateAdmin = async () => {
  try {
    const response = await axios.get('/api/users/admin')
    return response.status === 200
  } catch (error){
    return false
  }
}

export default {getFromLocalSync, login, registerNewUser, setAuthToken, authenticateAdmin}