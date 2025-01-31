import express, { Response } from 'express'
import { authenticateUser } from '../utils/middlewear'
import { AuthenticatedRequest, NewOrder } from '../types'
import Product from '../models/Product'
import mongoose from 'mongoose'
import Order from '../models/Order'
// import paypalClient from '../utils/paypalClient'

// Baseurl is /api/orders
const orderRouter = express.Router()

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
      if (product.quantity > doc.stock.reserved){
        throw new Error(`Insufficient stock for ${doc.name} x ${product.quantity}`)
      }

      // Updates the cost total 
      totalCost += (doc.price * product.quantity)

      // Decrements the stock reserve and returns the document (not saved)
      doc.stock.reserved -= product.quantity

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