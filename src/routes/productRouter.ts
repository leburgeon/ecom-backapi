import express, {NextFunction, Response, Request} from 'express'
import { authenticateAdmin,  parseNewProduct, parsePagination, parseFilters } from '../utils/middlewear'
import { NewProduct, ProductImages, RequestWithSearchFilters } from '../types'
import Product from '../models/Product'
import Description from '../models/Description'
import { multerProductParser } from '../utils/middlewear'

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
productRouter.post('', authenticateAdmin, multerProductParser, parseNewProduct, async (req: Request<unknown, unknown, NewProduct>, _res: Response, _next: NextFunction) => {
  const {firstImage, gallery} = (req.files as unknown) as ProductImages

  const {name, price, stock, description, seller} = req.body
  let {categories} = req.body

  if (typeof categories === 'string'){
    categories = [categories]
  }

  // 1) Upload images to the s3 bucket in a transaction? 
  // 2) Start a mongoose transaction to first add the description, and then add the product, with the description and the image urls

  
})

export default productRouter

