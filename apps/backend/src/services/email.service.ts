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
  async sendBatchEmail(
    to: string[],
    subject: string,
    html: string
  ): Promise<{ success: string[]; failed: { email: string; error: string }[] }> {
    // Validación básica
    if (!to || to.length === 0) {
      throw new AppError('No se proporcionaron destinatarios', 400);
    }

    // Envía los correos en paralelo, uno por destinatario
    const results = await Promise.allSettled(
      to.map(email =>
        this.resend.emails.send({
          from: this.fromDomain,
          to: email, // envío individual (sin copia a otros)
          subject,
          html,
        })
      )
    );

    // Procesamos resultados
    const success: string[] = [];
    const failed: { email: string; error: string }[] = [];

    results.forEach((result, index) => {
      const email = to[index];
      if (result.status === 'fulfilled' && result.value?.data?.id) {
        success.push(email);
      } else {
        const errorMessage =
          result.status === 'rejected'
            ? result.reason?.message || 'Error desconocido'
            : result.value?.error?.message || 'Error desconocido';
        failed.push({ email, error: errorMessage });
      }
    });

    console.log(`✅ Enviados: ${success.length}, ❌ Fallidos: ${failed.length}`);

    return { success, failed };
  }


}