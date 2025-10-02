export interface Database {
  public: {
    Tables: {
      clientes: {
        Row: {
          id_cliente: number
          nombre: string
          correo: string
          telefono: string | null
          direccion: string | null
          fecha_creacion: string | null
        }
        Insert: {
          nombre: string
          correo: string
          telefono?: string | null
          direccion?: string | null
        }
        Update: {
          nombre?: string
          correo?: string
          telefono?: string | null
          direccion?: string | null
        }
      }
      productos: {
        Row: {
          id_producto: number
          nombre: string
          descripcion: string | null
          precio: number
          stock: number
          imagen_url: string | null
          fecha_creacion: string | null
        }
        Insert: {
          nombre: string
          descripcion?: string | null
          precio: number
          stock: number
          imagen_url?: string | null
        }
        Update: {
          nombre?: string
          descripcion?: string | null
          precio?: number
          stock?: number
          imagen_url?: string | null
        }
      }
      pedidos: {
        Row: {
          id_pedido: number
          id_cliente: number
          fecha_pedido: string | null
          estatus: string
          total: number | null
          notificado: boolean
        }
        Insert: {
          id_cliente: number
          total?: number
          estatus?: string
          notificado?: boolean
        }
        Update: {
          id_cliente?: number
          total?: number
          estatus?: string
          notificado?: boolean
        }
      }
      detalle_pedido: {
        Row: {
          id_detalle: number
          id_pedido: number
          id_producto: number
          cantidad: number
          precio_unitario: number
        }
        Insert: {
          id_pedido: number
          id_producto: number
          cantidad: number
          precio_unitario: number
        }
        Update: {
          cantidad?: number
          precio_unitario?: number
        }
      }
    }
    Views: {}
    Functions: {}
  }
}
