import  {Environment, Client, ApiError, OrdersController, Order} from '@paypal/paypal-server-sdk'
import config from './config'
import { ProcessedBasket } from '../types'
import { mapProcessedBasketItemsToPurchaseUnitItems } from './helpers'

const client = new Client({
  clientCredentialsAuthCredentials: {
    oAuthClientId: config.PAYPALCLIENTID,
    oAuthClientSecret: config.PAYPALCLIENTSECRET
  },
  environment: Environment.Sandbox
})

const ordersController = new OrdersController(client)
//const _paymentController = new PaymentsController(client)

// Method for creating order
const createOrder = async (basket: ProcessedBasket) => {

  const collect = {
    body: mapProcessedBasketItemsToPurchaseUnitItems(basket),
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
    console.error(error)
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
    const order = await ordersController.ordersGet({id: orderId})
    return order.result
  } catch (error){
    const errorMessage = 'Error fetching the order information before verify' 
    console.error(errorMessage, error)
    throw new Error(errorMessage)
  }
}

export default {createOrder, captureOrder, getOrder}