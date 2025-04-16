import { AppBar, Toolbar, Typography, Button, Box } from "@mui/material";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";

const Navbar = () => {
  const user = useSelector(store => store.user)
  const basketCount = useSelector(store => store.basket.count)
  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          <Button color="inherit" component={Link} to="/">
            <h2>bonbuy.com</h2>
          </Button>
        </Typography>

        <Box sx={{ display: "flex", gap: 2 }}>
          <Button color="inherit" component={Link} to="/">
            Products
          </Button>
          <Button color="inherit" component={Link} to="/basket">
            Basket <Typography>{basketCount <= 0 ? '' : basketCount > 99 ? ' (99+)' : ` (${basketCount})`}</Typography>
          </Button>
          <Button color="inherit" component={Link} to={user ? "/account" : "/login"}>
            {user ? "Account" : "Login"}
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;