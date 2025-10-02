import { Router } from 'express'
import { OrderDetailController } from '../controllers/orderDetail.controller'

const router = Router()
const orderDetailController = new OrderDetailController()

router.post('/', orderDetailController.create.bind(orderDetailController))
router.post('/multiple', orderDetailController.createMultiple.bind(orderDetailController))
router.get('/', orderDetailController.findAll.bind(orderDetailController))
router.get('/:id', orderDetailController.findById.bind(orderDetailController))
router.get('/order/:id_pedido', orderDetailController.findByOrderId.bind(orderDetailController))
router.get('/order/:id_pedido/total', orderDetailController.getOrderTotal.bind(orderDetailController))
router.get('/product/:id_producto', orderDetailController.findByProductId.bind(orderDetailController))
router.put('/:id', orderDetailController.update.bind(orderDetailController))
router.delete('/:id', orderDetailController.delete.bind(orderDetailController))

export default router