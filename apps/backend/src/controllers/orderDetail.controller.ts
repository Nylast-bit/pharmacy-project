import { Request, Response, NextFunction } from 'express'
import { OrderDetailService } from '../services/orderDetail.service'

const orderDetailService = new OrderDetailService()

export class OrderDetailController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const { id_pedido, id_producto, cantidad, precio_unitario } = req.body
      
      if (!id_pedido || !id_producto || !cantidad || !precio_unitario) {
        return res.status(400).json({
          error: 'Fields id_pedido, id_producto, cantidad and precio_unitario are required'
        })
      }
      
      const detail = await orderDetailService.create({
        id_pedido,
        id_producto,
        cantidad,
        precio_unitario
      })

      // Update order total
      await orderDetailService.updateOrderTotal(id_pedido)
      
      res.status(201).json(detail)
    } catch (error) {
      next(error)
    }
  }

  async createMultiple(req: Request, res: Response, next: NextFunction) {
    try {
      const { id_pedido, details } = req.body
      
      if (!id_pedido || !details || !Array.isArray(details)) {
        return res.status(400).json({
          error: 'Fields id_pedido and details array are required'
        })
      }

      // Add id_pedido to each detail
      const detailsWithOrder = details.map(detail => ({
        ...detail,
        id_pedido
      }))
      
      const createdDetails = await orderDetailService.createMultiple(detailsWithOrder)

      // Update order total
      await orderDetailService.updateOrderTotal(id_pedido)
      
      res.status(201).json(createdDetails)
    } catch (error) {
      next(error)
    }
  }

  async findAll(req: Request, res: Response, next: NextFunction) {
    try {
      const details = await orderDetailService.findAll()
      res.json(details)
    } catch (error) {
      next(error)
    }
  }

  async findById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params
      const detail = await orderDetailService.findById(Number(id))
      res.json(detail)
    } catch (error) {
      next(error)
    }
  }

  async findByOrderId(req: Request, res: Response, next: NextFunction) {
    try {
      const { id_pedido } = req.params
      const details = await orderDetailService.findByOrderId(Number(id_pedido))
      res.json(details)
    } catch (error) {
      next(error)
    }
  }

  async findByProductId(req: Request, res: Response, next: NextFunction) {
    try {
      const { id_producto } = req.params
      const details = await orderDetailService.findByProductId(Number(id_producto))
      res.json(details)
    } catch (error) {
      next(error)
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params
      const { cantidad, precio_unitario } = req.body
      
      const updateData: any = {}
      if (cantidad !== undefined) updateData.cantidad = cantidad
      if (precio_unitario !== undefined) updateData.precio_unitario = precio_unitario
      
      const detail = await orderDetailService.update(Number(id), updateData)

      // Get the order id and update total
      const detailData = await orderDetailService.findById(Number(id))
      await orderDetailService.updateOrderTotal(detailData.id_pedido)
      
      res.json(detail)
    } catch (error) {
      next(error)
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params
      
      // Get the order id before deleting
      const detail = await orderDetailService.findById(Number(id))
      const id_pedido = detail.id_pedido
      
      await orderDetailService.delete(Number(id))

      // Update order total
      await orderDetailService.updateOrderTotal(id_pedido)
      
      res.status(204).send()
    } catch (error) {
      next(error)
    }
  }

  async getOrderTotal(req: Request, res: Response, next: NextFunction) {
    try {
      const { id_pedido } = req.params
      const total = await orderDetailService.calculateOrderTotal(Number(id_pedido))
      res.json({ total })
    } catch (error) {
      next(error)
    }
  }
}