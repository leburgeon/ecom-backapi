import express, {NextFunction, Response, Request} from 'express'
import { authenticateAdmin, authenticateUser, parseNewProduct } from '../utils/middlewear'
import { NewProduct } from '../types'
import Product from '../models/Product'
import Description from '../models/Description'

const productRouter = express.Router()

// Route for adding a new product document
productRouter.post('/', authenticateAdmin, parseNewProduct, async (req: Request<unknown, unknown, NewProduct>, res: Response, next: NextFunction) => {
  const { name, category, price, description } = req.body
  try {
    // First saves the new product to the database
    const newProduct = new Product({name, category, price})
    await newProduct.save()
    // Then saves the description for the product with the associated product id
    const newProdcutDescription = new Description({
      content: description,
      product: newProduct._id
    })
    await newProdcutDescription.save()
    res.status(201).json(newProduct)
  } catch (error: unknown) {
    next(error)
  }
})

// Route for getting an array of the product details
// productRouter.get('/', (req: Request, res: Response, next: NextFunction) => {
//   try {
//     const products
//   }
// })