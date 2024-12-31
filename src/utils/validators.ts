import { z } from 'zod'

export const NewUserSchema = z.object({
  name: z.string(),
  username: z.string().trim().min(5).toLowerCase(),
  password: z.string().min(5)
})

export const NewProductSchema = z.object({
  name: z.string(),
  category: z.string(),
  price: z.coerce.number(),
  description: z.string().min(10),
  inStock: z.coerce.boolean()
})

export const LoginCredentialsSchema = z.object({
  username: z.string(),
  password: z.string()
})

export const JwtUserPayloadSchema = z.object({
  username: z.string(),
  name: z.string(),
  id: z.string()
})

export const PaginationDetailsSchema = z.object({
  page: z.coerce.number(),
  limit: z.coerce.number()
})