import { z } from 'zod'
import mongoose from 'mongoose'

export const NewUserSchema = z.object({
  name: z.string(),
  email: z.string().email().trim().toLowerCase(),
  password: z.string().min(5)
})

export const NewProductSchema = z.object({
  name: z.string(),
  categories: z.union([z.string().array(), z.string()]),
  price: z.coerce.number(),
  description: z.string().min(10),
  stock: z.coerce.number(),
  seller: z.string()
})

export const LoginCredentialsSchema = z.object({
  email: z.string().email().toLowerCase().trim(),
  password: z.string()
})

export const JwtUserPayloadSchema = z.object({
  email: z.string().email().toLowerCase().trim(),
  name: z.string(),
  id: z.string()
})

export const PaginationDetailsSchema = z.object({
  page: z.coerce.number(),
  limit: z.coerce.number()
})

export const ObjectIdSchema = z.string().refine(val => mongoose.Types.ObjectId.isValid(val), {
  message: 'Invalid ObjectId'
})

export const NewOrderSchema = z.object({
  products: z.object({
    id: ObjectIdSchema,
    quantity: z.coerce.number()
  }).array()
})

export const BasketSchema = z.object({
  id: ObjectIdSchema,
  quantity: z.coerce.number()
}).array()

export const MulterImageSchema = z
  .object({
    mimetype: z.enum(["image/png", "image/jpeg", "image/jpg"]),
    buffer: z.instanceof(Buffer), // Ensures the file has binary content
    size: z.number().max(5 * 1024 * 1024, "File must be less than 5MB"), // Max 5MB
    originalname: z.string()
  })

export const ProductImagesSchema = z.object({
  firstImage: MulterImageSchema.array().length(1),
  gallery: MulterImageSchema.array().max(4).optional()
})