import express, {NextFunction, Request, Response} from 'express'
import User from '../models/User'
import { authenticateAdmin, authenticateUser, parseNewUser } from '../utils/middlewear'
import { AuthenticatedRequest, NewUser } from '../types'
import bcrypt from 'bcryptjs'

const userRouter = express.Router()

// Route for returning a list of the users in the database
userRouter.get('/', authenticateAdmin, async (req: AuthenticatedRequest, res: Response, next) => {
  console.log('Authenticated user: ', req.user)
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
  const { name, email, password } = req.body
  const passwordHash = await bcrypt.hash(password, 10)

  try {
    const newUser = new User({name, email, passwordHash})
    await newUser.save()
    res.status(201).json(newUser)
  } catch (error: unknown) {
    next(error)
  }
})

// Route for adding a new admin user, request must be authenticated as coming from an existing admin
userRouter.post('/admin', authenticateAdmin, parseNewUser, async (req: Request<unknown, unknown, NewUser>, res: Response, next: NextFunction) => {
  const { name, email, password } = req.body
  const passwordHash = await bcrypt.hash(password, 10)
  try {
    const newUser = new User({name, email, passwordHash, isAdmin: true})
    await newUser.save()
    res.status(201).json({newUser})
  } catch (error: unknown){
    next(error)
  }
})


// Route for deleting a user
userRouter.delete('/:id', authenticateUser, async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  // Id of the user to delete
  const { id } = req.params
  
  // Ensures that the user is authorised to delete the user document, either with the same user id or with an admin account
  if (!(req.user?._id.toString() === id) && !(req.user?.isAdmin)) {
    res.status(401).json({error: 'Unauthorised for that one!'})
  } else {
    try {
      await User.deleteOne({_id: id})
      res.status(200).end()
    } catch (error: unknown) {
      next(error)
    }
  }
})

export default userRouter