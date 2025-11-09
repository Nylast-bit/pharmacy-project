import { Router } from 'express';
import { EmailController } from '../controllers/email.controller';

// 1. Importar AMBOS servicios
import { EmailService } from '../services/email.service';
import { CustomerService } from '../services/customer.service';

const router = Router();

// --- Patrón de Inyección de Dependencias ---

// 2. Instanciar AMBOS servicios
const emailService = new EmailService();
const customerService = new CustomerService();

// 3. Instanciar el controlador, inyectando AMBOS servicios
const emailController = new EmailController(
  emailService,
  customerService
);

// --- 4. Registrar todas las rutas ---

/**
 * Endpoint 1: Enviar a una lista específica de clientes
 * Recibe: { clientIds: [1, 2], subject: "...", htmlBody: "..." }
 */
router.post(
  '/send-to-list',
  emailController.handleSendToList.bind(emailController)
);

/**
 * Endpoint 2: Enviar a los 100 más recientes no notificados
 * Recibe: { subject: "...", htmlBody: "..." }
 */
router.post(
  '/send-to-latest',
  emailController.handleSendToLatest.bind(emailController)
);

/**
 * Endpoint 3: Resetea el estado para pruebas
 * Recibe: {}
 */
router.post(
  '/reset-notifications',
  emailController.handleResetNotifications.bind(emailController)
);

router.post(
  '/send-to-emails-list',
  // (tus middlewares de autenticación, si los tienes)
  (req, res, next) => emailController.handleSendToCustomList(req, res, next)
);

/**
 * Endpoint 4: Prueba simple de envío
 * Recibe: {}
 */
router.post(
  '/send-test',
  emailController.handleSendTestEmail.bind(emailController)
);

export default router;
