import express, { NextFunction } from 'express'
import { Response } from 'express'
import { authenticateUser, parseProductToBasket } from '../utils/middlewear'
import Basket from '../models/Basket'
import { AuthenticatedRequest } from '../types'
import Product from '../models/Product'
import { StockError } from '../utils/Errors'

// Router for handling basket related requests
// Base Route = '/api/basket'
const basketRouter = express.Router()

// Route for getting populated basket information associated with the logged-in user
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

// Router for incrementing the quantity of an item in the basket
  // Pushes a new item if not in the basket alread
  // If the new quantity is less than zero, deletes the item from the basket
// Checks if there is enough stock available to purchase the desired quanitity
  // If not, throws an error to the client
  // Reducing stock always succeeds, even if the quantity is above the limit
basketRouter.post('/increment', authenticateUser, parseProductToBasket, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    // For calculating the new quantity for the basket item

    const userDoc = req.user
    const { productId: id, quantity: quantityString } = req.body
    const quantity = parseInt(quantityString)

    // Retrieve the document of the product to increment
    const productToIncrement = await Product.findById(id)

    // Ensures the product exists
    if (!productToIncrement){
      throw new Error('Product not found')
    }

    // Retrieves the basket document
    let userBasket = await Basket.findOne({user: userDoc?._id.toString()})

    // Checks if the basket exists already
    if (!userBasket){
      // Creates a basket if it does not
      userBasket = new Basket({user: userDoc?._id})
    }

    //  Initialise a variable for storing the desired quantity
    let desiredQuantity : number | undefined = undefined
    
    // If the product is in the basket, update the desired quantity variable to the new value
    userBasket.products.forEach(product => {
      if (product.productId.toString() === id){
        desiredQuantity = product.quantity + quantity
      }
    })

    // If the item was not in the basekt, use the increment as the desired quantity
    if (desiredQuantity === undefined){
      desiredQuantity = quantity
    }

    // This try block is responsible for ensuring there is enough stock, and updating the basket
    try {
      // Check if the new value is <= 0
      if (desiredQuantity < 1){
        // If it is, removes the item from the basket alltogether
        userBasket.set('products', userBasket.products.filter(p => p.productId.toString() !== productToIncrement._id.toString()))
      } else {
        // If the new value is positive, check if there is enough stock for this new value
        // This check should also pass if the increment is negative, to ensure that the user can decrease out of stock items
        if (desiredQuantity <= productToIncrement.stock || quantity < 0){
          // Update the quantitiy on the basket item if it exists
          const wasThere = userBasket.products.some(product => {
            if (product.productId.toString() === productToIncrement._id.toString()){
              product.quantity = desiredQuantity as number
              return true
            }
            return false
          })
          // If it did not exists in the basket already, add the item to the basket
          if (!wasThere){
            userBasket.products.push({productId: productToIncrement._id, quantity: desiredQuantity})
          }
        } else {
          // If the increment was positive, and there was not enough stock, throw an error with the information of the invalid stock
          throw new StockError('Not enough stock', id, productToIncrement.stock)
        }
      }

      // Saves the updated basket
      await userBasket.save()
      
      // Responds with the number of unique items in the basket after the increment
      res.status(200).json({basketCount: userBasket.products.length, 
        inBasket: desiredQuantity,
        items: new Array({id: productToIncrement._id.toString(), quantity: productToIncrement.stock})})

    } catch (error){
      // If there was a stock error, respond with the id and the latest stock quantity of the product
      if (error instanceof StockError){
        res.status(400).json({
          error: error.message,
          items: new Array({id: productToIncrement._id.toString(), quantity: productToIncrement.stock})
        })
      } else {
        throw error
      }
    }
      
  } catch (error){
    next(error)
  }
})

// Route for removing an item from the basket
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

    // Responds with the number of unique items in the basket after the update
    res.status(200).json({basketCount})
  } catch (error){
    next(error)
  }
})

export default basketRouter