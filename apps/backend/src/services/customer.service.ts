// ANTES:
// import { supabase } from '../config/supabaseClient' 

// DESPUÉS:
import pool from '../config/db' // <-- ¡Importamos nuestro nuevo pool!

import { Database } from '../types/database.types'
import { AppError } from '../middlewares/errorHandler'

type Customer = Database['public']['Tables']['clientes']['Row']
type CustomerInsert = Database['public']['Tables']['clientes']['Insert']
type CustomerUpdate = Database['public']['Tables']['clientes']['Update']

export class CustomerService {

  // --- EJEMPLO 1: findById ---
  async findById(id: number): Promise<Customer> {
    
    const query = 'SELECT * FROM clientes WHERE id_cliente = $1'
    const { rows } = await pool.query(query, [id])
    
    // if (error || !data) { ... }
    if (rows.length === 0) {
      throw new AppError('Customer not found', 404)
    }
    
    return rows[0] as Customer
  }

  // --- EJEMPLO 2: create ---
  async create(customerData: CustomerInsert): Promise<Customer> {
   
    const { nombre, correo, telefono, direccion } = customerData
    const query = `
      INSERT INTO clientes (nombre, correo, telefono, direccion) 
      VALUES ($1, $2, $3, $4) 
      RETURNING *
    `
    const params = [nombre, correo, telefono, direccion]
    
    try {
      const { rows } = await pool.query(query, params)
      return rows[0] as Customer
    } catch (error: any) {
      // Manejamos errores comunes, como el 'unique constraint' del correo
      if (error.code === '23505') { // Código de PostgreSQL para 'unique_violation'
         throw new AppError('Email already registered', 400)
      }
      throw new AppError(error.message, 400)
    }
  }

  // --- EJEMPLO 3: findAll (con filtro) ---
  async findAll(filters?: { search?: string }): Promise<Customer[]> {
    
    let baseQuery = 'SELECT * FROM clientes'
    const params: any[] = []
    
    if (filters?.search) {
      params.push(`%${filters.search}%`) // El '%' es el wildcard de SQL
      // ILIKE es la versión 'case-insensitive' de LIKE en PostgreSQL
      baseQuery += ' WHERE nombre ILIKE $1 OR correo ILIKE $1'
    }
    
    baseQuery += ' ORDER BY fecha_creacion DESC'
    
    const { rows } = await pool.query(baseQuery, params)
    return (rows || []) as Customer[]
  }

  // --- EJEMPLO 4: delete (con chequeo) ---
  async delete(id: number): Promise<void> {
   
    const checkQuery = 'SELECT id_pedido FROM pedidos WHERE id_cliente = $1 LIMIT 1'
    const { rows } = await pool.query(checkQuery, [id])

    // if (orders && orders.length > 0) { ... }
    if (rows.length > 0) {
      throw new AppError(
        'Cannot delete customer because they have associated orders',
        400
      )
    }
    
   
    const deleteQuery = 'DELETE FROM clientes WHERE id_cliente = $1'
    await pool.query(deleteQuery, [id])
    // (Si pool.query da error, lanzará una excepción que el controlador atrapará)
  }

  async findWithOrders(id: number): Promise<any> {
    // Esta consulta usa una sub-consulta correlacionada para buscar
    // todos los pedidos, convertirlos en un objeto JSON con 'json_build_object',
    // agregarlos en un array JSON con 'json_agg',
    // y devolver '[]' (un array JSON vacío) si no hay pedidos.
    const query = `
      SELECT 
        c.*, 
        (
          SELECT COALESCE(json_agg(json_build_object(
            'id_pedido', p.id_pedido,
            'fecha_pedido', p.fecha_pedido,
            'estatus', p.estatus,
            'total', p.total,
            'notificado', p.notificado
          )), '[]'::json)
          FROM pedidos p
          WHERE p.id_cliente = c.id_cliente
        ) AS pedidos
      FROM 
        clientes c
      WHERE 
        c.id_cliente = $1;
    `
    
    const { rows } = await pool.query(query, [id])

    if (rows.length === 0) {
      throw new AppError('Customer not found', 404)
    }
    
    // El resultado (rows[0]) ya viene con el formato anidado:
    // { id_cliente: 1, nombre: '...', pedidos: [ { id_pedido: ... }, ... ] }
    return rows[0]
  }

  async resetAllNotified(): Promise<Customer[]> {
    const query = `
      UPDATE clientes
      SET fecha_ultima_promocion = NULL
      WHERE fecha_ultima_promocion IS NOT NULL
      RETURNING *;
    `
    
    try {
      const { rows } = await pool.query(query)
      return (rows || []) as Customer[]
    } catch (error: any) {
      throw new AppError(error.message, 400)
    }
  }

