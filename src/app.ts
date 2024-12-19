import express from 'express'
import { errorHandler } from './utils/middlewear'
import userRouter from './routes/userRouter'
import loginRouter from './routes/loginRouter'

const app = express()

app.use(express.json())

app.get('/ping', (_req, res) => {
  res.send('pong')
})

app.use('/api/users', userRouter)

app.use('/api/login', loginRouter)

app.use((_req, res) => {
  res.status(400).json({error: 'Uknown endpoint'})
})

app.use(errorHandler)

export default app