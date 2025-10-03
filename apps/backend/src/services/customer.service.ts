import { supabase } from '../config/supabaseClient'
import { Database } from '../types/database.types'
import { AppError } from '../middlewares/errorHandler'

type Customer = Database['public']['Tables']['clientes']['Row']
type CustomerInsert = Database['public']['Tables']['clientes']['Insert']
type CustomerUpdate = Database['public']['Tables']['clientes']['Update']

export class CustomerService {
  async create(customerData: CustomerInsert): Promise<Customer> {
    const { data, error } = await (supabase
      .from('clientes') as any)
      .insert(customerData)
      .select()
      .single()
    
    if (error) throw new AppError(error.message, 400)
    return data
  }

  async findAll(filters?: {
    search?: string
  }): Promise<Customer[]> {
    let query = supabase.from('clientes').select('*')
    
    if (filters?.search) {
      query = query.or(`nombre.ilike.%${filters.search}%,correo.ilike.%${filters.search}%`)
    }
    
    const { data, error } = await query.order('fecha_creacion', { ascending: false })
    
    if (error) throw new AppError(error.message, 500)
    return data || []
  }

  async findById(id: number): Promise<Customer> {
    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .eq('id_cliente', id)
      .single()
    
    if (error || !data) {
      throw new AppError('Customer not found', 404)
    }
    
    return data
  }

  async findByEmail(correo: string): Promise<Customer | null> {
    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .eq('correo', correo)
      .single()

    if (error || !data) return null
    return data as Customer
  }

  async findByPhone(telefono: string): Promise<Customer | null> {
    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .eq('telefono', telefono)
      .single()

    if (error || !data) return null
    return data as Customer
  }

  async update(id: number, customerData: CustomerUpdate): Promise<Customer> {
    const { data, error } = await (supabase
      .from('clientes') as any)
      .update(customerData)
      .eq('id_cliente', id)
      .select()
      .single()
    
    if (error) throw new AppError(error.message, 400)
    return data
  }

  async delete(id: number): Promise<void> {
    // Check if customer has associated orders
    const { data: orders } = await supabase
      .from('pedidos')
      .select('id_pedido')
      .eq('id_cliente', id)
      .limit(1)
    
    if (orders && orders.length > 0) {
      throw new AppError(
        'Cannot delete customer because they have associated orders',
        400
      )
    }
    
    const { error } = await supabase
      .from('clientes')
      .delete()
      .eq('id_cliente', id)
    
    if (error) throw new AppError(error.message, 400)
  }

  async findWithOrders(id: number): Promise<any> {
    const { data, error } = await supabase
      .from('clientes')
      .select(`
        *,
        pedidos (
          id_pedido,
          fecha_pedido,
          estatus,
          total,
          notificado
        )
      `)
      .eq('id_cliente', id)
      .single()
    
    if (error || !data) {
      throw new AppError('Customer not found', 404)
    }
    
    return data
  }
}