import { Request, Response, NextFunction } from 'express'
import { OrderService } from '../services/order.service'

const orderService = new OrderService()

export class OrderController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      // 👇 Se extrae 'trackingnumber' del cuerpo de la petición
      const { id_cliente, total, estatus, notificado, trackingnumber } = req.body 
        
      if (!id_cliente) {
        return res.status(400).json({
          error: 'Field id_cliente is required'
        })
      }
      
      // 👇 Se pasa 'trackingnumber' al servicio para que lo guarde
      const order = await orderService.create({
        id_cliente,
        total,
        estatus,
        notificado,
        trackingnumber 
      })
      
      res.status(201).json(order)
    } catch (error) {
      next(error)
    }
  }

  // ... findAll, findById, findWithDetails no necesitan cambios ...
  async findAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { id_cliente, estatus, desde, hasta } = req.query
      
      const filters = {
        id_cliente: id_cliente ? Number(id_cliente) : undefined,
        estatus: estatus as string,
        desde: desde as string,
        hasta: hasta as string
      }
      
      const orders = await orderService.findAll(filters)
      res.json(orders)
    } catch (error) {
      next(error)
    }
  }

  async findById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params
      const order = await orderService.findById(Number(id))
      res.json(order)
    } catch (error) {
      next(error)
    }
  }

  async findWithDetails(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params
      const order = await orderService.findWithDetails(Number(id))
      res.json(order)
    } catch (error) {
      next(error)
    }
  }
  // ---

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params
      // 👇 Se extrae 'trackingnumber' del cuerpo de la petición
      const { id_cliente, total, estatus, notificado, trackingnumber } = req.body 
      
      const updateData: any = {}
      if (id_cliente !== undefined) updateData.id_cliente = id_cliente
      if (total !== undefined) updateData.total = total
      if (estatus !== undefined) updateData.estatus = estatus
      if (notificado !== undefined) updateData.notificado = notificado

      // 👇 Se añade 'trackingnumber' al objeto de actualización solo si se proporciona
      if (trackingnumber !== undefined) updateData.trackingnumber = trackingnumber 
      
      const order = await orderService.update(Number(id), updateData)
      res.json(order)
    } catch (error) {
      next(error)
    }
  }

  // ... El resto de métodos no necesitan cambios ...
  async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params
      const { estatus } = req.body
      
      if (!estatus) {
        return res.status(400).json({
          error: 'Field estatus is required'
        })
      }
      
      const order = await orderService.updateStatus(Number(id), estatus)
      res.json(order)
    } catch (error) {
      next(error)
    }
  }

  async markAsNotified(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params
      const order = await orderService.markAsNotified(Number(id))
      res.json(order)
    } catch (error) {
      next(error)
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params
      await orderService.delete(Number(id))
      res.status(204).send()
    } catch (error) {
      next(error)
    }
  }

  async getPending(req: Request, res: Response, next: NextFunction) {
    try {
      const orders = await orderService.getPendingOrders()
      res.json(orders)
    } catch (error) {
      next(error)
    }
  }

  async getUnnotified(req: Request, res: Response, next: NextFunction) {
    try {
      const orders = await orderService.getUnnotifiedOrders()
      res.json(orders)
    } catch (error) {
      next(error)
    }
  }
}