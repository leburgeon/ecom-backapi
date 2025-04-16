import { useState } from "react";
import {
  TextField,
  Button,
  Box,
  Typography,
  Container,
  Paper,
  Grid
} from "@mui/material";

import { Link } from "react-router-dom";
import userService from "./services/userService";
import { useDispatch } from "react-redux";
import { notify } from "./reducers/notificationReducer";
import { login } from "./reducers/userReducer";
import { AxiosError } from "axios";

const RegisterPage = () => {
  
  const [email, setEmail] = useState("");
  const [name, setName] = useState("")
  const [password, setPassword] = useState("");

  const dispatch = useDispatch()


  const handleSubmit = async (event) => {
    event.preventDefault();
    if (password.length < 5){
      dispatch(notify({message: "Password too short, min length of 5", severity: "error"}))
    } else {
      try {
        await userService.registerNewUser({email, name, password})
        dispatch(login({email, password}))
      } catch (error) {
        console.error(error)
        let errorMessage = "Error Registering: "
        if (error instanceof AxiosError){
          if (error.response.status === 409){
            errorMessage += 'An account with that email already exists. Try logging in'
          }
        }
        dispatch(notify({message: errorMessage, severity: 'error'}))
      }
    }
    
  };

  return (
    <Container maxWidth="xs">
      <Paper elevation={3} sx={{ padding: 4, mt: 8, textAlign: "center" }}>
        <Typography variant="h5" gutterBottom>
          Register
        </Typography>
        <Box component="form" onSubmit={handleSubmit} sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <TextField
              label="Name"
              type="text"
              variant="outlined"
              fullWidth
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          <TextField
            label="Email"
            type="email"
            variant="outlined"
            fullWidth
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <TextField
            label="Password"
            type="password"
            variant="outlined"
            fullWidth
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Button type="submit" variant="contained" color="primary" fullWidth>
                Register
              </Button>
            </Grid>
            <Grid item xs={6}>
              <Button variant="outlined" color="secondary" fullWidth component={Link} to='/login'>
                Sign in
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Container>
  );
}

export default RegisterPage