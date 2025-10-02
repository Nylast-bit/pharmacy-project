import { Router } from 'express'
import { ProductController } from '../controllers/product.controller'
import { upload } from '../middlewares/upload.middleware'

const router = Router()
const productController = new ProductController()

router.post('/', upload.single('image'), productController.create.bind(productController))
router.get('/', productController.findAll.bind(productController))
router.get('/alerts/low-stock', productController.findLowStock.bind(productController))
router.get('/:id', productController.findById.bind(productController))
router.put('/:id', upload.single('image'), productController.update.bind(productController))
router.patch('/:id/stock', productController.updateStock.bind(productController))
router.delete('/:id', productController.delete.bind(productController))

export default router