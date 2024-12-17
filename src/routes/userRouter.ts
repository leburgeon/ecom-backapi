import express, {NextFunction, Request, Response} from 'express'
import User from '../models/User'
import { parseNewUser } from '../utils/middlewear'
import { NewUser } from '../types'
import bcrypt from 'bcryptjs'

const userRouter = express.Router()

// Route for returning a list of the users in the database
userRouter.get('/', async (_req, res, next) => {
  try {
    const allUsers = await User.find({})
    res.status(200).json(allUsers)
  } catch (error: unknown) {
    next(error)
  }
})

// TODO Route for getting the data for a single user, returns the user and populated order data


// Route for adding a new user
userRouter.post('/', parseNewUser, async (req: Request<unknown, unknown, NewUser>, res: Response, next: NextFunction) => {
  const { name, username, password } = req.body
  const passwordHash = await bcrypt.hash(password, 10)

  try {
    const newUser = new User({name, username, passwordHash})
    await newUser.save()
    res.status(201).json(newUser)
  } catch (error: unknown) {
    next(error)
  }
})

// Route for deleting a user
userRouter.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  // TODO add check that the use is authorised to delete this user

  // Id of the user to delete
  const { id } = req.params

  try {
    await User.deleteOne({_id: id})
    res.status(200).end()
  } catch (error: unknown) {
    next(error)
  }
})

export default userRouter