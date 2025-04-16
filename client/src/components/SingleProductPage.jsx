import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Container,
  Typography,
  Button,
  Collapse,
  Card,
  CardMedia,
  Grid,
  Box,
  Rating,
  Tooltip,
} from "@mui/material";
import productService from "../services/productsService";
import { useDispatch, useSelector } from "react-redux";
import {notify} from '../reducers/notificationReducer'
import productsService from "../services/productsService";
import { setBasketCount } from '../reducers/basketReducer'
import { logout } from "../reducers/userReducer";

const SingleProductPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch()
  const params = useParams();
  const id = params.id;
  const [product, setProduct] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [descExpanded, setDescExpanded] = useState(false);
  const [isAdding, setIsAdding] = useState(false)
  const user = useSelector(store => store.user)
  const [inBasketOfItem, setInBasketOfItem] = useState(0)
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const data = await productService.getProduct(id);
        setProduct(data);
      } catch (error) {
        console.error("Error fetching single product", error);
        setNotFound(true);
      }
    };
    fetchProduct();
  }, [id]);

  if (notFound) {
    return (
      <Container sx={{ mt: 4 }}>
        <Typography variant="h4" gutterBottom>
          404... We couldn't find that product, please try again.
        </Typography>
        <Button variant="contained" onClick={() => navigate(-1)}>
          Go Back
        </Button>
      </Container>
    );
  }

  if (!product) {
    return (
      <Container sx={{ mt: 4 }}>
        <Typography>Loading...</Typography>
      </Container>
    );
  }

  const images = [product.firstImage, ...(product.gallery || [])];

  const handlePrevImage = () => {
    setCurrentImageIndex((prevIndex) =>
      prevIndex === 0 ? images.length - 1 : prevIndex - 1
    );
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prevIndex) =>
      prevIndex === images.length - 1 ? 0 : prevIndex + 1
    );
  };

  // Compute the average rating (if count is 0, average is 0)
  const averageRating = product.rating.count > 0 
    ? product.rating.total / product.rating.count 
    : 0;

  const handleAddToBasket = async () => {
    // Logic to add the product to the basket
    if (!user){
      navigate('/login')
      dispatch(notify({
        message: 'Please login to add items to your basket',
        severity: 'info'
      }))
    } else {
      setIsAdding(true)
      try {
        const data = await productsService.incrementBasketItem(product.id, 1)
        console.log(data)
        setInBasketOfItem(data.inBasket)
        dispatch(setBasketCount(data.basketCount))
      } catch (error){
        console.log(error)
        // handling stock error
        if (error.response?.data?.error.includes('Not enough stock')){
          // Updates the stock on the product
          const latestStock = error.response.data.items[0].quantity
          setInBasketOfItem(latestStock)
          console.log('Not enough stock, adjusting stock of current product to :', latestStock)
          setProduct({...product, stock: latestStock})
        } else {
          let notificationMessage = 'Error adding that to the basket! '
          if (error.response?.data?.error === "TokenExpiredError:jwt expired"){
            dispatch(logout())
            navigate('/login')
            notificationMessage += 'Session expired, please re-login!'
          }
          dispatch(notify({
            message: notificationMessage,
            severity: 'info'
          }))
        }
      } finally{
        setIsAdding(false)
      }
    }
    
  };

  return (
    <Container maxWidth="md" sx={{ my: 4, px: 3 }}>
      {/* Product Name */}
      <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold', textAlign: 'center' }}>
        {product.name}
      </Typography>

      {/* Image Carousel */}
      <Box sx={{ position: 'relative', mb: 3, mx: 'auto', maxWidth: 600 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Button
            onClick={handlePrevImage}
            sx={{
              minWidth: 'auto',
              backgroundColor: 'rgba(0, 0, 0, 0.1)',
              color: 'black',
              '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.2)' },
              px: 2,
              py: 1,
            }}
          >
            &#9664; Prev
          </Button>
          <Card sx={{ boxShadow: 3, borderRadius: 2, overflow: 'hidden', flexGrow: 1, mx: 2 }}>
            <CardMedia
              component="img"
              image={images[currentImageIndex]}
              alt={product.name}
              sx={{
                width: '100%',
                aspectRatio: '1 / 1',
                objectFit: 'contain',
                backgroundColor: '#f5f5f5',
              }}
            />
          </Card>
          <Button
            onClick={handleNextImage}
            sx={{
              minWidth: 'auto',
              backgroundColor: 'rgba(0, 0, 0, 0.1)',
              color: 'black',
              '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.2)' },
              px: 2,
              py: 1,
            }}
          >
            Next &#9654;
          </Button>
        </Box>
      </Box>

      {/* Seller */}
      <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'medium', color: 'text.secondary' }}>
        Seller: {product.seller}
      </Typography>

      {/* Price */}
      <Typography variant="h5" sx={{ mb: 2, fontWeight: 'bold', color: 'primary.main' }}>
        Price: £{product.price}
      </Typography>

      {/* Rating */}
      <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
        <Rating value={averageRating} precision={0.1} readOnly />
        <Typography variant="body2" sx={{ ml: 1, color: 'text.secondary' }}>
          {averageRating.toFixed(1)} ({product.rating.count} reviews)
        </Typography>
      </Box>

      {/* Add to Basket Button */}
      <Box sx={{ mt: 3, textAlign: 'center' }}>
        <Tooltip title={product.stock <= 0 
          ? 'OUT OF STOCK'
          : product.stock <= inBasketOfItem
            ? 'LAST ONE CURRENTLY IN YOUR BASKET!'
            : ''}>
          <span>
            <Button
              variant="contained"
              color="primary"
              onClick={handleAddToBasket}
              disabled={isAdding || product.stock <= inBasketOfItem}
              sx={{ px: 4, py: 1, fontSize: '1rem', textTransform: 'none' }}
            >
              Add to Basket
            </Button>
          </span>
        </Tooltip>
      </Box>

      {/* Collapsible Description */}
      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
          Description
        </Typography>
        <Collapse in={descExpanded} collapsedSize={100}>
          <Typography variant="body1" paragraph sx={{ color: 'text.secondary', lineHeight: 1.6 }}>
            {product.description.content}
          </Typography>
        </Collapse>
        {product.description.content.length > 100 && (
          <Button onClick={() => setDescExpanded((prev) => !prev)} sx={{ mt: 1, textTransform: 'none' }}>
            {descExpanded ? "Show Less" : "Read More"}
          </Button>
        )}
      </Box>
    </Container>
  );
};

export default SingleProductPage;
