import { Typography, Box, Paper } from '@mui/material';
import { useParams } from 'react-router-dom';

const OrderSuccessPage = () => {
  const orderNumber = useParams().orderNumber;
  return (
    <Box 
      display="flex" 
      flexDirection="column" 
      justifyContent="flex-start" 
      alignItems="center" 
      height="100vh"
      mt={4}
    >
      <Paper elevation={6} sx={{ p: 4, width: '100%', maxWidth: 600 }}>
        <Typography variant="h4" gutterBottom align="center">
          Thank You! 😃
        </Typography>
        <Typography variant="h6" gutterBottom align="center">
          Order Ref: {orderNumber}
        </Typography>
        <Typography variant="body1" align="center" paragraph>
          Your order was created successfully. You should receive an order confirmation shortly!
        </Typography>
      </Paper>
    </Box>
  );
}

export default OrderSuccessPage;