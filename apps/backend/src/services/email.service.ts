import { Resend } from 'resend';
import { AppError } from '../middlewares/errorHandler'; // Asumo que tienes tu AppError aquí

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

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
  // Función de ayuda para crear una pausa

// ...

  async sendBatchEmail(
    to: string[],
    subject: string,
    html: string
  ): Promise<{ success: string[]; failed: { email: string; error: string }[] }> {
    
    if (!to || to.length === 0) {
      throw new AppError('No se proporcionaron destinatarios', 400);
    }

    const success: string[] = [];
    const failed: { email: string; error: string }[] = [];

    // Usamos un bucle 'for...of' en lugar de '.map'
    // para que 'await' funcione secuencialmente
    for (const email of to) {
      try {
        const { data, error } = await this.resend.emails.send({
          from: this.fromDomain,
          to: email,
          subject,
          html,
        });

        if (error) {
          throw error; // Lanza el error para que lo atrape el catch
        }
        
        success.push(email);

      } catch (error: any) {
        console.error(`❌ Falló al enviar a: ${email}. Razón:`, error.message);
        failed.push({ email, error: error.message || 'Error desconocido' });
      }

      // ¡LA PARTE CLAVE!
      // Hacemos una pausa de 500ms después de CADA envío.
      // 500ms = 2 peticiones por segundo. Ajusta esto si Resend sigue fallando.
      await delay(500); 
    }

    console.log(`✅ Enviados: ${success.length}, ❌ Fallidos: ${failed.length}`);
    return { success, failed };
  }


}