  async setPromotionSent(clientIds: number[]): Promise<Customer[]> {
    const now = new Date().toISOString() // Fecha y hora actual en UTC
    
    const query = `
      UPDATE clientes
      SET fecha_ultima_promocion = $1
      WHERE id_cliente = ANY($2::int[])
      RETURNING *;
    `
    
    try {
      // Pasamos 'now' como $1 y el array 'clientIds' como $2
      const { rows } = await pool.query(query, [now, clientIds])
      return (rows || []) as Customer[]
    } catch (error: any) {
      throw new AppError(error.message, 400)
    }
  }

  async findByEmail(correo: string): Promise<Customer | null> {
    const query = 'SELECT * FROM clientes WHERE correo = $1';
    
    try {
      const { rows } = await pool.query(query, [correo]);

      if (rows.length === 0) {
        return null; // No se encontró el cliente
      }

      return rows[0] as Customer;
    } catch (error: any) {
      throw new AppError(error.message, 500);
    }
  }

  async findByPhone(telefono: string): Promise<Customer | null> {
    // Esta consulta es casi idéntica a findByEmail
    const query = 'SELECT * FROM clientes WHERE telefono = $1';
    
    try {
      const { rows } = await pool.query(query, [telefono]);

      if (rows.length === 0) {
        return null; // No se encontró el cliente
      }

      return rows[0] as Customer;
    } catch (error: any) {
      throw new AppError(error.message, 500);
    }
  }

  async update(id: number, customerData: CustomerUpdate): Promise<Customer> {
    // Obtenemos un array de los campos a actualizar (ej. ['nombre', 'correo'])
    const fields = Object.keys(customerData);
    // Obtenemos un array de los valores (ej. ['Nuevo Nombre', 'nuevo@correo.com'])
    const values = Object.values(customerData);

    // Si no hay nada que actualizar, lanzamos un error o devolvemos el original
    if (fields.length === 0) {
      throw new AppError('No fields to update', 400);
    }

    // 1. Construimos la parte SET de la consulta dinámicamente
    // Esto crea: "nombre" = $1, "correo" = $2
    const setClause = fields
      .map((field, index) => `"${field}" = $${index + 1}`)
      .join(', ');

    // 2. El 'id' será el último parámetro
    const idParamIndex = fields.length + 1;

    // 3. Creamos la consulta final
    const query = `
      UPDATE clientes
      SET ${setClause}
      WHERE id_cliente = $${idParamIndex}
      RETURNING *;
    `;

    // 4. Combinamos los valores y el 'id' en un solo array de parámetros
    const queryParams = [...values, id];

    try {
      const { rows } = await pool.query(query, queryParams);

      if (rows.length === 0) {
        throw new AppError('Customer not found', 404);
      }

      return rows[0] as Customer;
    } catch (error: any) {
      // Manejamos el error de "email duplicado"
      if (error.code === '23505') { 
        throw new AppError('Email already registered', 400);
      }
      // Otro error
      throw new AppError(error.message, 400);
    }
  }

  async getLatestUnnotified(limit: number = 100): Promise<Customer[]> {
    

    // DESPUÉS (con PG):
    const query = `
      SELECT *
      FROM clientes
      ORDER BY fecha_ultima_promocion ASC NULLS FIRST
      LIMIT 100;

    `
    
    try {
      const { rows } = await pool.query(query, [limit])
      return (rows || []) as Customer[]
    } catch (error: any) {
      throw new AppError(error.message, 400)
    }
  }

  async getByIds(ids: number[]): Promise<Customer[]> {
    // 1. Si no se pasan IDs, devolvemos un array vacío
    //    para evitar una consulta innecesaria a la BD.
    if (!ids || ids.length === 0) {
      return [];
    }

    // 2. Usamos la sintaxis '= ANY($1::int[])'
    //    Es el equivalente de 'WHERE id IN (...)', pero
    //    permite pasar un solo array como parámetro seguro ($1).
    const query = `
      SELECT * FROM clientes
      WHERE id_cliente = ANY($1::int[]);
    `;
    
    try {
      // 3. Pasamos el array 'ids' completo como el primer parámetro.
      const { rows } = await pool.query(query, [ids]);
      
      // 4. Devolvemos las filas encontradas, o un array vacío si no hay coincidencias.
      //    Esto es importante para que tu controlador pueda hacer
      //    su propia validación de 'clientsToNotify.length === 0'.
      return (rows || []) as Customer[];
    } catch (error: any) {
      // Capturamos cualquier error de la base de datos (ej. sintaxis)
      throw new AppError(error.message, 400);
    }
  }
}