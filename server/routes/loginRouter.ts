import express, { NextFunction, Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import { parseLoginCredentials } from '../utils/middlewear'
import { LoginCredentials, JwtUserPayload } from '../types'
import User from '../models/User'
import bcrypt from 'bcryptjs'
import config from '../utils/config'
import Basket from '../models/Basket'

const loginRouter = express.Router()

// Router for handing login requests
loginRouter.post('', parseLoginCredentials, async (req: Request<unknown, unknown, LoginCredentials>, res: Response, next: NextFunction) => {
  const { email, password } = req.body
  try {
    // Attempts to find the user and compares the provided password to the password hash
    const authenticatingUser = await User.findOne({email})
    if (!authenticatingUser || !(await bcrypt.compare(password, authenticatingUser.passwordHash))){
      // If the user is not found or the password is incorrect sends the error message
      res.status(400).send({error: "email/password combination incorrect"})
    } else {
      // The payload to include in the token, expires in 4h
      const payload: JwtUserPayload = {
        email: authenticatingUser.email,
        name: authenticatingUser.name,
        id: authenticatingUser._id.toString()
      }

      // For collecting the metadata of the user to send with the token
      const usersBasket = await Basket.findOne({user: authenticatingUser._id})

      const metaData = {
        basketCount: usersBasket ? usersBasket.products.length : 0
      }

      // Signs the token and sends as the body of the response with status 200
      const token = jwt.sign(payload, config.SECRET, {expiresIn: '2h'})
      res.status(200).json({
        email: authenticatingUser.email,
        name: authenticatingUser.name,
        token,
        metaData
      })
    }
  } catch (error: unknown) {
    next(error)
  }
}) 

export default loginRouter