import dotenv from 'dotenv'
dotenv.config() 

import express from 'express'
import cors from 'cors'
import productRoutes from './routes/product.routes'
import customerRoutes from './routes/customer.routes'
import orderRoutes from './routes/order.routes'
import orderDetailRoutes from './routes/orderDetail.routes'
import { errorHandler } from './middlewares/errorHandler'


const app = express()

// Middlewares
app.use(cors())
app.use(express.json())

// Routes
app.use('/api/products', productRoutes)
app.use('/api/customers', customerRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/order-details', orderDetailRoutes)

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() })
})

// Error handler
app.use(errorHandler)

// 404
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' })
})

const PORT = process.env.PORT || 4000

app.listen(PORT, () => {
  console.log(`✅ Backend running on http://localhost:${PORT}`)
})