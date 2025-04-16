import { Request } from "express"
import { NewOrderSchema, NewUserSchema, LoginCredentialsSchema, JwtUserPayloadSchema, NewProductSchema, BasketSchema, ProductImagesSchema, MulterImageSchema } from "./utils/validators"
import { z } from 'zod'
import mongoose, {  ObjectId } from "mongoose"

// Type of a request body with the required field for a new user
export type NewUser = z.infer<typeof NewUserSchema>

// Type of a request body with credentials for loggin in a user
export type LoginCredentials = z.infer<typeof LoginCredentialsSchema>

// Type for a request body that includes the required fields for adding a new product
export type NewProduct = z.infer<typeof NewProductSchema>

// Type for the image files of a new product upload
export type ProductImages = z.infer<typeof ProductImagesSchema>

// Type for the single image 
export type MulterImage = z.infer<typeof MulterImageSchema>

// Interface for defining the type of an object that contains the exposable fields for a user
export interface ExposableUser {
  name: string,
  email: string,
  id: string
}

export interface UserDocument {
  name: string,
  email: string,
  _id: mongoose.Types.ObjectId,
  isAdmin: boolean,
  orders: mongoose.Types.ObjectId[]
}

export interface ProductDocument {
  name: string,
  _id: mongoose.Types.ObjectId,
  price: number
}

// Type of a jwt payload with user info
export type JwtUserPayload = z.infer<typeof JwtUserPayloadSchema>

// Interface that extends the express request type but includes a field for the user after authenticatin
export interface AuthenticatedRequest<
  P = any, 
  ResBody = any,
  ReqBody = any
> extends Request<P, ResBody, ReqBody> {
  // must include optional parameter here otherwise overload not accepted
  user?: UserDocument
}

export interface RequestWithSearchFilters<
  P = any, 
  ResBody = any,
  ReqBody = any 
> extends Request<P, ResBody, ReqBody>{
  filters?: any
}



// Interface extending the express request, whos quiery attribute contains a page and a limit field
export interface PageQueriesRequest extends Request {
  query: {
    page: string,
    limit: string
  }
}

// Type of the parsed new order request body
export type NewOrder = z.infer<typeof NewOrderSchema>

// Type for a basket object
export type Basket = z.infer<typeof BasketSchema>

// Type for an array of product documents with a quantity
export type PopulatedBasket = {product: ProductDocument, quantity: number}[]

// Type of basket with total price, to be passed around the checkout routes
export type ProcessedBasket = {
  items: {
    product: {
      id: string,
    price: number,
    name: string
    },
    quantity: number
  }[],
  totalCost: number
}

// Typing for the results of basket validation
export type ValidatedAndPopulatedBasketResult = {
  missingStock: {notFound: ObjectId[],
    outOfStock: {id: ObjectId, quantity: number}[]
  },
  populatedItems: PopulatedBasket
}

// Typing with the fields necessary for validating a tempOrder against a purchaseUnit
export type TempOrderForValidating = {
  _id: mongoose.Types.ObjectId,
  items: {
    product: mongoose.Types.ObjectId,
    quantity: number,
    price: number,
    name: string
  }[],
  totalCost: {
    currencyCode: string,
    value: number
  }
}
