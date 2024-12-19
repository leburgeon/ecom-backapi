import { Request } from "express"
import { NewUserSchema, LoginCredentialsSchema, JwtUserPayloadSchema } from "./utils/validators"
import { z } from 'zod'

export type NewUser = z.infer<typeof NewUserSchema>

export type LoginCredentials = z.infer<typeof LoginCredentialsSchema>
export interface ExposableUser {
  name: string,
  username: string,
  id: string,
  isAdmin?: boolean
}

export type JwtUserPayload = z.infer<typeof JwtUserPayloadSchema>

export interface AuthenticatedRequest extends Request {
  // must include optional parameter here otherwise overload not accepted
  user?: ExposableUser
}