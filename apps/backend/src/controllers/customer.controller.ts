//Customers.controller.ts

import { Request, Response, NextFunction } from 'express'
import { CustomerService } from '../services/customer.service'

const customerService = new CustomerService()

export class CustomerController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const { nombre, correo, telefono, direccion } = req.body
      
      if (!nombre || !correo) {
        return res.status(400).json({
          error: 'Fields nombre and correo are required'
        })
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(correo)) {
        return res.status(400).json({
          error: 'Invalid email format'
        })
      }

      // Check if email already exists
      const existingCustomer = await customerService.findByEmail(correo)
      if (existingCustomer) {
        return res.status(400).json({
          error: 'Email already registered'
        })
      }
      
      const customer = await customerService.create({
        nombre,
        correo,
        telefono,
        direccion
      })
      
      res.status(201).json(customer)
    } catch (error) {
      next(error)
    }
  }

  async findAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { search } = req.query
      
      const filters = {
        search: search as string
      }
      
      const customers = await customerService.findAll(filters)
      res.json(customers)
    } catch (error) {
      next(error)
    }
  }

  async findById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params
      const customer = await customerService.findById(Number(id))
      res.json(customer)
    } catch (error) {
      next(error)
    }
  }

  async findByEmail(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.params
      const customer = await customerService.findByEmail(email)

      if (!customer) {
        return res.status(404).json({ error: "Customer not found" })
      }

      res.json(customer)
    } catch (error) {
      next(error)
    }
  }

  async findByPhone(req: Request, res: Response, next: NextFunction) {
    try {
      const { phone } = req.params
      const customer = await customerService.findByPhone(phone)

      if (!customer) {
        return res.status(404).json({ error: "Customer not found" })
      }

      res.json(customer)
    } catch (error) {
      next(error)
    }
  }


  async findWithOrders(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params
      const customer = await customerService.findWithOrders(Number(id))
      res.json(customer)
    } catch (error) {
      next(error)
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params
      const { nombre, correo, telefono, direccion } = req.body
      
      const updateData: any = {}
      if (nombre !== undefined) updateData.nombre = nombre
      if (correo !== undefined) {
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(correo)) {
          return res.status(400).json({
            error: 'Invalid email format'
          })
        }
        updateData.correo = correo
      }
      if (telefono !== undefined) updateData.telefono = telefono
      if (direccion !== undefined) updateData.direccion = direccion
      
      const customer = await customerService.update(Number(id), updateData)
      res.json(customer)
    } catch (error) {
      next(error)
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params
      await customerService.delete(Number(id))
      res.status(204).send()
    } catch (error) {
      next(error)
    }
  }
}