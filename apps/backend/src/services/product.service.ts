// ANTES:
// import { supabase } from '../config/supabaseClient'

// DESPUÉS:
import pool from '../config/db' // <-- ¡Importamos nuestro pool!

import { Database } from '../types/database.types'
import { AppError } from '../middlewares/errorHandler'
import { StorageService } from './storage.service' // <-- AÚN SE USA, PERO DEBE SER REFCTORIZADO

type Product = Database['public']['Tables']['productos']['Row']
type ProductInsert = Database['public']['Tables']['productos']['Insert']
type ProductUpdate = Database['public']['Tables']['productos']['Update']

export class ProductService {
  // Esta línea no cambia, pero 'StorageService' debe ser actualizado
  // para que no use Supabase Storage.
  private storageService = new StorageService()

  async create(productData: ProductInsert): Promise<Product> {
    
    const { nombre, descripcion, precio, stock, imagen_url } = productData
    const query = `
      INSERT INTO productos (nombre, descripcion, precio, stock, imagen_url)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `
    const params = [nombre, descripcion, precio, stock, imagen_url]

    try {
      const { rows } = await pool.query(query, params)
      return rows[0] as Product
    } catch (error: any) {
      throw new AppError(error.message, 400)
    }
  }

  
  async createWithImage(
    productData: Omit<ProductInsert, 'imagen_url'>,
    imageFile?: Express.Multer.File
  ): Promise<Product> {
    let imagen_url: string | undefined

    if (imageFile) {
      // ¡ADVERTENCIA! Esto fallará si 'storageService' no se actualiza.
      imagen_url = await this.storageService.uploadImage(
        imageFile.buffer,
        imageFile.originalname,
        imageFile.mimetype
      )
    }

    // Llama a nuestro 'create' refactorizado.
    return this.create({ ...productData, imagen_url })
  }

  async findAll(filters?: {
    search?: string
    minPrice?: number
    maxPrice?: number
    inStock?: boolean
  }): Promise<Product[]> {

    // DESPUÉS:
    let baseQuery = 'SELECT * FROM productos'
    const clauses: string[] = []
    const params: any[] = []
    let paramIndex = 1

    if (filters?.search) {
      clauses.push(`nombre ILIKE $${paramIndex++}`)
      params.push(`%${filters.search}%`)
    }
    
    if (filters?.minPrice !== undefined) {
      clauses.push(`precio >= $${paramIndex++}`)
      params.push(filters.minPrice)
    }
    
    if (filters?.maxPrice !== undefined) {
      clauses.push(`precio <= $${paramIndex++}`)
      params.push(filters.maxPrice)
    }
    
    if (filters?.inStock) {
      clauses.push(`stock > $${paramIndex++}`)
      params.push(0) // El valor 0 para 'stock > 0'
    }

    if (clauses.length > 0) {
      baseQuery += ' WHERE ' + clauses.join(' AND ')
    }
    
    baseQuery += ' ORDER BY fecha_creacion DESC'
    
    try {
      const { rows } = await pool.query(baseQuery, params)
      return (rows || []) as Product[]
    } catch (error: any) {
      throw new AppError(error.message, 500)
    }
  }

  async findById(id: number): Promise<Product> {
  
    const query = 'SELECT * FROM productos WHERE id_producto = $1'
    const { rows } = await pool.query(query, [id])
    
    if (rows.length === 0) {
      throw new AppError('Product not found', 404)
    }
    
    return rows[0] as Product
  }

  async update(id: number, productData: ProductUpdate): Promise<Product> {
    
    // (Lógica de actualización dinámica, igual que en customer.service)
    const fields = Object.keys(productData).filter(key => (productData as any)[key] !== undefined);
    const values = fields.map(field => (productData as any)[field]);

    if (fields.length === 0) {
      throw new AppError('No fields to update', 400);
    }

    const setClause = fields
      .map((field, index) => `"${field}" = $${index + 1}`)
      .join(', ');

    const idParamIndex = fields.length + 1;
    const query = `
      UPDATE productos
      SET ${setClause}
      WHERE id_producto = $${idParamIndex}
      RETURNING *;
    `
    const queryParams = [...values, id];

    try {
      const { rows } = await pool.query(query, queryParams);
      if (rows.length === 0) {
        throw new AppError('Product not found', 404);
      }
      return rows[0] as Product;
    } catch (error: any) {
      throw new AppError(error.message, 400);
    }
  }

  // Este método llama a `this.findById`, `storageService.updateImage` y `this.update`.
  // Funcionará correctamente una vez que esos métodos estén refactorizados.
  async updateWithImage(
    id: number,
    productData: Omit<ProductUpdate, 'imagen_url'>,
    imageFile?: Express.Multer.File
  ): Promise<Product> {
    let imagen_url: string | undefined

    if (imageFile) {
      // Llama a nuestro 'findById' refactorizado.
      const currentProduct = await this.findById(id)
      
      // ¡ADVERTENCIA! Esto fallará si 'storageService' no se actualiza.
      imagen_url = await this.storageService.updateImage(
        currentProduct.imagen_url,
        imageFile.buffer,
        imageFile.originalname,
        imageFile.mimetype
      )
    }

    // Llama a nuestro 'update' refactorizado.
    return this.update(id, { ...productData, ...(imagen_url && { imagen_url }) })
  }

  async delete(id: number): Promise<void> {
    // Llama a nuestro 'findById' refactorizado.
    const product = await this.findById(id)


    // DESPUÉS (Paso 1: Chequear pedidos asociados)
    const checkQuery = 'SELECT id_detalle FROM detalle_pedido WHERE id_producto = $1 LIMIT 1'
    const { rows } = await pool.query(checkQuery, [id])
    
    if (rows.length > 0) {
      throw new AppError(
        'Cannot delete product because it has associated orders',
        400
      )
    }

    // ¡ADVERTENCIA! Esto fallará si 'storageService' no se actualiza.
    if (product.imagen_url) {
      try {
        await this.storageService.deleteImage(product.imagen_url)
      } catch (error) {
        console.error('Error deleting image:', error)
      }
    }
    

    // DESPUÉS (Paso 2: Borrar producto de la BD)
    const deleteQuery = 'DELETE FROM productos WHERE id_producto = $1'
    try {
      await pool.query(deleteQuery, [id])
    } catch (error: any) {
      throw new AppError(error.message, 400)
    }
  }

  // Este método solo llama a `this.findById` y `this.update`,
  // que ya están refactorizados. ¡Funcionará sin cambios!
  async updateStock(id: number, quantity: number): Promise<Product> {
    const product = await this.findById(id)
    const newStock = (product as any).stock + quantity
    
    if (newStock < 0) {
      throw new AppError('Insufficient stock', 400)
    }
    
    return this.update(id, { stock: newStock })
  }
}