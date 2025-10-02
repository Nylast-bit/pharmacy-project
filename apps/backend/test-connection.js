const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  try {
    await prisma.$connect()
    console.log('✅ Conexión exitosa a la base de datos')
    const productos = await prisma.$queryRaw`SELECT * FROM productos LIMIT 1`
    console.log('Productos:', productos)
  } catch (error) {
    console.error('❌ Error de conexión:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

main()