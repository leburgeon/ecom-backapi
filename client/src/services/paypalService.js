import axios from "axios"
import { PAYPALCLIENTID } from "./utils"

// This callback is called by the SDK when the user presses a payment option
// It is requesting an order id from the merchant server so that it can instantiate a popup to confirm payment
// Takes a cart object containing an array of product ids and quantities
const createOrder = async (cart, notify) => {
  // Formats the cart into the required format
  const formattedCart = cart.map(item => {
    return {
      id: item.product.id,
      quantity: item.quantity
    }
  })
  
  // Attempts to create an order on the backend
  const { data } = await axios.post('/api/orders', formattedCart)
  if (data.id){
    return data.id
  } else {
    const errorDetail = data?.details?.[0]
    const errorMessage = errorDetail 
      ? `${errorDetail.issue} ${errorDetail.description} (${data.debug_id})`
      : JSON.stringify(data)
    throw new Error(errorMessage)
  }

}

// After the user has approved the payment, this callback makes a call to the merchant server to capture the payment
const onApprove = async (data, actions, notify, handleSuccess ) => {
  try {
    const { data: orderData } = await axios.post(`/api/orders/capture/${data.orderID}`)

    // Attempts handle error cases, recoverable and non-recoverable
    const errorDetail = orderData?.details?.[0]

    // Recoverable instrument declined- retry capture
    if (errorDetail?.issue === 'INSTRUMENT_DECLINED'){
      return actions.restart()
    // Non-recoverable
    } else if (errorDetail){
      handleRelease(data.orderID)
      notify({
        message: 'Purchase failed, please try again.',
        severity: 'info'
      })
      // Handles SUCCESS
    } else {
      const transaction = orderData.purchase_units[0].payments.captures[0]
      console.log(JSON.stringify(transaction))
      const { orderNumber } = orderData
      handleSuccess(orderNumber)
    }

  } catch (error){
    console.error(error)
    notify({
      message: `Sorry, your transaction could not be processed: ${error.message}`,
      severity: 'error'
    })
  }
}

const handleRelease = async (orderId) => {
  axios.post(`/api/orders/release/${orderId}`)
}

const paypalInitialOptions = {
  'clientId': PAYPALCLIENTID,
  'buyer-country': 'GB',
  currency: 'GBP',
  components: 'buttons'
}

export default {createOrder, onApprove, paypalInitialOptions, handleRelease}