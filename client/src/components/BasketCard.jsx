import { useState } from "react";
import { useDispatch } from "react-redux";
import { incrementQuantityOfItem, removeItem, setBasketCount, updateStockOnBasketItems} from "../reducers/basketReducer";
import productService from "../services/productsService";
import { Card, CardContent, CardMedia, IconButton, Typography, Box, CircularProgress, Tooltip } from "@mui/material";
import { Add, Remove, Delete } from "@mui/icons-material";
import { Link } from "react-router-dom";
import { notify } from "../reducers/notificationReducer";


const BasketCard = ({ item, handleNotify }) => {
  const { product, quantity } = item;
  const [isProcessing, setIsProcessing] = useState(false);
  const dispatch = useDispatch()

  const invalidStock = product.stock < quantity
  const maxStock = product.stock === quantity

  const handleIncrement = async (id, quantity) => {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      const data = await productService.incrementBasketItem(id, quantity)
      dispatch(setBasketCount(data.basketCount))
      dispatch(incrementQuantityOfItem({id, quantity}))
      dispatch(updateStockOnBasketItems(data.items))
    } catch (error){
      console.error(error)
      if (error.response?.data?.error?.includes('Not enough stock')){
        dispatch(updateStockOnBasketItems(error.response.data.items))
      }
      const notificationMessage = quantity < 0
        ? 'Sorry we could not remove that item from your basket!'
        : 'Sorry we could not add that item to the basket!'
      dispatch(notify({
        message: notificationMessage,
        severity: 'info'
      }))
    } finally{
      setIsProcessing(false)
    }
  }

  const handleDelete = async (id) => {
    if (isProcessing) return;
    setIsProcessing(true);
    try{
      const data = await productService.deleteItemFromBasket(id)
      dispatch(setBasketCount(data.basketCount))
      dispatch(removeItem({id}))
    } catch (error){
      handleNotify({
        message: "We are having trouble deleting that item from the basket",
        severity: "info"
      })
    } finally{
      setIsProcessing(false);
    }
  };
  
  return (
    <Card sx={{ display: "flex", alignItems: "center", p: 1, mb: 1, flexDirection: "column" }}>
      <Box sx={{ display: "flex", alignItems: "center", width: "100%" }}>
        <CardMedia component="img" image={product.firstImage} alt={product.name} sx={{
            aspectRatio: '1 / 1',
            objectFit: 'contain', width: 80, height: 80, mr: 2 }} />
        <CardContent sx={{ flexGrow: 1, display: "flex", flexDirection: "column" }}>
          <Link to={`/product/${item.product.id}`}><Typography variant="h6">{product.name}</Typography></Link>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <IconButton disabled={isProcessing} onClick={() => handleIncrement(product.id, -1)}><Remove /></IconButton>
            <Typography>{isProcessing ? <CircularProgress size={15}/> : quantity}</Typography>
            <Tooltip title={maxStock ? `ONLY ${item.product.stock} LEFT!` : ''}>
              <span><IconButton disabled={isProcessing || quantity >= product.stock} onClick={() => handleIncrement(product.id, 1)}><Add /></IconButton></span>
            </Tooltip>
            <IconButton disabled={isProcessing} onClick={() => handleDelete(product.id)}><Delete /></IconButton>
          </Box>
        </CardContent>
        <Typography variant="h6" sx={{ ml: "auto", pr: 2 }}>
          £{(product.price * quantity).toFixed(2)}
        </Typography>
      </Box>

      {/* Inline Warning Message */}
      {invalidStock && (
        <Typography variant="body2" color="error" sx={{ mt: 1, alignSelf: "flex-start", pl: 1 }}>
          Not enough stock available.
        </Typography>
      )}
    </Card>

  );
};

export default BasketCard