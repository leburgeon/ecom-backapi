import express from 'express'
import User from '../models/User'

const userRouter = express.Router()

userRouter.get('/', async (req, res, next) => {
  try {
    const allUsers = await User.find({})
    res.status(200).json(allUsers)
  }
  
})