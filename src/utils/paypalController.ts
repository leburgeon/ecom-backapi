import  {Environment, Client, ApiError, OrdersController, Order} from '@paypal/paypal-server-sdk'
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
        quantity: item.quantity,
        sku: item.product.id
      }
    }),
    prefer: 'return=minimal'
  }

  // Attempts to create the order
  try {
    const {body, ...httpResponse } = await ordersController.ordersCreate(collect)
    return {
      jsonResponse: JSON.parse(body.toString()),
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

const captureOrder = async (orderId: string) => {
  const collect = {
    id: orderId,
    prefer: "return=minimal"
  }

  try {
    const {body, ...httpResponse} = await ordersController.ordersCapture(collect)
    console.log('Captured! In paypalController.captureOrder')
    return {
      jsonResponse: JSON.parse(body.toString()),
      httpStatusCode: httpResponse.statusCode
    }
  } catch (error){
    let errorMessage = 'Error capturing payment: '
    console.error('Error thrown in paypalController on captureOrder', error)
    if (error instanceof Error){
      errorMessage += error.message
    }
    throw new Error(errorMessage)
  }
}

const getOrder = async (orderId: string): Promise<Order> => {
  try {
    const {body} = await ordersController.ordersGet({id: orderId})
    return JSON.parse(body.toString())
  } catch (error){
    const errorMessage = 'Error fetching the order information before verify' 
    console.error(errorMessage, error)
    throw new Error(errorMessage)
  }
}

export default {createOrder, captureOrder, getOrder}