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
    const { productId: id, quantity: quantityString } = req.body
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
        userBasket.set('products', userBasket.products.filter(p => p.productId.toString() !== productToIncrement._id.toString()))
        // Else
      } else {
        // Check if the new value is valid (there is enough stock to potentially fulfill the order, or the increment was negative)
        if (desiredQuantity <= productToIncrement.stock || quantity < 0){
          // If it is valid, update the quantitiy on the basket item if it exists
          const wasThere = userBasket.products.some(product => {
            if (product.productId.toString() === productToIncrement._id.toString()){
              product.quantity = desiredQuantity as number
              return true
            }
            return false
          })
          // If it was not there already, add new item to the basket
          if (!wasThere){
            userBasket.products.push({productId: productToIncrement._id, quantity: desiredQuantity})
          }
        } else {
          // Else, throw an error, with the id and the stock quantity
          throw new StockError('Not enough stock', id, productToIncrement.stock)
        }
      }

      // Save the updated basket
      await userBasket.save()
      
      // Responds with the number of unique items in the basket
      res.status(200).json({basketCount: userBasket.products.length, 
        inBasket: desiredQuantity,
        items: new Array({id: productToIncrement._id.toString(), quantity: productToIncrement.stock})})

    } catch (error){
      // If stock error, return id and latest stock of the violating product
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