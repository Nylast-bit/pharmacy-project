import { supabase } from '../config/supabaseClient'
import { Database } from '../types/database.types'
import { AppError } from '../middlewares/errorHandler'
import { StorageService } from './storage.service'

type Product = Database['public']['Tables']['productos']['Row']
type ProductInsert = Database['public']['Tables']['productos']['Insert']
type ProductUpdate = Database['public']['Tables']['productos']['Update']

export class ProductService {
  private storageService = new StorageService()

  async create(productData: ProductInsert): Promise<Product> {
    const { data, error } = await (supabase
      .from('productos') as any)
      .insert(productData)
      .select()
      .single()
    
    if (error) throw new AppError(error.message, 400)
    return data
  }

  async createWithImage(
    productData: Omit<ProductInsert, 'imagen_url'>,
    imageFile?: Express.Multer.File
  ): Promise<Product> {
    let imagen_url: string | undefined

    // Upload image if provided
    if (imageFile) {
      imagen_url = await this.storageService.uploadImage(
        imageFile.buffer,
        imageFile.originalname,
        imageFile.mimetype
      )
    }

    return this.create({ ...productData, imagen_url })
  }

  async findAll(filters?: {
    search?: string
    minPrice?: number
    maxPrice?: number
    inStock?: boolean
  }): Promise<Product[]> {
    let query = supabase.from('productos').select('*')
    
    if (filters?.search) {
      query = query.ilike('nombre', `%${filters.search}%`)
    }
    
    if (filters?.minPrice !== undefined) {
      query = query.gte('precio', filters.minPrice)
    }
    
    if (filters?.maxPrice !== undefined) {
      query = query.lte('precio', filters.maxPrice)
    }
    
    if (filters?.inStock) {
      query = query.gt('stock', 0)
    }
    
    const { data, error } = await query.order('fecha_creacion', { ascending: false })
    
    if (error) throw new AppError(error.message, 500)
    return data || []
  }

  async findById(id: number): Promise<Product> {
    const { data, error } = await supabase
      .from('productos')
      .select('*')
      .eq('id_producto', id)
      .single()
    
    if (error || !data) {
      throw new AppError('Product not found', 404)
    }
    
    return data
  }

  async update(id: number, productData: ProductUpdate): Promise<Product> {
    const { data, error } = await (supabase
      .from('productos') as any)
      .update(productData)
      .eq('id_producto', id)
      .select()
      .single()
    
    if (error) throw new AppError(error.message, 400)
    return data
  }

  async updateWithImage(
    id: number,
    productData: Omit<ProductUpdate, 'imagen_url'>,
    imageFile?: Express.Multer.File
  ): Promise<Product> {
    let imagen_url: string | undefined

    // If new image is provided, upload it and delete old one
    if (imageFile) {
      const currentProduct = await this.findById(id)
      imagen_url = await this.storageService.updateImage(
        currentProduct.imagen_url,
        imageFile.buffer,
        imageFile.originalname,
        imageFile.mimetype
      )
    }

    return this.update(id, { ...productData, ...(imagen_url && { imagen_url }) })
  }

  async delete(id: number): Promise<void> {
    // Get product to delete image
    const product = await this.findById(id)

    // Check if product has associated orders
    const { data: details } = await supabase
      .from('detalle_pedido')
      .select('id_detalle')
      .eq('id_producto', id)
      .limit(1)
    
    if (details && details.length > 0) {
      throw new AppError(
        'Cannot delete product because it has associated orders',
        400
      )
    }

    // Delete image if exists
    if (product.imagen_url) {
      try {
        await this.storageService.deleteImage(product.imagen_url)
      } catch (error) {
        console.error('Error deleting image:', error)
      }
    }
    
    const { error } = await supabase
      .from('productos')
      .delete()
      .eq('id_producto', id)
    
    if (error) throw new AppError(error.message, 400)
  }

  async updateStock(id: number, quantity: number): Promise<Product> {
    const product = await this.findById(id)
    const newStock = (product as any).stock + quantity
    
    if (newStock < 0) {
      throw new AppError('Insufficient stock', 400)
    }
    
    return this.update(id, { stock: newStock })
  }

  async findLowStock(threshold: number = 10): Promise<Product[]> {
    const { data, error } = await supabase
      .from('productos')
      .select('*')
      .lte('stock', threshold)
      .order('stock', { ascending: true })
    
    if (error) throw new AppError(error.message, 500)
    return data || []
  }
}