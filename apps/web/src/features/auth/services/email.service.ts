import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

interface EmailConfig {
  host: string;
  port: number;
  user: string;
  pass: string;
}

/**
 * Servicio de envío de emails para autenticación
 *
 * Funcionalidades:
 * - Envío de emails de recuperación de contraseña
 * - Templates HTML y texto plano profesionales
 * - Validación de configuración SMTP
 * - Manejo robusto de errores
 * - Logging detallado para debugging
 */
class EmailService {
  private transporter: Transporter | null = null;

  constructor() {
    this.initTransporter();
  }

  /**
   * Inicializa el transporter de Nodemailer con configuración SMTP
   */
  private initTransporter() {
    const config = this.getConfig();

    if (!this.isConfigured(config)) {
      console.error('❌ Email service not configured - check SMTP_* env variables');
      return;
    }

    try {
      this.transporter = nodemailer.createTransport({
        host: config.host,
        port: config.port,
        secure: config.port === 465, // true para puerto 465, false para otros
        auth: {
          user: config.user,
          pass: config.pass,
        },
        tls: {
          rejectUnauthorized: false, // Permite certificados auto-firmados
        },
      });

      console.log('✅ Email service initialized');
    } catch (error) {
      console.error('❌ Error initializing email service:', error);
      this.transporter = null;
    }
  }

  /**
   * Obtiene la configuración SMTP desde variables de entorno
   */
  private getConfig(): EmailConfig {
    return {
      host: process.env.SMTP_SERVER || process.env.SMTP_HOST || '',
      port: parseInt(process.env.SMTP_PORT || '587'),
      user: process.env.SMTP_USERNAME || process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASSWORD || process.env.SMTP_PASS || '',
    };
  }

  /**
   * Verifica si el servicio está configurado correctamente
   */
  private isConfigured(config: EmailConfig): boolean {
    return !!(config.host && config.user && config.pass);
  }

  /**
   * Verifica si el servicio de email está configurado y listo para usar
   */
  public isReady(): boolean {
    const config = this.getConfig();
    return this.isConfigured(config);
  }

  /**
   * Envía email de recuperación de contraseña
   *
   * @param to - Email del destinatario
   * @param resetToken - Token de recuperación
   * @param username - Nombre del usuario
   * @returns Objeto con success y messageId
   */
  async sendPasswordResetEmail(
    to: string,
    resetToken: string,
    username: string
  ): Promise<{ success: boolean; messageId?: string }> {
    if (!this.transporter) {
      throw new Error('Email service not configured');
    }

    const frontendUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const resetUrl = `${frontendUrl}/auth/reset-password?token=${resetToken}`;

    const htmlContent = this.generatePasswordResetHTML(resetUrl, username);
    const textContent = this.generatePasswordResetText(resetUrl, username);

    try {
      const info = await this.transporter.sendMail({
        from: `"Aprende y Aplica" <${process.env.SMTP_USER}>`,
        to,
        subject: 'Recuperación de Contraseña - Aprende y Aplica',
        text: textContent,
        html: htmlContent,
      });

      console.log('📧 Password reset email sent:', {
        to,
        messageId: info.messageId,
        timestamp: new Date().toISOString(),
      });

      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('❌ Error sending password reset email:', error);
      throw new Error('Error sending password reset email');
    }
  }

  /**
   * Genera el template HTML para el email de recuperación
   */
  private generatePasswordResetHTML(resetUrl: string, username: string): string {
    return `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Recuperación de Contraseña</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f4f4f4;
          }
          .container {
            background-color: #ffffff;
            padding: 40px;
            border-radius: 10px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .logo {
            color: #44E5FF;
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 10px;
          }
          h1 {
            color: #333;
            font-size: 24px;
            margin: 0;
          }
          .button {
            display: inline-block;
            background: linear-gradient(135deg, #44E5FF, #0077A6);
            color: white !important;
            padding: 15px 35px;
            text-decoration: none;
            border-radius: 25px;
            margin: 20px 0;
            font-weight: bold;
            font-size: 16px;
          }
          .warning {
            background-color: #fff3cd;
            border: 1px solid #ffeaa7;
            border-radius: 5px;
            padding: 15px;
            margin: 20px 0;
            color: #856404;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            color: #666;
            font-size: 14px;
          }
          .link-box {
            background: #f8f9fa;
            border: 2px dashed #44E5FF;
            padding: 15px;
            border-radius: 8px;
            text-align: center;
            font-family: 'Courier New', monospace;
            font-size: 12px;
            margin: 20px 0;
            word-break: break-all;
            color: #0077A6;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">🔐 Aprende y Aplica</div>
            <h1>Recuperación de Contraseña</h1>
          </div>

          <p>Hola <strong>${username}</strong>,</p>

          <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta.</p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" class="button">
              🔓 Restablecer mi contraseña
            </a>
          </div>

          <p style="text-align: center; color: #666; font-size: 14px;">
            O copia y pega este enlace en tu navegador:
          </p>

          <div class="link-box">
            ${resetUrl}
          </div>

          <div class="warning">
            <strong>⚠️ Importante:</strong>
            <ul>
              <li>Este enlace expira en <strong>1 hora</strong></li>
              <li>Solo puedes usar este enlace una vez</li>
              <li>Si no solicitaste este cambio, ignora este email</li>
              <li>Tu contraseña actual permanece segura hasta que la cambies</li>
            </ul>
          </div>

          <p style="margin-top: 30px;">
            Si no solicitaste restablecer tu contraseña, puedes ignorar este correo.
            Tu cuenta permanece segura.
          </p>

          <div class="footer">
            <p>Este es un email automático, por favor no respondas a este mensaje.</p>
            <p>Si tienes problemas, contacta a nuestro equipo de soporte.</p>
            <p>&copy; 2025 Aprende y Aplica. Todos los derechos reservados.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Genera el template de texto plano para el email de recuperación
   */
  private generatePasswordResetText(resetUrl: string, username: string): string {
    return `
Recuperación de Contraseña - Aprende y Aplica

Hola ${username},

Recibimos una solicitud para restablecer la contraseña de tu cuenta.

Para crear una nueva contraseña, haz clic en el siguiente enlace:
${resetUrl}

IMPORTANTE:
- Este enlace expira en 1 hora
- Solo puedes usar este enlace una vez
- Si no solicitaste este cambio, ignora este email

Si tienes problemas con el enlace, copia y pega la URL completa en tu navegador.

Saludos,
Equipo Aprende y Aplica

---
Este es un email automático, por favor no respondas a este mensaje.
    `.trim();
  }
}

// Exportar instancia única (singleton)
export const emailService = new EmailService();
