import express, { NextFunction, Response } from 'express'
import { validateBasketStock, authenticateUser, parseBasket } from '../utils/middlewear'
import { AuthenticatedRequest,  PopulatedBasket, ProcessedBasket, Basket } from '../types'
import Product from '../models/Product'
import mongoose from 'mongoose'
import Order from '../models/Order'
import paypalController from '../utils/paypalController'
import { processBasket, mapProcessedBasketItemsToOrderItems, validatePurchaseUnitsAgainstTempOrder, creatSessionAndHandleStockCleanup } from '../utils/helpers'
import TempOrder from '../models/TempOrder'
import BasketModel from '../models/Basket'
import productRouter from './productRouter'
// import paypalClient from '../utils/paypalClient'

// Baseurl is /api/orders
const orderRouter = express.Router()

// Create a route for 1) checkout, which validates stock and returns a formatted basket to be displayed on the checkout page, aswell as returned with the createOrder route
orderRouter.post('/checkout', parseBasket, validateBasketStock, async(req: AuthenticatedRequest<unknown, unknown, PopulatedBasket>, res: Response, _next: NextFunction) => {
  // Calculates the total for the products in the basket and formats the basket to return
  const populatedBasket = req.body

  let totalPrice = 0

  const basketToReturn = populatedBasket.map(basketItem => {
    const { price, name, _id } = basketItem.product
    totalPrice += price * basketItem.quantity
    return {
      product: {
        price, name, id: _id
      },
      quantity: basketItem.quantity
    }
  })

  res.status(200).json({basket: basketToReturn, totalPrice})
})

// Order router for creating the paypal order, and a temp order for order validation onApprove()
orderRouter.post('', authenticateUser, parseBasket, async (req: AuthenticatedRequest<unknown, unknown, Basket>, res: Response, _next: NextFunction) => {
  try {
    // 1) Proccesses the basket to create the paypal order
    // Throws an error if basket empty, any products not found, or if there is not enough stock on any of the product docs
    const processedBasket: ProcessedBasket = await processBasket(req.body)

    // Calls the orderCreate on the paypal controller
    // Will throw error if failed to create order
    const { jsonResponse, httpStatusCode } = await paypalController.createOrder(processedBasket)
    const { id: paypalOrderId } = jsonResponse

    // Starts a session and transaction, within which to complete the stock updates and the processing order creation
    const session = await mongoose.startSession()
    session.startTransaction()
    
    try {
      // Try block for performing the reservations and creating temporary order
      const bulkOps = processedBasket.items.map(({ product, quantity }) => {
        return {
          updateOne: {
            filter: {_id : product.id, stock: {$gte: quantity}},
            update: {$inc: {stock: -quantity, reserved: quantity}}
          }
        }
      })

      // Bulk writes the operations to mongodb within the transaction
      // ordered=true option inducates that the updates will operate in order, all terminate on the first error
      const bulkWriteOpResult = await Product.bulkWrite(bulkOps, {session: session, ordered: true})

      // Checks that all the updates occured before creating the temporder
      if (bulkWriteOpResult.modifiedCount !== processedBasket.items.length){
        throw new Error('Error reserving stock, not enough stock!')
      }
      
      // Creates the temp order
      const tempOrder = new TempOrder({
        user: req.user?._id,
        items: mapProcessedBasketItemsToOrderItems(processedBasket),
        totalCost: {
          currencyCode: 'GBP',
          value: processedBasket.totalCost
        },
        paymentTransactionId: paypalOrderId
      })

      await tempOrder.save({session})
      await session.commitTransaction()
      
      // Since paypal order created an reservations made, returns the success to the paypal SDK
      res.status(httpStatusCode).json(jsonResponse)

    } catch (error){
      await session.abortTransaction()
      console.log('Transaction aborted')
      throw error
    } finally {
      await session.endSession()
    }

  } catch (error) {
    // Handles occurance of any errors throughout process
    let errorMessage = 'Error creating order: '
    if (error instanceof Error){
      errorMessage += error.message
    }
    console.error(errorMessage, error)
    res.status(500).json({error: errorMessage})
  }
})

// 3) onApprove which updates stock levels and captures the payment
//   onApprove also needs to update the basket information for the user
//   This is also where a task-queue would be implemented to send confirmation emails
orderRouter.post('/capture/:orderID', authenticateUser, async (req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
  // Try block responsible for validating order, capturing payment, and creating order
    // success responds 
    // catch responds error
  try {
    // VALIDATES ORDER AGAINST TEMPORDER
    const { orderID } = req.params
    const tempOrder = await TempOrder.findOne({user: req.user?._id, paymentTransactionId: orderID})
    if (!tempOrder){
      throw new Error('No temp order data found')
    }
    const { purchaseUnits } = await paypalController.getOrder(orderID)
    if (!purchaseUnits){
      throw new Error('Purchase units on paypal order not found')
    } else if (purchaseUnits.length !== 1){
      throw new Error('Purchase units had multiple elements')
    }
    
    validatePurchaseUnitsAgainstTempOrder(purchaseUnits[0], tempOrder)

    // For attempting to capture the order, throws an error if failed
    const { jsonResponse, httpStatusCode } = await paypalController.captureOrder(orderID)
    const {status: paypalOrderStatus, id: paypalOrderId} = jsonResponse

    // Creates new order
    const newOrder = new Order({
      user: req.user?._id,
      items: tempOrder.items,
      totalCost: tempOrder.totalCost,
      status: 'PAID',
      payment: {
        method: 'PAYPAL',
        status: paypalOrderStatus,
        transactionId: paypalOrderId
      }
    })
    await newOrder.save()

    // Returns the response to the client since payment captured and order created
    res.status(httpStatusCode).json(jsonResponse)
    console.log('Order created and then response sent')

    // Deletes all basket data associated with the user since order created
    BasketModel.deleteMany({user: req.user?._id})

    // Handles updating the stock reservation and deleting the tempOrder in a session
    // Does not throw an error, future features will add failed reservation updates to a task queue!
    const userId = (req.user as { _id: mongoose.Types.ObjectId })._id
    try {
      creatSessionAndHandleStockCleanup(userId, tempOrder)
    } catch (error){
      console.error(' Error cleaning up basket and stock reservations ', error)
    }

  } catch (error){
    let errorMessage = 'Error capturing and creating order document: '
    if (error instanceof Error){
      errorMessage += error.message
    }
    console.error(error)
    res.status(500).json({error: errorMessage})
  }
})


// Route for retrieving a list of the users orders
orderRouter.get('', authenticateUser, async (_req: AuthenticatedRequest, res: Response) => {
  res.status(200).json(['order1', 'order2'])
})

export default orderRouter