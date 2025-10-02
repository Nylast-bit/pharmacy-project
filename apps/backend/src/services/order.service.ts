import { supabase } from '../config/supabaseClient'
import { Database } from '../types/database.types'
import { AppError } from '../middlewares/errorHandler'

type Order = Database['public']['Tables']['pedidos']['Row']
type OrderInsert = Database['public']['Tables']['pedidos']['Insert']
type OrderUpdate = Database['public']['Tables']['pedidos']['Update']

export class OrderService {
  async create(orderData: OrderInsert): Promise<Order> {
    const { data, error } = await (supabase
      .from('pedidos') as any)
      .insert(orderData)
      .select()
      .single()
    
    if (error) throw new AppError(error.message, 400)
    return data
  }

  async findAll(filters?: {
    id_cliente?: number
    estatus?: string
    desde?: string
    hasta?: string
  }): Promise<Order[]> {
    let query = supabase.from('pedidos').select('*')
    
    if (filters?.id_cliente) {
      query = query.eq('id_cliente', filters.id_cliente)
    }
    
    if (filters?.estatus) {
      query = query.eq('estatus', filters.estatus)
    }
    
    if (filters?.desde) {
      query = query.gte('fecha_pedido', filters.desde)
    }
    
    if (filters?.hasta) {
      query = query.lte('fecha_pedido', filters.hasta)
    }
    
    const { data, error } = await query.order('fecha_pedido', { ascending: false })
    
    if (error) throw new AppError(error.message, 500)
    return data || []
  }

  async findById(id: number): Promise<Order> {
    const { data, error } = await supabase
      .from('pedidos')
      .select('*')
      .eq('id_pedido', id)
      .single()
    
    if (error || !data) {
      throw new AppError('Order not found', 404)
    }
    
    return data
  }

  async findWithDetails(id: number): Promise<any> {
    const { data, error } = await supabase
      .from('pedidos')
      .select(`
        *,
        clientes (
          id_cliente,
          nombre,
          correo,
          telefono,
          direccion
        ),
        detalle_pedido (
          id_detalle,
          cantidad,
          precio_unitario,
          productos (
            id_producto,
            nombre,
            descripcion,
            imagen_url
          )
        )
      `)
      .eq('id_pedido', id)
      .single()
    
    if (error || !data) {
      throw new AppError('Order not found', 404)
    }
    
    return data
  }

  async update(id: number, orderData: OrderUpdate): Promise<Order> {
    const { data, error } = await (supabase
      .from('pedidos') as any)
      .update(orderData)
      .eq('id_pedido', id)
      .select()
      .single()
    
    if (error) throw new AppError(error.message, 400)
    return data
  }

  async updateStatus(id: number, estatus: string): Promise<Order> {
    const validStatuses = ['pendiente', 'procesando', 'enviado', 'entregado', 'cancelado']
    
    if (!validStatuses.includes(estatus)) {
      throw new AppError('Invalid status', 400)
    }
    
    return this.update(id, { estatus })
  }

  async markAsNotified(id: number): Promise<Order> {
    return this.update(id, { notificado: true })
  }

  async delete(id: number): Promise<void> {
    // First delete order details
    const { error: detailsError } = await supabase
      .from('detalle_pedido')
      .delete()
      .eq('id_pedido', id)
    
    if (detailsError) throw new AppError(detailsError.message, 400)
    
    // Then delete the order
    const { error } = await supabase
      .from('pedidos')
      .delete()
      .eq('id_pedido', id)
    
    if (error) throw new AppError(error.message, 400)
  }

  async getPendingOrders(): Promise<Order[]> {
    const { data, error } = await supabase
      .from('pedidos')
      .select('*')
      .eq('estatus', 'pendiente')
      .order('fecha_pedido', { ascending: true })
    
    if (error) throw new AppError(error.message, 500)
    return data || []
  }

  async getUnnotifiedOrders(): Promise<Order[]> {
    const { data, error } = await supabase
      .from('pedidos')
      .select('*')
      .eq('notificado', false)
      .order('fecha_pedido', { ascending: true })
    
    if (error) throw new AppError(error.message, 500)
    return data || []
  }
}