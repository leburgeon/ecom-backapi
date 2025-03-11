import  {Environment, Client, ApiError, OrdersController} from '@paypal/paypal-server-sdk'
import { CheckoutPaymentIntent } from '@paypal/paypal-server-sdk'
import config from './config'
import { ProcessedBasket } from '../types'

const client = new Client({
  clientCredentialsAuthCredentials: {
    oAuthClientId: config.PAYPALCLIENTID,
    oAuthClientSecret: config.PAYPALCLIENTSECRET
  },
  environment: Environment.Sandbox
})

const ordersController = new OrdersController(client)
//const _paymentController = new PaymentsController(client)

const createOrder = async (cart: ProcessedBasket) => {

  const { totalCost, items } = cart

  // Create the collect object
  const collect = {
    body: {
      intent: CheckoutPaymentIntent.Capture,
      purchaseUnits: [
        {
          amount: {
            currencyCode: 'GBP',
            value: totalCost.toString()
          }
        }
      ]
    },
    items: items.map(item => {
      return{
        name: item.product.name,
        unit_amount: {
          currency_code: "GBP",
          value: item.product.price
        },
        quantity: item.quantity
      }
    }),
    prefer: 'return=minimal'
  }

  // Attempts to create the order
  try {
    const {body, ...httpResponse } = await ordersController.ordersCreate(collect)
    return {
      jsonResponse: body,
      httpStatusCode: httpResponse.statusCode
    }
  } catch (error){
    let errorMessage = "Error creating order with orderController: "
    if (error instanceof ApiError){
      errorMessage += error.message
    }
    throw new Error(errorMessage)
  }
}

export default {createOrder}