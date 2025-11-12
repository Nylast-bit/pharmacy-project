import { Resend } from 'resend';
import { AppError } from '../middlewares/errorHandler'; // Asumo que tienes tu AppError aquí

export class EmailService {
  private resend: Resend;
  private fromDomain = 'info@rxsolutionmeds.com'; // Tu dominio verificado

  constructor() {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      // Es mejor lanzar un error al iniciar que al intentar enviar
      throw new Error('La variable RESEND_API_KEY no está definida en .env');
    }
    this.resend = new Resend(apiKey);
  }

  /**
   * Envía un correo de prueba simple.
   */
  async sendTestEmail(): Promise<{ id: string }> {
    const { data, error } = await this.resend.emails.send({
      from: this.fromDomain,
      to: 'stalyn.fernandez27@gmail.com', // Correo de prueba
      subject: '¡Prueba desde Arquitectura (INSTANCIA)! 🚀',
      html: '<h1>¡Funciona!</h1><p>Este correo fue enviado desde el EmailService instanciado.</p>',
    });

    if (error) {
      console.error('Error de Resend:', error);
      // Usamos tu patrón de error
      throw new AppError(error.message, 400);
    }

    if (!data) {
      throw new AppError('Resend no devolvió datos', 500);
    }

    return data; // data es { id: '...' }
  }

  // (A FUTURO)
  async sendBatchEmail(to: string[], subject: string, html: string): Promise<{ id: string }> {
    
    // Resend maneja el array en el campo 'to' de forma nativa.
    const { data, error } = await this.resend.emails.send({
      from: this.fromDomain,
      to: to, // ¡Aquí pasamos el array completo!
      subject: subject,
      html: html,
    });

    if (error) {
      console.error('Error de Resend (batch):', error);
      throw new AppError(error.message, 400);
    }

    if (!data) {
      throw new AppError('Resend no devolvió datos en el envío batch', 500);
    }

    return data; // Devuelve el ID del lote
  }

}