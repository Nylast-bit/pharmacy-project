// Importamos nuestro pool en lugar de supabase
import pool from '../config/db'
import { Database } from '../types/database.types'
import { AppError } from '../middlewares/errorHandler'

type OrderDetail = Database['public']['Tables']['detalle_pedido']['Row']
type OrderDetailInsert = Database['public']['Tables']['detalle_pedido']['Insert']
type OrderDetailUpdate = Database['public']['Tables']['detalle_pedido']['Update']

export class OrderDetailService {
  async create(detailData: OrderDetailInsert): Promise<OrderDetail> {
    const { id_pedido, id_producto, cantidad, precio_unitario } = detailData
    
    const query = `
      INSERT INTO detalle_pedido (id_pedido, id_producto, cantidad, precio_unitario)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `
    const params = [id_pedido, id_producto, cantidad, precio_unitario]
    
    try {
      const { rows } = await pool.query(query, params)
      return rows[0] as OrderDetail
    } catch (error: any) {
      throw new AppError(error.message, 400)
    }
  }

  async createMultiple(details: OrderDetailInsert[]): Promise<OrderDetail[]> {
    if (!details || details.length === 0) {
      return []
    }

    const values: any[] = []
    const rows: string[] = []
    let paramIndex = 1

    // Construimos una consulta de inserción múltiple: 
    // INSERT ... VALUES ($1, $2, $3), ($4, $5, $6), ...
    for (const detail of details) {
      const { id_pedido, id_producto, cantidad, precio_unitario } = detail
      rows.push(`($${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++})`)
      values.push(id_pedido, id_producto, cantidad, precio_unitario)
    }
    
    const query = `
      INSERT INTO detalle_pedido (id_pedido, id_producto, cantidad, precio_unitario)
      VALUES ${rows.join(', ')}
      RETURNING *
    `
    
    try {
      const { rows: insertedRows } = await pool.query(query, values)
      return insertedRows as OrderDetail[]
    } catch (error: any) {
      throw new AppError(error.message, 400)
    }
  }

  async findAll(): Promise<OrderDetail[]> {
    const query = 'SELECT * FROM detalle_pedido'
    try {
      const { rows } = await pool.query(query)
      return (rows || []) as OrderDetail[]
    } catch (error: any) {
      throw new AppError(error.message, 500)
    }
  }

  async findById(id: number): Promise<OrderDetail> {
    const query = 'SELECT * FROM detalle_pedido WHERE id_detalle = $1'
    
    const { rows } = await pool.query(query, [id])
    
    if (rows.length === 0) {
      throw new AppError('Order detail not found', 404)
    }
    
    return rows[0] as OrderDetail
  }

  async findByOrderId(id_pedido: number): Promise<any[]> {
    // Replicamos la anidación de 'productos' usando una subconsulta JSON
    const query = `
      SELECT 
        dp.*,
        (
          SELECT json_build_object(
            'id_producto', p.id_producto,
            'nombre', p.nombre,
            'descripcion', p.descripcion,
            'precio', p.precio,
            'imagen_url', p.imagen_url
          )
          FROM productos p
          WHERE p.id_producto = dp.id_producto
        ) AS productos
      FROM 
        detalle_pedido dp
      WHERE 
        dp.id_pedido = $1;
    `
    
    try {
      const { rows } = await pool.query(query, [id_pedido])
      return (rows || [])
    } catch (error: any) {
      throw new AppError(error.message, 500)
    }
  }

  async findByProductId(id_producto: number): Promise<OrderDetail[]> {
    const query = 'SELECT * FROM detalle_pedido WHERE id_producto = $1'
    
    try {
      const { rows } = await pool.query(query, [id_producto])
      return (rows || []) as OrderDetail[]
    } catch (error: any) {
      throw new AppError(error.message, 500)
    }
  }

  async update(id: number, detailData: OrderDetailUpdate): Promise<OrderDetail> {
    // Lógica de actualización dinámica
    const fields = Object.keys(detailData).filter(key => (detailData as any)[key] !== undefined);
    const values = fields.map(field => (detailData as any)[field]);

    if (fields.length === 0) {
      throw new AppError('No fields to update', 400);
    }

    const setClause = fields
      .map((field, index) => `"${field}" = $${index + 1}`)
      .join(', ');

    const idParamIndex = fields.length + 1;
    const query = `
      UPDATE detalle_pedido
      SET ${setClause}
      WHERE id_detalle = $${idParamIndex}
      RETURNING *;
    `
    const queryParams = [...values, id];

    try {
      const { rows } = await pool.query(query, queryParams);
      if (rows.length === 0) {
        throw new AppError('Order detail not found', 404);
      }
      return rows[0] as OrderDetail;
    } catch (error: any) {
      throw new AppError(error.message, 400);
    }
  }

  async delete(id: number): Promise<void> {
    const query = 'DELETE FROM detalle_pedido WHERE id_detalle = $1'
    try {
      await pool.query(query, [id])
    } catch (error: any) {
      throw new AppError(error.message, 400)
    }
  }

  async deleteByOrderId(id_pedido: number): Promise<void> {
    const query = 'DELETE FROM detalle_pedido WHERE id_pedido = $1'
    try {
      await pool.query(query, [id_pedido])
    } catch (error: any) {
      throw new AppError(error.message, 400)
    }
  }

  // --- MÉTODOS CON CAMBIOS LÓGICOS MÍNIMOS ---
  // ¡SIN CAMBIOS! 
  // Este método consume 'this.findByOrderId()', que ya refactorizamos.
  // La lógica de 'reduce' sigue siendo válida.
  async calculateOrderTotal(id_pedido: number): Promise<number> {
    const details = await this.findByOrderId(id_pedido)
    
    const total = details.reduce((sum, detail) => {
      // Asumiendo que precio_unitario y cantidad están en el objeto 'detail'
      return sum + (detail.cantidad * detail.precio_unitario)
    }, 0)

    return total 
  }

  async updateOrderTotal(id_pedido: number): Promise<void> {
    // La primera línea no cambia
    const total = await this.calculateOrderTotal(id_pedido)
    
    // La segunda parte (actualización de Supabase) se cambia por pool.query
    const query = `
      UPDATE pedidos
      SET total = $1
      WHERE id_pedido = $2
    `
    try {
      await pool.query(query, [total, id_pedido])
    } catch (error: any) {
      throw new AppError(error.message, 400)
    }
  }
}