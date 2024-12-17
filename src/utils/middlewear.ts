import { Request, Response, NextFunction } from "express"
import { NewUserSchema } from "./validators"
import mongoose from "mongoose"
import { ZodError } from "zod"

export const parseNewUser = (req: Request, _res: Response, next: NextFunction) => {
  try {
    NewUserSchema.parse(req.body)
    next()
  } catch (error: unknown) {
    next(error)
  }
}

export const errorHandler = (error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (error instanceof mongoose.Error.ValidationError) {  // For handling a mongoose validation error
    res.status(400).json({error: error.message})
  } else if (error instanceof mongoose.Error.CastError) { // For handling mongoose cast error
    res.status(400).json({error: error.message})
  } else if (error instanceof mongoose.Error && (error as any).code === 11000) { // For handling mongo duplicate key error
    res.status(409).json({error: 'Duplicate Key Error: ' + error.message})
  } else if (error instanceof ZodError) { // For handling duplicate key error
    res.status(400).json({error: error.issues})
  } else {
    res.status(500).json({error: 'Internal Server Error'})
  }
}