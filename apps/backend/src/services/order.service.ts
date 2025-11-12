// Importamos nuestro pool en lugar de supabase
import pool from '../config/db'
import { Database } from '../types/database.types'
import { AppError } from '../middlewares/errorHandler'

type OrderDetailInsert = Database['public']['Tables']['detalle_pedido']['Insert'];
type Order = Database['public']['Tables']['pedidos']['Row'];
type OrderInsert = Database['public']['Tables']['pedidos']['Insert'];
type OrderUpdate = Database['public']['Tables']['pedidos']['Update'];
const SHIPPING_FEE = 60;

export class OrderService {
  async createOrderWithDetails(
    orderData: Omit<OrderInsert, 'total' | 'estatus' | 'notificado'>, // Omitimos los campos que el backend debe controlar
    orderDetails: Omit<OrderDetailInsert, 'id_pedido'>[] // Un array de productos
  ): Promise<Order> {

    // 1. Conectarse a la base de datos
    const client = await pool.connect();

    try {
      // 2. INICIAR TRANSACCIÓN
      await client.query('BEGIN');

      // 3. Crear el Pedido principal
      // (Nota: Insertamos con total=0. Lo actualizaremos al final)
      const orderQuery = `
        INSERT INTO pedidos (id_cliente, total, estatus, notificado)
        VALUES ($1, 0, 'Pending', false)
        RETURNING *;
      `;
      const orderRes = await client.query(orderQuery, [orderData.id_cliente]);
      const newOrder = orderRes.rows[0] as Order;
      const newOrderId = newOrder.id_pedido;

      // 4. Insertar los PRODUCTOS
      if (orderDetails && orderDetails.length > 0) {
        // Prepara la consulta de inserción múltiple para los productos
        const values: any[] = [];
        const rows: string[] = [];
        let paramIndex = 1;

        for (const detail of orderDetails) {
          rows.push(`($${paramIndex++}, $${paramIndex++}, $${paramIndex++}, $${paramIndex++})`);
          values.push(newOrderId, detail.id_producto, detail.cantidad, detail.precio_unitario);
        }
        
        const detailQuery = `
          INSERT INTO detalle_pedido (id_pedido, id_producto, cantidad, precio_unitario)
          VALUES ${rows.join(', ')}
        `;
        await client.query(detailQuery, values);
      }

      // 5. ¡AÑADIR EL ENVÍO COMO UN OBJETO/FILA!
      // Solo si el carrito no estaba vacío
      if (orderDetails && orderDetails.length > 0) {
        const shippingQuery = `
          INSERT INTO detalle_pedido (id_pedido, id_producto, cantidad, precio_unitario)
          VALUES ($1, NULL, 1, $2);
        `;
        // id_producto es NULL para identificarlo como el envío
        await client.query(shippingQuery, [newOrderId, SHIPPING_FEE]);
      }

      // 6. CALCULAR EL TOTAL FINAL Y ACTUALIZAR EL PEDIDO
      // Esta consulta suma TODO (productos + envío) en detalle_pedido
      const totalQuery = `
        UPDATE pedidos
        SET total = (
          SELECT SUM(cantidad * precio_unitario) 
          FROM detalle_pedido 
          WHERE id_pedido = $1
        )
        WHERE id_pedido = $1
        RETURNING total;
      `;
      const totalRes = await client.query(totalQuery, [newOrderId]);
      newOrder.total = totalRes.rows[0].total;

      // 7. FINALIZAR TRANSACCIÓN
      await client.query('COMMIT');

      // 8. Devolver el pedido completo y correcto
      return newOrder;

    } catch (error: any) {
      // 9. Si algo falla, deshacer todo
      await client.query('ROLLBACK');
      throw new AppError(error.message, 500);
    } finally {
      // 10. Liberar la conexión
      client.release();
    }
  }

  async findAll(filters?: {
    id_cliente?: number
    estatus?: string
    desde?: string
    hasta?: string
  }): Promise<Order[]> {
    let baseQuery = 'SELECT * FROM pedidos'
    const clauses: string[] = []
    const params: any[] = []
    let paramIndex = 1

    if (filters?.id_cliente) {
      clauses.push(`id_cliente = $${paramIndex++}`)
      params.push(filters.id_cliente)
    }
    
    if (filters?.estatus) {
      clauses.push(`estatus = $${paramIndex++}`)
      params.push(filters.estatus)
    }
    
    if (filters?.desde) {
      clauses.push(`fecha_pedido >= $${paramIndex++}`)
      params.push(filters.desde)
    }
    
    if (filters?.hasta) {
      clauses.push(`fecha_pedido <= $${paramIndex++}`)
      params.push(filters.hasta)
    }

    if (clauses.length > 0) {
      baseQuery += ' WHERE ' + clauses.join(' AND ')
    }
    
    baseQuery += ' ORDER BY fecha_pedido DESC'
    
    try {
      const { rows } = await pool.query(baseQuery, params)
      return (rows || []) as Order[]
    } catch (error: any) {
      throw new AppError(error.message, 500)
    }
  }

