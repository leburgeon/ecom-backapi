import { Container, Typography, Card, CardContent, List, ListItem, ListItemText, Divider, Paper, Box } from "@mui/material";
import { PayPalButtons } from "@paypal/react-paypal-js";
import paypalService from "./services/paypalService";
import { useDispatch, useSelector } from "react-redux";
import { notify } from "./reducers/notificationReducer";
import { Navigate, useNavigate } from "react-router-dom";
import { useState } from "react";
import { resetBasket } from "./reducers/basketReducer";

const Checkout = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate()
  const checkout = useSelector((store) => store.checkout);
  const [tempOrderId, setTempOrderId] = useState(null)

  if (!checkout || checkout.basket.length === 0) {
    return <Navigate to='/basket'/>
  }

  const dispatchNotify = (obj) => {
    dispatch(notify(obj));
  };

  const handleSuccess = (orderNumber) => {
    setTempOrderId(null)
    dispatch(resetBasket())
    dispatch(notify({
      message:'Order complete! Thank you for your order!',
      severity: 'success'
    }))
    navigate(`/success/${orderNumber}`)
  }

  const handleCreateOrder = async () => {
    try{
      console.log('#################################')
      console.log(checkout.basket)
      const id = await paypalService.createOrder(checkout.basket, dispatchNotify)
      
      setTempOrderId(id)
      return id
    } catch (error){
      if (error.response?.data?.error?.includes('Not enough stock')){
        navigate('/basket')
      } else {
        throw error
      }
    }
  }

  return (
    <Container maxWidth="sm" sx={{mt: '20px'}}>
      <Paper elevation={4} sx={{ p: 3, borderRadius: 2, backgroundColor: '#f9f9f9' }}>
        <Typography variant="h4" gutterBottom align="center" sx={{ fontWeight: 'bold', color: '#333' }}>
          Checkout
        </Typography>
        <Card sx={{ borderRadius: 2, boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)' }}>
          <CardContent>
            <List>
              {checkout.basket.map(({ product, quantity }) => (
                <ListItem key={product.id} sx={{ display: 'flex', justifyContent: 'space-between', py: 1 }}>
                  <ListItemText
                    primary={product.name}
                    secondary={`Quantity: ${quantity} - £${product.price.toFixed(2)}`}
                    primaryTypographyProps={{ fontWeight: 'medium', color: '#555' }}
                    secondaryTypographyProps={{ color: '#777' }}
                  />
                  <Typography variant="body1" sx={{ fontWeight: 'bold', color: '#333' }}>
                    £{(product.price * quantity).toFixed(2)}
                  </Typography>
                </ListItem>
              ))}
              <Divider sx={{ my: 2 }} />
              <ListItem sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <ListItemText
                  primary="Total:"
                  primaryTypographyProps={{ variant: 'h6', fontWeight: 'bold', color: '#333' }}
                />
                <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#00796b' }}>
                  £{checkout.totalPrice.toFixed(2)}
                </Typography>
              </ListItem>
            </List>
          </CardContent>
        </Card>
        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <PayPalButtons
            debug={true}
            createOrder={handleCreateOrder}
            onApprove={async (data, actions) => {
              await paypalService.onApprove(data, actions, dispatchNotify, handleSuccess)
            }}
            onError={(err) => {
              console.error("PayPal SDK Error:", err)
              if (tempOrderId){
                paypalService.handleRelease(tempOrderId)
              }
            }}
            onCancel={(data) => {
              console.warn("Payment cancelled:", data)
              paypalService.handleRelease(data.orderId)
            }}
            onClick={() => console.log("PayPal button clicked")}
            style={{ shape: "pill", layout: "vertical", color: "blue", label: "pay" }}
          />
        </Box>
      </Paper>
    </Container>
  );
};

export default Checkout;
