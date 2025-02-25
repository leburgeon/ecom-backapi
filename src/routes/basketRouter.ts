import express, { NextFunction } from 'express'
import { Response } from 'express'
import { authenticateUser, parseProductToBasket } from '../utils/middlewear'
import Basket from '../models/Basket'
import { AuthenticatedRequest } from '../types'
import Product from '../models/Product'

const basketRouter = express.Router()

// Route for getting the basket information of the user

basketRouter.post('/add', authenticateUser, parseProductToBasket, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const userDoc = req.user
  const productToAddId = req.body.productId
  const quantityToAdd = parseInt(req.body.quantity)

  // First ensures that the objectId corresponds to a valid product
  const productToAdd = await Product.findById(productToAddId)
  if (!productToAdd){
    
    const errorMessage = `Error finding the product with the id ${productToAddId}`
    console.log(errorMessage)
    res.status(404).json({error: errorMessage})

  } else {
    try {
      // Attempts to find the basket associated with the user
      let usersBasket = await Basket.findOne({user: userDoc?._id})
  
      // If no basket is found, a basket is created for that user with the item to add
      if (!usersBasket){
        usersBasket = new Basket({user: userDoc?._id})
        await usersBasket.save()
      }
  
      // Itterates over the array of products already in the basket
      let wasInBasket = false
      usersBasket.products.forEach(product => {

        // If the product exists in the basket already, increases the quantity by requested amount
        if (product.productId.toString() === productToAdd._id.toString()){
          product.quantity += quantityToAdd
          wasInBasket = true
        }
      })
      // If the product was not in the basket, adds a new product object to the array of products
      if (!wasInBasket){
        usersBasket.products.push({
          productId: productToAdd._id,
          quantity: quantityToAdd
        })
      }

      // Saves the basket after changes
      await usersBasket.save()

      const productsNowInBasket = usersBasket.products.length
      console.log(productsNowInBasket)

      // Confirms the add to the frontend, with the amount of products now in the basket
      res.status(200).json({basketCount: productsNowInBasket})
    } catch (error) {
      console.error('Error adding product to basket', error)
      next(error)
    }
  }  
})

basketRouter.post('/reduce', authenticateUser, parseProductToBasket, async (_req: AuthenticatedRequest, _res: Response, _next: NextFunction) =>{
  // TODO
})

export default basketRouter