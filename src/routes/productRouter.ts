import express, {NextFunction, Response, Request} from 'express'
import { authenticateAdmin,  parseNewProduct, parsePagination, parseFilters } from '../utils/middlewear'
import { NewProduct, RequestWithSearchFilters } from '../types'
import Product from '../models/Product'
import Description from '../models/Description'
import mongoose from 'mongoose'
import multer from 'multer'

const productRouter = express.Router()

// TODO add filtering based on category or price range
// Route for retrieving the products 
productRouter.get('', parsePagination, parseFilters, async (req: RequestWithSearchFilters, res: Response, next: NextFunction) => {
  const filters = req.filters
 // Parses the query strings to integers
  const page = parseInt(req.query.page as string) || 1
  const limit = parseInt(req.query.limit as string) || 10

  // Retrieves and returns the correct products according to the pagination provided
  try {
    const productsCount = await Product.countDocuments(filters)
    const products = await Product.find(filters).limit(limit).skip((page - 1) * limit)
    res.status(200).json({products, productsCount})
  } catch (error: unknown) {
    next(error)
  }
})

productRouter.get('/pageof', parsePagination, parseFilters, async (req: RequestWithSearchFilters, res: Response, next: NextFunction) => {
  const filters = req.filters
  const page = parseInt(req.query.page as string) || 1
  const limit = parseInt(req.query.limit as string) || 10

  try {
    const products = await Product.find(filters).limit(limit).skip((page - 1) * limit)
    res.status(200).json(products)
  } catch (error) {
    console.error('Error with pageof route', error)
    next(error)
  }

})

// Route for retrieving a single product from the database and populating it
productRouter.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params

  try {
    const productToReturn = await Product.findById(id)
    if (!productToReturn) {
      
      res.status(404).json('Product not found')
    } else {
      await productToReturn.populate('description')
      res.status(200).json(productToReturn)
    }
  } catch (error: unknown) {
    next(error)
  }
})

// Route for deleting a product using the id, requires admin
// Deletes the description associated with the product first
productRouter.delete('/:id', authenticateAdmin, async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params
  try {
    await Description.findOneAndDelete({product: id})
    await Product.findByIdAndDelete(id)
    res.status(204).end()
  } catch (error: unknown){
    next(error)
  }
})

// Route for adding a new product document
productRouter.post('', authenticateAdmin, mul, async (req: Request<unknown, unknown, NewProduct>, res: Response, next: NextFunction) => {
  const { name, categories, price, description} = req.body

  try {
    // First creates the new product document
    const newProduct = new Product({name, categories, price})

    // Then the new description is added for the product
    // Product field is the id of the new product document
    const newProdcutDescription = new Description({
      content: description,
      product: newProduct._id
    })

    // Description saved
    await newProdcutDescription.save()

    // Description field of the new product as the new description document id
    newProduct.description = newProdcutDescription._id as mongoose.Types.ObjectId

    // Saves the new product document to database
    await newProduct.save()
    
    res.status(201).json(newProduct)
  } catch (error: unknown) {
    next(error)
  }
})

export default productRouter

