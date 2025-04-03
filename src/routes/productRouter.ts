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

// Route for retrieving the products
  // Filters results based on category, aswell as pagination information
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

// Route for getting the products for a new page
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

// Route for retrieving a single populated product
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
  // Middlewear ensures that the required fields exist, and that there is at least a first image
  // Imgages uploaded to an S3 bucket before the product document is saved
productRouter.post('', authenticateAdmin, multerProductParser, parseNewProduct, async (req: Request<unknown, unknown, NewProduct>, res: Response, next: NextFunction) => {
  
  const {firstImage: firstImageArray, gallery} = req.files as unknown as ProductImages
  const firstImage = firstImageArray[0]

  const {name, price, stock, description, seller} = req.body
  let {categories} = req.body

  if (!categories) {
    categories = []
  } else if (typeof categories === 'string'){
    categories = [categories]
  }

  // Generates a unique image key for the image, using the uuid and the original image name
  const imageKey = `images/${uuidV4()}-${firstImage.originalname}`

  try {
    // Upload firstImage using the uplaoder
    await s3Service.uploader(firstImage, imageKey)

    // Upload the gallery images if they exist
    const galleryKeys: string[] = []
    if (Array.isArray(gallery)){
      // For each of the images
      const promises = gallery.map((image) => {
        // Generates the key and adds to the keys array
        const key = `images/${uuidV4()}-${image.originalname}`
        galleryKeys.push(key)
        // Uploads the image using the key
        return s3Service.uploader(image, key)
      })

      // Waits for the promises to resolve to a single prosmise
      await Promise.all(promises)
    }

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
        gallery: galleryKeys.length === 0 ? []
          :galleryKeys.map(key => `${config.CLOUD_FRONT_IMAGE_BUCKET_URL}/${key}`),
        seller,
        categories,
        rating: {
          total: 0,
          count: 0
        }
      })

      await newProduct.save({session})
      await newDescription.save({session})
      
      await session.commitTransaction()

      res.status(200).json({data: newProduct._id.toString()})
    } catch (error){
      // If uploading a new product failes after the images have been uploaded, remove them from the bucket
      await s3Service.deleteImage(imageKey)

      // If there were gallery images, delete them as well
      if (galleryKeys.length !== 0){
        const promises = galleryKeys.map((key) => {
          return s3Service.deleteImage(key)
        })
        await Promise.all(promises)
      }

      // Aborts the transaction
      await session.abortTransaction()

      // Throws the error to the outer try-block to ensure that the response is sent
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

