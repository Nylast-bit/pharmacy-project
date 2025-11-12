import { Pool, types } from 'pg'
import dotenv from 'dotenv'

types.setTypeParser(1700, (val) => parseFloat(val))
// Carga las variables de entorno del archivo .env
dotenv.config()

// Crea el pool de conexiones
const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  
  // Opcional: configuraciones adicionales del pool
  // max: 20, // max número de clientes en el pool
  // idleTimeoutMillis: 30000, // cuánto tiempo un cliente puede estar inactivo
})

// Exportamos el pool para usarlo en nuestros servicios
export default pool
