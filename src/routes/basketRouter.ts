import express, { NextFunction } from 'express'
import { Response } from 'express'
import { authenticateUser, parseProductToBasket } from '../utils/middlewear'
import Basket from '../models/Basket'
import { AuthenticatedRequest } from '../types'
import Product from '../models/Product'
import { StockError } from '../utils/Errors'

const basketRouter = express.Router()

// Route for getting the populated basket information of the user
basketRouter.get('', authenticateUser, async (req: AuthenticatedRequest, res: Response, next: NextFunction)=> {
  try {
    // Populates the items array on the basket
    const userBasket = await Basket.findOne({user: req.user?._id}).populate('products.productId', 'name price stock firstImage')
    const productsArray = userBasket?.products.map(product => {
      // The product id field is now a populated mongoose document
      return {
        product: product.productId,
        quantity: product.quantity
      }
    })
    res.status(200).json({basket: productsArray})
  } catch (error){
    console.error('Error fetching user basket', error)
    next(error)
  }
})

// Router for adding stock to the basket - should check if there is enough to make the change 
basketRouter.post('/increment', authenticateUser, parseProductToBasket, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  // Try block responsible for calculating the udpate that needs to happen
  try {
    const userDoc = req.user
    const { id, quantityString } = req.body
    const quantity = parseInt(quantityString)

    // Retrieve the product document
    const productToIncrement = await Product.findById(id)

    // Ensure exists
    if (!productToIncrement){
      throw new Error('Product not found')
    }

    // Retrieve the basket document
    let userBasket = await Basket.findOne({user: userDoc?._id.toString()})

    // Ensure exists 
    if (!userBasket){
      // Creates one if not
      userBasket = new Basket({user: userDoc?._id})
    }

    //  Initialise a variable for storing the desired quantity
    let desiredQuantity : number | undefined = undefined

    // If the product is already in the basket, set the desired quantity using the existing amount and the increment
    userBasket.products.forEach(product => {
      if (product.productId.toString() === id){
        desiredQuantity = product.quantity + quantity
      }
    })

    // Else, set the desiredQuantity to the increment
    if (desiredQuantity === undefined){
      desiredQuantity = quantity
    }

    // Try block responsible for updating the document and saving
    try {
      // Check if the desiredQuantity is less than 1
      if (desiredQuantity < 1){
        // If it is, filter the product from the basket
        userBasket.products.filter(product => {
          return product.productId.toString() === productToIncrement._id.toString()
        })
        // Else, check if the new value is valid
      } else {
        // If it is, update the value
        if (desiredQuantity <= productToIncrement.stock){
          userBasket.products.map(product => {
            if (product.productId.toString() === productToIncrement._id.toString()){
              return {
                ...product,
                quantity: desiredQuantity
              }
            } else {
              return product
            }
          })
        } else {
          // Else, throw an error, with the id and the stock quantity
          throw new StockError('Not enough stock', id, productToIncrement.stock)
        }
      }

      // Save the updated basket
      await userBasket.save()     
      // Responds with the number of unique items in the basket
      res.status(200).json({basketCount: userBasket.products.length})

    } catch (error){
      // If stock error, return id and latest stock of the violating product
      if (error instanceof StockError){
        res.status(400).json({
          error: error.message,
          id,
          quantity: productToIncrement.stock
        })
      } else {
        throw error
      }
    }
      
  } catch (error){
    next(error)
  }
})

basketRouter.post('/reduce', authenticateUser, parseProductToBasket, async (req: AuthenticatedRequest, res: Response, _next: NextFunction) => {
  const userDoc = req.user
  const productToReduceId = req.body.productId
  const quantityToRemove = parseInt(req.body.quantity)

  try {
    // First attempts to find the product
    const productToReduce = await Product.findById(productToReduceId)
    if (!productToReduce){
      // If not found, respond with 404 not found
      res.status(404).json({error: 'Product to reduce from basket not found'})
    } else {
      // Attempts to find the user basket
      const userBasket = await Basket.findOne({user: userDoc?._id})

      // If no basket exists, no need to remove item
      if (!userBasket){
        res.status(200)
      } else {
        
        // Uses a mongoDB query to update the product array 
        // Breakdown: the first object argument is the query selector, which is used to:
          // 1: Select the document 
          // 2: specify a condition on array elements which is utilised by the $ operator
        // await Basket.updateOne({_id: userBasket._id, 'products.productId': productToReduce._id},
        //   // The second object argument is the update operation
        //   // In this example, the $inc update operator is used alongside the $ operator to affect only the first matching element
        //   // The '.' operator is subsequantly used to identify which field of the object to affect
        //   {
        //     $inc: {'products.$.quantity': - quantityToRemove},
        //     // The second field of this update operation is used to remove elements in the products array, whos condition is met
        //     $pull: { products: {quantity: {$lte: 1}}}
        //   }
        // )
        // UPDATE:: Performing operations that could cause a conflict throws a mongo server error
        // Seperated operations
        // Decrements by the specified amount
        await Basket.updateOne({_id: userBasket._id, 'products.productId': productToReduce._id},
          {$inc: {'products.$.quantity': -quantityToRemove}}
        )
        // Deletes all products in the basket with a quantity less than 1
        await Basket.updateOne({_id: userBasket._id},
          {$pull: {products: {quantity: {$lte: 0}}}}
        )

        const usersBasketAfter = await Basket.findById(userBasket._id)
        res.status(200).json({basketCount: usersBasketAfter?.products.length})
      }
    }
  } catch (error) {
    console.error('SOMTHING WRONG REDUCING FROM BASKET', error)
    res.status(500).json({
      error: 'There was an error removing this from the basket'
    })
  }
  
})

// Route for removing an item from the basket entirely
basketRouter.delete('/:id', authenticateUser, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try{
    const productToRemove = await Product.findById(req.params.id)

    if (productToRemove){
      // Perform an update operation on the products array, for the basket document with the matching user id
      await Basket.updateOne({user: req.user?._id},{$pull: {products: {productId: productToRemove._id}}})
    }

    // Calculates the number of unique items in the basket
    const userBasket = await Basket.findOne({user: req.user?._id})
    const basketCount = userBasket?.products.length

    res.status(200).json({basketCount})
  } catch (error){
    console.error('Error removing from basket entirely', error)
    next(error)
  }
})

export default basketRouter