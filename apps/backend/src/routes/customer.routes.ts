import { Router } from 'express'
import { CustomerController } from '../controllers/customer.controller'

const router = Router()
const customerController = new CustomerController()

router.post('/', customerController.create.bind(customerController))
router.get('/', customerController.findAll.bind(customerController))
router.get('/:id', customerController.findById.bind(customerController))
router.get('/:id/orders', customerController.findWithOrders.bind(customerController))
router.get("/email/:email", customerController.findByEmail.bind(customerController))
router.get("/phone/:phone", customerController.findByPhone.bind(customerController))
router.put('/:id', customerController.update.bind(customerController))
router.delete('/:id', customerController.delete.bind(customerController))

export default router