import { Request, Response, NextFunction } from "express"
import {  NewOrderSchema, JwtUserPayloadSchema, LoginCredentialsSchema, NewProductSchema, NewUserSchema, PaginationDetailsSchema, BasketSchema } from "./validators"
import mongoose from "mongoose"
import { ZodError } from "zod"
import jwt, { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken'
import config from "./config"
import User from "../models/User"
import { AuthenticatedRequest, Basket, RequestWithSearchFilters } from "../types"
import { z } from 'zod'
import Product from "../models/Product"
import { StockError } from "./Errors"

// Middlewear for parsing the new request and ensuring that the request has fiels for page limit and page number 

// Middlewear for authenticating a user and extracting the user info into the request
export const authenticateUser = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {

  // Extracts the authorisation header from the request
  const authorisation = req.get('Authorization')

  // Checks that the token uses the bearer scheme and if not sends the request
  if (!authorisation || !authorisation.startsWith('Bearer ')){
    res.status(401).json({error: 'Please provide authentication token with bearer scheme'})
  } else {
    try {

      // Attempts to verify the token with the environment secret
      const token = authorisation.replace('Bearer ', '')
      const decoded = jwt.verify(token, config.SECRET)
      const payload = JwtUserPayloadSchema.parse(decoded)

      // Finds the user with the id in the payload
      const userDocument = await User.findById(payload.id)      
      if (!userDocument) {

        // If the user is not found, response is updates
        res.status(401).send({error: 'User not found, re-login'})
      } else {
        req.user = userDocument
        next()
      }
    } catch (error: unknown) {
      console.log('Error thrown during auth')
      next(error)
    }
  }
}

// Middlewear for authenticating an admin
export const authenticateAdmin = async (req: Request, res: Response, next: NextFunction) => {
  const authorization = req.get('Authorization')

  // Checks that the authorization uses the bearer scheme
  if (!authorization || !authorization.startsWith('Bearer ')){
    res.status(401).json({error: 'Please provide auth token with bearer scheme'})
  } else {
    const token = authorization.replace('Bearer ', '')
    try {
      // Verifies the token whilst decoding the payload
      const decoded = jwt.verify(token, config.SECRET)
      const payload = JwtUserPayloadSchema.parse(decoded)
      // Attempts to find an admin account with the id in the payload
      const adminUser = await User.findOne({_id: payload.id, isAdmin: true})
      if (!adminUser) {
        res.status(401).json({error: 'Admin user not found'})
      } else {
        next()
      }
    } catch (error: unknown) {
      next(error)
    }
  }
}

// Middlewear for parsing the request body before creating a new user
export const parseNewUser = (req: Request, _res: Response, next: NextFunction) => {
  try {
    NewUserSchema.parse(req.body)
    next()
  } catch (error: unknown) {
    next(error)
  }
}

// Middlewear for parsing the request body for the fields required for a new product
export const parseNewProduct = (req: Request, _res: Response, next: NextFunction) => {
  try {
    NewProductSchema.parse(req.body)
    next()
  } catch (error: unknown) {
    next(error)
  }
}

// For parsing the request body for the login credentials
export const parseLoginCredentials = (req: Request, _res: Response, next: NextFunction) => {
  try {
    LoginCredentialsSchema.parse(req.body)
    next()
  } catch (error: unknown) {
    next(error)
  }
}

// For parsing the query attribute on the express request for pagination details
export const parsePagination = (req: Request, _res: Response, next: NextFunction) => {
  try {
    PaginationDetailsSchema.parse(req.query)
    next()
  } catch (error: unknown){
    next(error)
  }
}

// For parsing the request body a new order
export const parseNewOrder = (req: Request, _res: Response, next: NextFunction) => {
  try {
    NewOrderSchema.parse(req.body)
    next()
  } catch (error: unknown) {
    next(error)
  }
}

// Middlewear for parsing the filter information for a search request
export const parseFilters = (req: RequestWithSearchFilters, _res: Response, next: NextFunction) => {
  const { category, minPrice, maxPrice, inStockOnly, query } = req.query
  const filters: any = {}

  // For adding a filter for the search query
  if (query && z.string().safeParse(query)){
    filters.name = {
      $regex: query,
      $options: "i"
    }
  }

  // For adding a filter to only include results that contain the given category in their list
  if (category && z.string().safeParse(category)){
    if (category !== 'null'){
      filters.categories = {
        $in: [category]
      }
    }
  }

  // For adding filters for the min and max values for price if they exist
  if (minPrice && !isNaN(Number(minPrice))){
    filters.price = {...filters.price, $gte: Number(minPrice)}
  }
  if (maxPrice && !isNaN(Number(maxPrice))){
    filters.price = {...filters.price, $lte: Number(maxPrice)}
  }

  // For adding a filter to only return instock items
  if (inStockOnly && inStockOnly === 'true') {
    filters['stock'] = { $gte: 1 }
  }

  req.filters = filters

  next()
}

// Middlewear for parsing the required info for adding an item to the basket
export const parseProductToBasket = (req: Request, _res: Response, next: NextFunction) => {
  if (!mongoose.isValidObjectId(req.body.productId) || isNaN(parseInt(req.body.quantity))){
    next(new Error('Must include valid productId and quantity for adding or removing from basket'))
  }
  next()
}

// Middlewear for parsing a basket from the request body
export const parseBasket = (req: Request, _res: Response, next: NextFunction) => {
  try {
    BasketSchema.parse(req.body)
    next()
  } catch (error) {
    next(error)
  }
}

// Method for async validating stock, and returning an object with the results
const validateBasket = async (basket: Basket) => {
  // Checks the stock for all the items in the basket and returns an array of promises for these checks
  const promiseArrayOfStockChecks = basket.map(async (item) => {
    const product = await Product.findById(item.id)
    if (!product){
      throw new StockError('Product not found', item.id)
    }
    if (product.stock < item.quantity){
      throw new StockError('Out of stock', item.id)
    }
  })

  // Once resolved, an array of the results of each of these checks
  const stockCheckResults = await Promise.allSettled(promiseArrayOfStockChecks)

  // Object for storing the ids of not found or out of stock products
  const missingStock = {
    notFound: new Array(),
    outOfStock: new Array()
  }

  // Itterates over the results, adding any ids to the correct arrays in the stock results
  stockCheckResults.forEach(result => {
    if (result.status === 'rejected'){
      const error = result.reason
      if (error instanceof StockError){
        if (error.message === 'Out of stock'){
          missingStock.outOfStock.push(error.id) 
        } else if (error.message === 'Product not found'){
          missingStock.notFound.push(error.id)
        }
      }
    }
  })

  return missingStock
}

// Middlewear for validating the stock levels and product ids from a basket [{id, quantity}]
export const validateBasketStock = async (req: Request<unknown, unknown, Basket>, res: Response, next: NextFunction) => {
  const basket = req.body
    // Handles empty basket case
    if (basket.length === 0){
      res.status(500).json({error: 'Basket was empty'})
    } else {
        const missingStock = await validateBasket(basket)
  
        if (missingStock.notFound.length > 0){
          res.status(500).json({error: 'Some products not found',
            ids: missingStock.notFound
          })
        } else if (missingStock.outOfStock.length > 0){
          res.status(400).json({error: 'Some products out of stock',
            ids: missingStock.outOfStock
          })
        } else {
          next()
        }
      }
}

export const requestLogger = (req: Request, _res: Response, next: NextFunction) => {
  const method = req.method
  const url = req.originalUrl
  const body = req.body
  console.log(`Method: ${method} Url: ${url} Body: ${body}`)
  next()
}



// Error handler for the application
export const errorHandler = (error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (error instanceof mongoose.Error.ValidationError) {  // For handling a mongoose validation error
    res.status(400).json({error: error.message})
  } else if (error instanceof mongoose.Error.CastError) { // For handling mongoose cast error
    res.status(400).json({error: error.message})
  } else if ((error as any).code === 11000 && error instanceof Error) { // For handling mongo duplicate key error
    res.status(409).json({error: 'Duplicate Key Error: ' + error.message})
  } else if (error instanceof ZodError) { // For handling duplicate key error
    res.status(401).json({error: error.issues})
  } else if (error instanceof JsonWebTokenError) {
    res.status(401).json({error: `${error.name}:${error.message}`})
  } else if (error instanceof TokenExpiredError){
    res.status(400).json({error: 'Token expired, please re-login'})
  } else if (error instanceof Error && error.message === 'Must include valid productId and quantity for adding or removing from basket') {
    res.status(401).json({error: error.message})
  } else {
    console.log('unhandled error case')
    console.error(error)
    let errorMessage = 'Internal server error and unhandled error case: '
    if (error instanceof Error){
      errorMessage += error.message
    }
    res.status(500).json({error: errorMessage})
  }
}