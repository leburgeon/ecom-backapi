import axios from 'axios'

const checkout = async (basket) => {
  const response = await axios.post('/api/orders/checkout', basket)
  return response.data
}

export default {checkout}