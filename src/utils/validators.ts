import { z } from 'zod'

export const NewUserSchema = z.object({
  name: z.string(),
  email: z.string().email().trim().toLowerCase(),
  password: z.string().min(5)
})

export const NewProductSchema = z.object({
  name: z.string(),
  categories: z.string().array(),
  price: z.coerce.number(),
  description: z.string().min(10),
  initialStock: z.coerce.number(),
  firstImage: z.string().url(),
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

export const NewOrderSchema = z.object({
  products: z.object({
    id: z.string(),
    quantity: z.coerce.number()
  }).array()
})