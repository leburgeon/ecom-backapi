import express, {NextFunction, Response, Request} from 'express'
import { authenticateAdmin,  parseNewProduct, parsePagination, parseFilters } from '../utils/middlewear'
import { NewProduct, ProductImages, RequestWithSearchFilters } from '../types'
import Product from '../models/Product'
import Description from '../models/Description'
import { multerProductParser } from '../utils/middlewear'
import s3Service from '../utils/s3Service'
import {v4 as uuidV4} from 'uuid'
import mongoose from 'mongoose'
import config from '../utils/config'
import { S3ServiceException } from '@aws-sdk/client-s3'

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
productRouter.post('', authenticateAdmin, multerProductParser, parseNewProduct, async (req: Request<unknown, unknown, NewProduct>, res: Response, next: NextFunction) => {
  
  const {firstImage: firstImageArray} = req.files as unknown as ProductImages
  const firstImage = firstImageArray[0]

  const {name, price, stock, description, seller} = req.body
  let {categories} = req.body

  if (typeof categories === 'string'){
    categories = [categories]
  }

  // Generates a unique image key for the image, using the uuid and the original image name
  const imageKey = `images/${uuidV4()}-${firstImage.originalname}`

  try {
    // Upload image using the uplaoder
    await s3Service.uploader(firstImage, imageKey)

    // Start the transaction for the product upload
    const session = await mongoose.startSession()
    session.startTransaction()
    try {
      // Adds the description
      const newDescription = new Description({content: description})

      // Creates a new product
      const firstImageUrl = `${config.CLOUD_FRONT_IMAGE_BUCKET_URL}/${imageKey}`
      const newProduct = new Product({
        name,
        price,
        stock,
        reserved: 0,
        description: newDescription._id,
        firstImage: firstImageUrl,
        seller,
        categories,
        rating: {
          total: 0,
          count: 0
        }
      })

      await newProduct.save()
      await newDescription.save()
      
      await session.commitTransaction()

      res.status(200).json({data: newProduct._id.toString()})
    } catch (error){
      // Delete the image since it succeeded before, and abort the transaction
      await s3Service.deleteImage(imageKey)
      await session.abortTransaction()
      // Throw error describing that mongoose failed
      console.error(error)
      throw error
    } finally {
      await session.endSession()
    }
  } catch (error){
    console.error('Failed upload', error)
    // Return status 500
    let errorMessage = 'Failed to upload new product: '
    if (error instanceof S3ServiceException){
      errorMessage += 'Image upload failed'
      res.status(500).json({error: errorMessage})
    } else {
      next(error)
    }
  }
})

export default productRouter

