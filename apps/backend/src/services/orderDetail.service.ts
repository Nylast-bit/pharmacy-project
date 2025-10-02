import { supabase } from '../config/supabaseClient'
import { Database } from '../types/database.types'
import { AppError } from '../middlewares/errorHandler'

type OrderDetail = Database['public']['Tables']['detalle_pedido']['Row']
type OrderDetailInsert = Database['public']['Tables']['detalle_pedido']['Insert']
type OrderDetailUpdate = Database['public']['Tables']['detalle_pedido']['Update']

export class OrderDetailService {
  async create(detailData: OrderDetailInsert): Promise<OrderDetail> {
    const { data, error } = await (supabase
      .from('detalle_pedido') as any)
      .insert(detailData)
      .select()
      .single()
    
    if (error) throw new AppError(error.message, 400)
    return data
  }

  async createMultiple(details: OrderDetailInsert[]): Promise<OrderDetail[]> {
    const { data, error } = await (supabase
      .from('detalle_pedido') as any)
      .insert(details)
      .select()
    
    if (error) throw new AppError(error.message, 400)
    return data
  }

  async findAll(): Promise<OrderDetail[]> {
    const { data, error } = await supabase
      .from('detalle_pedido')
      .select('*')
    
    if (error) throw new AppError(error.message, 500)
    return data || []
  }

  async findById(id: number): Promise<OrderDetail> {
    const { data, error } = await supabase
      .from('detalle_pedido')
      .select('*')
      .eq('id_detalle', id)
      .single()
    
    if (error || !data) {
      throw new AppError('Order detail not found', 404)
    }
    
    return data
  }

  async findByOrderId(id_pedido: number): Promise<any[]> {
    const { data, error } = await supabase
      .from('detalle_pedido')
      .select(`
        *,
        productos (
          id_producto,
          nombre,
          descripcion,
          precio,
          imagen_url
        )
      `)
      .eq('id_pedido', id_pedido)
    
    if (error) throw new AppError(error.message, 500)
    return data || []
  }

  async findByProductId(id_producto: number): Promise<OrderDetail[]> {
    const { data, error } = await supabase
      .from('detalle_pedido')
      .select('*')
      .eq('id_producto', id_producto)
    
    if (error) throw new AppError(error.message, 500)
    return data || []
  }

  async update(id: number, detailData: OrderDetailUpdate): Promise<OrderDetail> {
    const { data, error } = await (supabase
      .from('detalle_pedido') as any)
      .update(detailData)
      .eq('id_detalle', id)
      .select()
      .single()
    
    if (error) throw new AppError(error.message, 400)
    return data
  }

  async delete(id: number): Promise<void> {
    const { error } = await supabase
      .from('detalle_pedido')
      .delete()
      .eq('id_detalle', id)
    
    if (error) throw new AppError(error.message, 400)
  }

  async deleteByOrderId(id_pedido: number): Promise<void> {
    const { error } = await supabase
      .from('detalle_pedido')
      .delete()
      .eq('id_pedido', id_pedido)
    
    if (error) throw new AppError(error.message, 400)
  }

  async calculateOrderTotal(id_pedido: number): Promise<number> {
    const details = await this.findByOrderId(id_pedido)
    
    const total = details.reduce((sum, detail) => {
      return sum + (detail.cantidad * detail.precio_unitario)
    }, 0)
    
    return total
  }

  async updateOrderTotal(id_pedido: number): Promise<void> {
    const total = await this.calculateOrderTotal(id_pedido)
    
    const { error } = await (supabase
      .from('pedidos') as any)
      .update({ total })
      .eq('id_pedido', id_pedido)
    
    if (error) throw new AppError(error.message, 400)
  }
}