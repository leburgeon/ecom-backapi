import express, { Response } from 'express'
import { authenticateUser } from '../utils/middlewear'
import { AuthenticatedRequest, NewOrder } from '../types'
import Product from '../models/Product'
import mongoose from 'mongoose'
import Order from '../models/Order'

const orderRouter = express.Router()

// Route for creating a new order and reducing the stock count
orderRouter.post('/', authenticateUser, async (req: AuthenticatedRequest<unknown, unknown, NewOrder>, res: Response) => {
  const { products, total } = req.body

  const { user } = req

  // For starting a transaction session
  const session = await mongoose.startSession()
  session.startTransaction()

  try {

    // Validates that each of the products exists and has adequate stock reserved
    // Then saves each of the updated products stock
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

      // Decrements the stock reserve and returns the document (not saved)
      doc.stock.reserved -= product.quantity

      // Then attempts to save the doc
      await doc.save()
      return {...product, doc}
    }))


    // Products array for new order
    const productsForNewOrder = productDocsStockChanged.map(product => {
      return {product: product.doc._id.toString(),
        quantity: product.quantity,
        price: product.doc.price
      }
    })

    // For creating the new order document 
    const newOrder = new Order({
      products: productsForNewOrder,
      user: user?._id.toString(),
      total: total,
      status: 'placed'
    })

    // Saves the new order
    await newOrder.save()

    // Commits the transaction changes if this point is reached with no errors thrown
    await session.commitTransaction()
    
    // Sends confirmation that the order has been created
    res.status(201).json({orderId: newOrder._id.toString()})

    // TODO
    // Needs to delete the basked if order placed successfully 

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