import { NewUserSchema } from "./utils/validators"
import { z } from 'zod'

export type NewUser = z.infer<typeof NewUserSchema>

export interface ExposableUser {
  name: string,
  username: string,
  id: string
}