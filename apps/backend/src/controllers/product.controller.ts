import { Request, Response, NextFunction } from 'express'
import { ProductService } from '../services/product.service'

const productService = new ProductService()

export class ProductController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const { nombre, descripcion, precio, stock } = req.body
      const imageFile = req.file
      
      if (!nombre || !precio || stock === undefined) {
        return res.status(400).json({
          error: 'Fields nombre, precio and stock are required'
        })
      }
      
      const product = await productService.createWithImage(
        {
          nombre,
          descripcion,
          precio: Number(precio),
          stock: Number(stock)
        },
        imageFile
      )
      
      res.status(201).json(product)
    } catch (error) {
      next(error)
    }
  }

  async findAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { search, minPrice, maxPrice, inStock } = req.query
      
      const filters = {
        search: search as string,
        minPrice: minPrice ? Number(minPrice) : undefined,
        maxPrice: maxPrice ? Number(maxPrice) : undefined,
        inStock: inStock === 'true'
      }
      
      const products = await productService.findAll(filters)
      res.json(products)
    } catch (error) {
      next(error)
    }
  }

  async findById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params
      const product = await productService.findById(Number(id))
      res.json(product)
    } catch (error) {
      next(error)
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params
      const { nombre, descripcion, precio, stock } = req.body
      const imageFile = req.file
      
      const updateData: any = {}
      if (nombre !== undefined) updateData.nombre = nombre
      if (descripcion !== undefined) updateData.descripcion = descripcion
      if (precio !== undefined) updateData.precio = Number(precio)
      if (stock !== undefined) updateData.stock = Number(stock)
      
      const product = await productService.updateWithImage(
        Number(id),
        updateData,
        imageFile
      )
      
      res.json(product)
    } catch (error) {
      next(error)
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params
      await productService.delete(Number(id))
      res.status(204).send()
    } catch (error) {
      next(error)
    }
  }

  async updateStock(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params
      const { cantidad } = req.body
      
      if (cantidad === undefined) {
        return res.status(400).json({
          error: 'Field cantidad is required'
        })
      }
      
      const product = await productService.updateStock(Number(id), cantidad)
      res.json(product)
    } catch (error) {
      next(error)
    }
  }

  
}