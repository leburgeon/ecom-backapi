import express, { NextFunction, Response } from 'express'
import { validateBasketStock, authenticateUser, parseBasket } from '../utils/middlewear'
import { AuthenticatedRequest,  PopulatedBasket, ProcessedBasket, Basket } from '../types'
import Product from '../models/Product'
import mongoose from 'mongoose'
import Order from '../models/Order'
import paypalController from '../utils/paypalController'
import { processBasket, mapProcessedBasketItemsToOrderItems } from '../utils/helpers'
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


// 2) createOrder which validates the stock a second time and calls the createorder paypal endpoint, returning an orderID
orderRouter.post('', authenticateUser, parseBasket, async (req: AuthenticatedRequest<unknown, unknown, Basket>, res: Response, _next: NextFunction) => {
  try{
    // 1) Proccesses the basket to create the paypal order
    // Processes the basket by finding the producs and calculating the total
    // Throws an error if basket empty, any products not found, or if there is not enough stock on any of the product docs
    const processedBasket: ProcessedBasket = await processBasket(req.body)

    // Calls the orderCreate on the paypal controller
    // Will throw error if failed to create order
    const { jsonResponse, httpStatusCode } = await paypalController.createOrder(processedBasket)
    const { id: paypalOrderId, status: paypalOrderStatus } = jsonResponse

    // Starts a session and transaction, within which to complete the stock updates and the processing order creation
    const session = await mongoose.startSession()
    session.startTransaction()

    try {
      // For each of the items in the processed basket, perform an update operation, first checking if there is enough stock to perform the action
      const updateOperations = processedBasket.items.map(({ quantity, product }) => {
        // The filter query searches for the procut with the matching id but only if there is enough stock to perform the operation
        return Product.updateOne(
          {_id: product.id, stock: {$gte: quantity}},// Ensures the stock exists
          {$inc: {stock: - quantity}}, // Reduces the stock by the amount
          {session} // Performs the updates within the session
        )
      })

      const results = await Promise.all(updateOperations)

      // If any of the updates to the stock did not occur, throw an error
      if (results.some(result => result.modifiedCount === 0)){
        throw new Error('Not enough stock for all operation')
      } 

      // TODO: create order within the transaction with the paypal id
      const newOrder = new Order({
        user: req.user?._id,
        items: mapProcessedBasketItemsToOrderItems(processedBasket),
        totalCost: processedBasket.totalCost,
        status: 'PENDING',
        payment: {
          method: 'PAYPAL',
          status: paypalOrderStatus,
          transactionId: paypalOrderId
        }
      })

      await newOrder.save({session})
      await session.commitTransaction()

      // If all docs updated and order doc created, returns the paypal order status and json response
      res.status(httpStatusCode).json(jsonResponse)
      
    } catch (error){
      await session.abortTransaction()
      console.log('Transaction aborted')
      throw error
    } finally {
      await session.endSession()
    }

  } catch (error){
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