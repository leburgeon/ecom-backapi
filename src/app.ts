import express from 'express'
import { errorHandler } from './utils/middlewear'
import userRouter from './routes/userRouter'
import loginRouter from './routes/loginRouter'
import productRouter from './routes/productRouter'
import orderRouter from './routes/orderRouter'
import cors from 'cors'

const app = express()

app.use(cors())

app.use(express.json())

app.get('/ping', (_req, res) => {
  res.send('pong')
})

app.use('/api/users', userRouter)

app.use('/api/login', loginRouter)

app.use('/api/products', productRouter)

app.use('/api/orders', orderRouter)

app.use((_req, res) => {
  res.status(400).json({error: 'Uknown endpoint'})
})

app.use(errorHandler)

export default app