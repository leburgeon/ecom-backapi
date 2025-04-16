import { useEffect, useState } from "react"
import { useSelector, useDispatch } from "react-redux"
import { updateStockOnBasketItems, setBasketCount, setBasketItems } from "./reducers/basketReducer"
import productService from "./services/productsService"
import { Typography, Paper, LinearProgress, Button, Alert } from "@mui/material"
import BasketCard from "./components/BasketCard"
import { logout } from './reducers/userReducer'
import { notify } from "./reducers/notificationReducer"
import checkoutService from './services/checkoutService'
import { setCheckout } from "./reducers/checkoutReducer"
import { useNavigate } from "react-router-dom"

const Basket = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const basketItems = useSelector((store) => store.basket.items)
  const [loading, setLoading] = useState(true)

  const fetchBasket = async () => {
    try {
      const { basket } = await productService.getBasket();
      if (basket) {
        dispatch(setBasketItems(basket))
        dispatch(setBasketCount(basket.length))
      }
    } catch (error) {
      let errorMessage = 'Error fetching basket:'
      if (error.response.status === 401) {
        dispatch(logout())
        errorMessage += 'Authentication token expired, please re-login'
      }
      dispatch(notify({
        message: `${errorMessage}`,
        severity: 'info'
      }))
    } finally {
      setLoading(false)
    }
  };

  useEffect(() => {
    fetchBasket()
  }, [])

  if (loading) {
    return (<LinearProgress></LinearProgress>)
  }

  const totalCost = basketItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0).toFixed(2)

  const stockNotValid = basketItems.some(item => {
    return item.quantity > item.product.stock
  })

  const handleCheckout = async () => {
    const basket = basketItems.map(item => {
      return {
        id: item.product.id, quantity: item.quantity
      }
    })
    try {
      const response = await checkoutService.checkout(basket)
      dispatch(setCheckout(response))
      navigate('/checkout')
    } catch (error){
      // TODO handle products out of stock error
      console.error(error)
      if (error.response?.data?.error === 'Not enough stock'){
        dispatch(notify({
          message: 'There is not enough stock to process some of the items in your basket',
          severity: 'error'
        }))
        dispatch(updateStockOnBasketItems(error.response?.data?.items))
      }
    }
  }

  return (
    <Paper elevation={3} sx={{ p: 4, maxWidth: 800, margin: '20px auto' }}>
      <Typography variant="h4" gutterBottom align="center">Your Basket</Typography>
      {basketItems.length === 0 ? (
        <Typography variant="body1" align="center">No items in basket</Typography>
      ) : (
        <>
          {basketItems.map((item) => (
            <BasketCard
              key={item.product.id}
              item={item}
              sx={{ mb: 2 }}
            />
          ))}
          <Typography variant="h5" sx={{ mt: 3, textAlign: 'right' }}>Total: £{totalCost}</Typography>
          {stockNotValid && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              We are sorry, there is not enough stock available to process all of the items in your basket. Please try removing them or reducing the quantity.
            </Alert>
          )}
          <Button
            sx={{ mt: 3, display: 'block', marginLeft: 'auto' }}
            disabled={stockNotValid}
            onClick={handleCheckout}
            variant="contained"
            color="primary"
          >
            Checkout
          </Button>
        </>
      )}
    </Paper>
  )
}

export default Basket
