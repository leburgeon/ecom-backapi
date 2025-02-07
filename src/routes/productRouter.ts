import express, {NextFunction, Response, Request} from 'express'
import { authenticateAdmin,  parseNewProduct, parsePagination } from '../utils/middlewear'
import { NewProduct } from '../types'
import Product from '../models/Product'
import Description from '../models/Description'
import mongoose from 'mongoose'
import { z } from 'zod'

const productRouter = express.Router()

// TODO add filtering based on category or price range
// Route for retrieving the products 
productRouter.get('/', parsePagination, async (req: Request, res: Response, next: NextFunction) => {

  const { category, minPrice, maxPrice, inStock } = req.query
  const filters: any = {}

  // For adding a filter to only include the filtered categories
  if (category && z.string().parse(category)){
    
    filters.categories = {
      $in: [category] 
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
  if (inStock && inStock === 'true') {
    filters['stock.quantity'] = { $gte: 1 }
  }

  console.log('#################################')
  console.log(filters)

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
productRouter.post('/', authenticateAdmin, parseNewProduct, async (req: Request<unknown, unknown, NewProduct>, res: Response, next: NextFunction) => {
  const { name, category, price, description, inStock } = req.body

  try {

    // First creates the new product document
    const newProduct = new Product({name, category, price, inStock})

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

