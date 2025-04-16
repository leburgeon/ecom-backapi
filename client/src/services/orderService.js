import axios from 'axios'

const getOrdersForUser = async () => {
  const response = await axios.get('/api/orders')
  return response.data
}

export default { getOrdersForUser }