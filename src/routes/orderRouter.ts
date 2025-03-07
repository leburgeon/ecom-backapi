import express, { NextFunction, Response } from 'express'
import { validateBasketStock, authenticateUser, parseBasket } from '../utils/middlewear'
import { AuthenticatedRequest, Basket, NewOrder,  } from '../types'
import Product from '../models/Product'
import mongoose from 'mongoose'
import Order from '../models/Order'
import { StockError } from '../utils/Errors'
// import paypalClient from '../utils/paypalClient'

// Baseurl is /api/orders
const orderRouter = express.Router()

// TODO:
// Create a route for 1) checkout, which validates stock and returns a formatted basket to be displayed on the checkout page, aswell as returned with the createOrder route
orderRouter.post('/checkout', parseBasket, validateBasketStock, async(req: AuthenticatedRequest<unknown, unknown, Basket>, res: Response, _next: NextFunction) => {
  // Calculates the total for the products in the basket
  const basket = req.body
  try {
    // Creates an array of objects with the product documents as an attribute
    const populated = await Promise.all(basket.map(async item => {
      const product = await Product.findById(item.id)
      if (!product){
        throw new StockError('Product not found', item.id)
      }
      return {product,
        quantity: item.quantity
      }
    }))

    let totalPrice = 0
    populated.forEach(obj => {
      totalPrice += obj.quantity * obj.product.price
    })

    res.status(200).json({basket, totalPrice})

  } catch (error){
    console.error(error)
    res.status(500).json({error: 'Some products not found',
      id: (error as StockError).id
    })
  }
})

// 2) createOrder which validates the stock a second time and calls the createorder paypal endpoint, returning an orderID
// 3) onApprove which updates stock levels and captures the payment - use atomic operation here to capture payment and update stock
    // onApprove also needs to update the basket information for the user
    // This is also where a task-queue would be implemented to send confirmation emails

// Route for retrieving a list of the users orders
orderRouter.get('/', authenticateUser, async (_req: AuthenticatedRequest, res: Response) => {
  res.status(200).json(['order1', 'order2'])
})

// Route for creating a new order and reducing the stock count, 

orderRouter.post('/', authenticateUser, async (req: AuthenticatedRequest<unknown, unknown, NewOrder>, res: Response) => {
  const { products } = req.body
  const { user } = req

  // For starting a transaction session
  const session = await mongoose.startSession()
  session.startTransaction()

  // Try block attempts to perform the database updates within the transaction
  // If an error thrown within try block, transaction aborted
  try {
    // For each of the products in the array, this block attempts to:
    // - Validate that the product exists, throwing an error if it is not found
    // - Asserts that there is sufficient stock for the quantity of the product
    // - Decrement the amount of stock from the stock reserve
    // - Save the stock updated document
    let totalCost = 0

    const productDocsStockChanged = await Promise.all(products.map( async product => {
      const doc = await Product.findById(product.id).session(session)

      // Asserts that the product with the id exists
      if (!doc) {
        throw new Error('Product not found!')
      }
      
      // Asserts that there is sufficient quantity in the reserved stock and throws error if not
      if (product.quantity > doc.stock){
        throw new Error(`Insufficient stock for ${doc.name} x ${product.quantity}`)
      }

      // Updates the cost total 
      totalCost += (doc.price * product.quantity)

      // Decrements the stock reserve and returns the document (not saved)
      doc.stock -= product.quantity

      // Then attempts to save the doc
      await doc.save()
      return {...product, doc}
    }))

    // Creates an array representing the list of products for the new order document
    const productsForNewOrder = productDocsStockChanged.map(product => {
      return {product: product.doc._id.toString(),
        quantity: product.quantity,
        price: product.doc.price
      }
    })

    // Creates the new order document
    const newOrder = new Order({
      products: productsForNewOrder,
      user: user?._id.toString(),
      total: totalCost,
      status: 'placed'
    })

    // Saves the new order
    await newOrder.save()

    // Commits the transaction changes if this point is reached with no errors thrown
    await session.commitTransaction()
    
    // Sends confirmation that the order has been created
    res.status(201).json({orderId: newOrder._id.toString()})

    // TODO
    // Needs to delete the basket/cart if order placed successfully 

  } catch (error: unknown){
    // If error is thrown, transaction aborted and changes rolled back
    await session.abortTransaction()
    let errorMessage = `Error placing order:`
    if (error instanceof Error){
      errorMessage += error.message
    }
    res.status(500).json({error: errorMessage})
  } finally {
    // Ends the session
    await session.endSession()
  }
})

export default orderRouter