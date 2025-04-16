import express from 'express'
import { errorHandler, requestLogger } from './utils/middlewear'
import userRouter from './routes/userRouter'
import loginRouter from './routes/loginRouter'
import productRouter from './routes/productRouter'
import orderRouter from './routes/orderRouter'
import basketRouter from './routes/basketRouter'
import cors from 'cors'

const app = express()

app.use(cors())

app.use(express.static('dist'))

app.use(express.json())

app.use(express.urlencoded({extended: true}))

app.use(requestLogger)

app.use('/health', (_req, res) => {
  res.send('OK')
})

app.use('/api/users', userRouter)

app.use('/api/login', loginRouter)

app.use('/api/products', productRouter)

app.use('/api/orders', orderRouter)

app.use('/api/basket', basketRouter)

app.use((_req, res) => {
  res.redirect('/')
})

app.use(errorHandler)

export default app