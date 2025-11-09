import { Request, Response, NextFunction } from 'express';
import { EmailService } from '../services/email.service';
import { CustomerService } from '../services/customer.service';
import { AppError } from '../middlewares/errorHandler';
import { Database } from '../types/database.types';

type ClientRow = Database['public']['Tables']['clientes']['Row'];

export class EmailController {
  private emailService: EmailService;
  private customerService: CustomerService;

  constructor(
    emailService: EmailService,
    customerService: CustomerService
  ) {
    this.emailService = emailService;
    this.customerService = customerService;
  }

  // --- Función reutilizable para validar y extraer correos ---
  private validateAndExtractEmails(clients: ClientRow[]): { emails: string[], ids: number[] } {
    const clientEmails: string[] = [];
    const clientIds: number[] = [];

    clients.forEach((client) => {
      // TypeScript ahora sabe que client.correo, .id_cliente y .nombre existen
      if (!client.correo) {
        console.warn(`Cliente ${client.id_cliente} (${client.nombre}) omitido por falta de correo.`);
      } else {
        clientEmails.push(client.correo);
        clientIds.push(client.id_cliente);
      }
    });
    
    // Devolvemos solo los emails e IDs válidos
    return { emails: clientEmails, ids: clientIds };
  }

  /**
   * Endpoint 1: Enviar a una lista específica de clientes
   */
  async handleSendToList(req: Request, res: Response, next: NextFunction) {
    try {
      const { clientIds, subject, htmlBody } = req.body;

      if (!clientIds || !Array.isArray(clientIds) || clientIds.length === 0) {
        throw new AppError('El campo "clientIds" es requerido y debe ser un array no vacío', 400);
      }
      if (!subject) throw new AppError('El campo "subject" es requerido', 400);
      if (!htmlBody) throw new AppError('El campo "htmlBody" es requerido', 400);

      // 1. Buscar solo los clientes solicitados
      const clientsToNotify = await this.customerService.getByIds(clientIds);
      if (clientsToNotify.length === 0) {
        throw new AppError('Ninguno de los IDs de cliente fue encontrado', 404);
      }

      // 2. Validar y extraer correos
      const { emails, ids } = this.validateAndExtractEmails(clientsToNotify);
      if (emails.length === 0) {
         return res.status(200).json({ message: 'Ninguno de los clientes seleccionados tiene un correo válido.' });
      }

      // 3. Enviar el correo
      await this.emailService.sendBatchEmail(emails, subject, htmlBody);

      // 4. Actualizar la fecha de promoción
      // --- 👇 LÍNEA AÑADIDA ---
      await this.customerService.setPromotionSent(ids);
      // --- 👆 LÍNEA AÑADIDA ---

      res.status(200).json({
        message: `Promoción enviada exitosamente a ${ids.length} clientes.`,
      });

    } catch (error) {
      next(error);
    }
  }

  /**
   * Endpoint 2: Enviar a los 100 más recientes no notificados
   */
  async handleSendToLatest(req: Request, res: Response, next: NextFunction) {
    try {
      const { subject, htmlBody } = req.body;
      const BATCH_LIMIT = 100; // El límite que pediste

      if (!subject) throw new AppError('El campo "subject" es requerido', 400);
      if (!htmlBody) throw new AppError('El campo "htmlBody" es requerido', 400);

      // 1. Buscar los 100 clientes más nuevos SIN notificar
      const clientsToNotify = await this.customerService.getLatestUnnotified(BATCH_LIMIT);
      
      if (clientsToNotify.length === 0) {
        return res.status(200).json({ message: 'No hay clientes nuevos que notificar.' });
      }
      
      // 2. Validar y extraer correos
      const { emails, ids } = this.validateAndExtractEmails(clientsToNotify);
      if (emails.length === 0) {
         return res.status(200).json({ message: 'No hay clientes con correos válidos para notificar.' });
      }

      // 3. Enviar el correo
      await this.emailService.sendBatchEmail(emails, subject, htmlBody);
      
      // 4. Actualizar la fecha de promoción
      // --- 👇 LÍNEA AÑADIDA ---
      await this.customerService.setPromotionSent(ids);
      // --- 👆 LÍNEA AÑADIDA ---

      res.status(200).json({
        message: `Promoción enviada exitosamente a ${ids.length} nuevos clientes.`,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Endpoint 3: Resetea el estado para pruebas
   */
  async handleResetNotifications(req: Request, res: Response, next: NextFunction) {
    try {
      const updated = await this.customerService.resetAllNotified();
      res.status(200).json({
        message: `Se reseteó el estado de ${updated.length} clientes a NULL.`,
      });
    } catch (error) {
      next(error);
    }
  }


  public async handleSendToCustomList(req: Request, res: Response, next: NextFunction) {
    try {
      // 1. Extraer el body.
      const { emails, subject, htmlBody } = req.body;

      // 2. Validar que los campos básicos existan (siguiendo tu estilo)
      if (!emails || !Array.isArray(emails) || emails.length === 0) {
        throw new AppError('El campo "emails" es requerido y debe ser un array no vacío', 400);
      }
      if (!subject) throw new AppError('El campo "subject" es requerido', 400);
      if (!htmlBody) throw new AppError('El campo "htmlBody" es requerido', 400);

      // 3. Enviar el correo directamente.
      // No hay validación contra la BD.
      // No hay actualización de 'fecha_ultima_promocion'.
      await this.emailService.sendBatchEmail(emails, subject, htmlBody);

      // 4. Enviar respuesta simple
      res.status(200).json({
        message: `Promoción enviada exitosamente a ${emails.length} correos.`,
      });

    } catch (error) {
      next(error);
    }
  }

  /**
   * (Tu endpoint de prueba original)
   */
  async handleSendTestEmail(req: Request, res: Response, next: NextFunction) {
    try {
      const emailData = await this.emailService.sendTestEmail();
      res.status(200).json({
        message: 'Correo de prueba enviado exitosamente',
        emailId: emailData.id,
      });
    } catch (error) {
      next(error);
    }
  }

  
}