  async findById(id: number): Promise<Order> {
    const query = 'SELECT * FROM pedidos WHERE id_pedido = $1'
    
    const { rows } = await pool.query(query, [id])
    
    if (rows.length === 0) {
      throw new AppError('Order not found', 404)
    }
    
    return rows[0] as Order
  }

  async findWithDetails(id: number): Promise<any> {
    // Esta consulta usa funciones JSON de PostgreSQL para anidar
    // los resultados de 'clientes', 'detalle_pedido' y 'productos'.
    const query = `
      SELECT 
        p.*,
        -- Cliente (Objeto único)
        (
          SELECT json_build_object(
            'id_cliente', c.id_cliente,
            'nombre', c.nombre,
            'correo', c.correo,
            'telefono', c.telefono,
            'direccion', c.direccion
          )
          FROM clientes c 
          WHERE c.id_cliente = p.id_cliente
        ) AS clientes,
        
        -- Detalle Pedido (Array de objetos)
        (
          SELECT COALESCE(json_agg(
            json_build_object(
              'id_detalle', dp.id_detalle,
              'cantidad', dp.cantidad,
              'precio_unitario', dp.precio_unitario,
              -- Productos (Objeto anidado dentro de detalle)
              'productos', (
                SELECT json_build_object(
                  'id_producto', pr.id_producto,
                  'nombre', pr.nombre,
                  'descripcion', pr.descripcion,
                  'imagen_url', pr.imagen_url
                )
                FROM productos pr
                WHERE pr.id_producto = dp.id_producto
              )
            )
          ), '[]'::json)
          FROM detalle_pedido dp
          WHERE dp.id_pedido = p.id_pedido
        ) AS detalle_pedido
      FROM 
        pedidos p
      WHERE 
        p.id_pedido = $1;
    `
    
    const { rows } = await pool.query(query, [id])

    if (rows.length === 0) {
      throw new AppError('Order not found', 404)
    }
    
    // El resultado (rows[0]) ya viene con el formato anidado deseado
    return rows[0]
  }

  async update(id: number, orderData: OrderUpdate): Promise<Order> {
    // Lógica de actualización dinámica (igual que en los otros servicios)
    const fields = Object.keys(orderData).filter(key => (orderData as any)[key] !== undefined);
    const values = fields.map(field => (orderData as any)[field]);

    if (fields.length === 0) {
      throw new AppError('No fields to update', 400);
    }

    const setClause = fields
      .map((field, index) => `"${field}" = $${index + 1}`)
      .join(', ');

    const idParamIndex = fields.length + 1;
    const query = `
      UPDATE pedidos
      SET ${setClause}
      WHERE id_pedido = $${idParamIndex}
      RETURNING *;
    `
    const queryParams = [...values, id];

    try {
      const { rows } = await pool.query(query, queryParams);
      if (rows.length === 0) {
        throw new AppError('Order not found', 404);
      }
      return rows[0] as Order;
    } catch (error: any) {
      throw new AppError(error.message, 400);
    }
  }

  // --- MÉTODOS SIN CAMBIOS ---
  // Estos métodos funcionan tal cual porque solo llaman
  // a 'this.update()', que ya está refactorizado.

  async updateStatus(id: number, estatus: string): Promise<Order> {
    const validStatuses = ['pendiente', 'procesando', 'enviado', 'entregado', 'cancelado']
    
    if (!validStatuses.includes(estatus.toLowerCase())) {
      throw new AppError('Invalid status', 400)
    }
    
    return this.update(id, { estatus })
  }

  async markAsNotified(id: number): Promise<Order> {
    return this.update(id, { notificado: true })
  }
  
  // --- FIN MÉTODOS SIN CAMBIOS ---

  async delete(id: number): Promise<void> {
    // Gracias al 'ON DELETE CASCADE' que definimos en el schema.sql,
    // solo necesitamos borrar el pedido principal.
    // La base de datos borrará automáticamente los 'detalle_pedido' asociados.
    
    const query = 'DELETE FROM pedidos WHERE id_pedido = $1'
    
    try {
      await pool.query(query, [id])
    } catch (error: any) {
      throw new AppError(error.message, 400)
    }
  }

  async getPendingOrders(): Promise<Order[]> {
    const query = 'SELECT * FROM pedidos WHERE estatus = $1 ORDER BY fecha_pedido ASC'
    
    try {
      const { rows } = await pool.query(query, ['Pendiente']) // Asegúrate que coincida con tu enum/default
      return (rows || []) as Order[]
    } catch (error: any) {
      throw new AppError(error.message, 500)
    }
  }

  async getUnnotifiedOrders(): Promise<Order[]> {
    const query = 'SELECT * FROM pedidos WHERE notificado = false ORDER BY fecha_pedido ASC'
    
    try {
      const { rows } = await pool.query(query)
      return (rows || []) as Order[]
    } catch (error: any) {
      throw new AppError(error.message, 500)
    }
  }
}