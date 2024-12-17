import { z } from 'zod'

export const NewUserSchema = z.object({
  name: z.string(),
  username: z.string().trim().min(5).toLowerCase(),
  password: z.string().min(5)
})