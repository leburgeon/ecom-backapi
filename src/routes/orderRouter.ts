import express, { NextFunction, Response } from 'express'
import { validateBasketStock, authenticateUser, parseBasket } from '../utils/middlewear'
import { AuthenticatedRequest,  PopulatedBasket, ProcessedBasket, Basket } from '../types'
import Product from '../models/Product'
import mongoose from 'mongoose'
import Order from '../models/Order'
import paypalController from '../utils/paypalController'
import { processBasket, mapProcessedBasketItemsToOrderItems, validatePurchaseUnitsAgainstTempOrder } from '../utils/helpers'
import TempOrder from '../models/TempOrder'
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

    // Try block for performing the reservations and creating temporary order
    try {
      const reservationOperations = processedBasket.items.map(({ quantity, product }) => {
        return Product.updateOne(
          {_id: product.id, stock: { $gte: quantity }},
          {$inc: {reserved: quantity, stock: - quantity}},
          {session}
        )
      })

      // If any of the updates to the stock did not occur, throw an error
      const results = await Promise.all(reservationOperations)      
      if (results.some(result => result.modifiedCount === 0)){
        throw new Error('Not enough stock for all operation')
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
  const { orderID } = req.params

  // Try block for validating that the paypal order details match the temp order details
  try {
    const tempOrder = await TempOrder.findOne({user: req.user?._id, paymentTransactionId: orderID})
    if (!tempOrder){
      throw new Error('No temp order data found')
    }

    const { purchaseUnits } = await paypalController.getOrder(orderID)
    if (!purchaseUnits){
      throw new Error('Purchase units on paypal order not found')
    }
    
    // For validating that the items, total cost and currencies on the tempOrder and PurchaseUnits match. 
    // Used for security, throws error with reason message if any mis-match, missing, or too many items
    try {
      validatePurchaseUnitsAgainstTempOrder(purchaseUnits[0], tempOrder)
    } catch (error){
      let errorMessage = 'Error validating the purchaseUnit against tempOrder items'
      if (error instanceof Error){
        errorMessage += error.message
      }
      throw new Error(errorMessage)
    }

    // For attempting to capture the order, throws an error if failed
    const { jsonResponse, httpStatusCode } = await paypalController.captureOrder(orderID)
    const {status: paypalOrderStatus, id: paypalOrderId} = jsonResponse

    // For creating the order document, reducing the stock reservation and deleting the tempOrder in a session
    console.log('session started!')
    const session = await mongoose.startSession()
    session.startTransaction()

    try {
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
      await newOrder.save({session})

      // Deletes the tempOrder
      await TempOrder.deleteOne({_id: tempOrder._id}).session(session)

      // Updates the stock reservation for each of the products
      const reservationUpdates = tempOrder.items.map(item => {
        return Product.updateOne({_id: item.product},
          {$inc : {reserved: - item.quantity}},
          {session}
        )
      })

      // Checks that all the reservation amounts recieved an update
      const results = await Promise.all(reservationUpdates)
      if (results.some(result => {
        return result.modifiedCount === 0
      })){
        throw new Error('One or more reservation updates failed after creating an order!')
      }

      await session.commitTransaction()
    } catch (error){
      await session.abortTransaction()
      let errorMessage = 'Error creating an order and aborted transaction: '
      if (error instanceof Error){
        errorMessage += error.message
      }
      throw new Error(errorMessage)
    } finally {
      await session.endSession()
    }

    res.status(httpStatusCode).json(jsonResponse)
  } catch (error){
    let errorMessage = 'Error capturing order: '
    if (error instanceof Error){
      errorMessage += error.message
    }
    console.error(error)
    res.status(500).json({error: errorMessage})
  }
})

// 3) onApprove which updates stock levels and captures the payment
    // onApprove also needs to update the basket information for the user
    // This is also where a task-queue would be implemented to send confirmation emails

// orderRouter.post('/capture/:id', authenticateUser, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
//   const { id } = req.params

//   // Busniness logic for checking the stock lev

// })



// Route for retrieving a list of the users orders
orderRouter.get('', authenticateUser, async (_req: AuthenticatedRequest, res: Response) => {
  res.status(200).json(['order1', 'order2'])
})

export default orderRouter