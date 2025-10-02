import { Router } from 'express'
import { OrderController } from '../controllers/order.controller'

const router = Router()
const orderController = new OrderController()

router.post('/', orderController.create.bind(orderController))
router.get('/', orderController.findAll.bind(orderController))
router.get('/pending', orderController.getPending.bind(orderController))
router.get('/unnotified', orderController.getUnnotified.bind(orderController))
router.get('/:id', orderController.findById.bind(orderController))
router.get('/:id/details', orderController.findWithDetails.bind(orderController))
router.put('/:id', orderController.update.bind(orderController))
router.patch('/:id/status', orderController.updateStatus.bind(orderController))
router.patch('/:id/notify', orderController.markAsNotified.bind(orderController))
router.delete('/:id', orderController.delete.bind(orderController))

export default router