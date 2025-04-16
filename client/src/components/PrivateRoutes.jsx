import { Navigate, Outlet } from "react-router-dom";
import userService from "../services/userService";
import { useEffect, useState } from "react";
import { LinearProgress } from "@mui/material";

const PrivateRoutes = () => {
  // For storing the results of the admin check
  const [isAdmin, setIsAdmin] = useState(false)
  // For storing whether the authentication check has happend yet
  const [checkedAuthentication, setCheckedAuthentication] = useState(null)

  // Effect hook used to asynchronously check if the current user is an admin
  useEffect(() => {
    const authenticate = async () => {
      const wasTrue = await userService.authenticateAdmin()
      if (wasTrue){
        setIsAdmin(true)
      } else {
        setIsAdmin(false)
      }
      setCheckedAuthentication(true)
    }
    authenticate()
  }, [])

  // If admin, returns access to the child routes
  return (
    !checkedAuthentication
      ? <LinearProgress/>
      : isAdmin 
        ? <Outlet/>
        // If not, navigates to the login page
        : <Navigate to='/login'/>
  )

}

export default PrivateRoutes