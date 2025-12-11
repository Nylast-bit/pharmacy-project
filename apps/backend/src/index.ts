import dotenv from 'dotenv'
dotenv.config() 

import express from 'express'
import cors from 'cors'
import productRoutes from './routes/product.routes'
import customerRoutes from './routes/customer.routes'
import orderRoutes from './routes/order.routes'
import orderDetailRoutes from './routes/orderDetail.routes'
import emailRoutes from './routes/email.routes';
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
app.use('/api/email', emailRoutes)

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

// === CAMBIO CRÍTICO: Asegurar que PORT es de tipo 'number' ===
const PORT_NUMBER = Number(process.env.PORT) || 4000

app.listen(PORT_NUMBER, "0.0.0.0", () => {
  console.log(`✅ Backend running on http://0.0.0.0:${PORT_NUMBER}`)
})