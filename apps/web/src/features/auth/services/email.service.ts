import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { logger } from '../../../lib/logger';

interface EmailConfig {
  host: string;
  port: number;
  user: string;
  pass: string;
}

/**
 * Servicio de envÃ­o de emails para autenticaciÃ³n
 *
 * Funcionalidades:
 * - EnvÃ­o de emails de recuperaciÃ³n de contraseÃ±a
 * - Templates HTML y texto plano profesionales
 * - ValidaciÃ³n de configuraciÃ³n SMTP
 * - Manejo robusto de errores
 * - Logging detallado para debugging
 */
class EmailService {
  private transporter: Transporter | null = null;

  constructor() {
    this.initTransporter();
  }

  /**
   * Inicializa el transporter de Nodemailer con configuraciÃ³n SMTP
   */
  private initTransporter() {
    const config = this.getConfig();

    if (!this.isConfigured(config)) {
      logger.error('Email service not configured - check SMTP_* env variables');
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
          // âœ… Seguridad mejorada: solo permite certs invÃ¡lidos en desarrollo
          rejectUnauthorized: process.env.NODE_ENV === 'production',
          minVersion: 'TLSv1.2', // Forzar TLS 1.2 o superior
          ciphers: 'HIGH:!aNULL:!MD5', // Solo ciphers seguros
        },
      });

      logger.info('Email service initialized');
    } catch (error) {
      logger.error('Error initializing email service', error);
      this.transporter = null;
    }
  }

  /**
   * Obtiene la configuraciÃ³n SMTP desde variables de entorno
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
   * Verifica si el servicio estÃ¡ configurado correctamente
   */
  private isConfigured(config: EmailConfig): boolean {
    return !!(config.host && config.user && config.pass);
  }

  /**
   * Verifica si el servicio de email estÃ¡ configurado y listo para usar
   */
  public isReady(): boolean {
    const config = this.getConfig();
    return this.isConfigured(config);
  }


  /**
   * EnvÃ­a email de recuperaciÃ³n de contraseÃ±a
   *
   * @param to - Email del destinatario
   * @param resetToken - Token de recuperaciÃ³n
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
        from: `"SOFLIA" <noreply@soflia.com>`,
        to,
        subject: 'RecuperaciÃ³n de ContraseÃ±a - SOFLIA',
        text: textContent,
        html: htmlContent,
      });

      logger.info('Password reset email sent', {
        messageId: info.messageId,
        timestamp: new Date().toISOString(),
      });

      return { success: true, messageId: info.messageId };
    } catch (error) {
      logger.error('Error sending password reset email', error);
      throw new Error('Error sending password reset email');
    }
  }

  /**
   * Genera el template HTML para el email de recuperaciÃ³n
   */
  private generatePasswordResetHTML(resetUrl: string, username: string): string {
    return `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>RecuperaciÃ³n de ContraseÃ±a</title>
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
            <div class="logo">ðŸ” Aprende y Aplica</div>
            <h1>RecuperaciÃ³n de ContraseÃ±a</h1>
          </div>

          <p>Hola <strong>${username}</strong>,</p>

          <p>Recibimos una solicitud para restablecer la contraseÃ±a de tu cuenta.</p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" class="button">
              ðŸ”“ Restablecer mi contraseÃ±a
            </a>
          </div>

          <p style="text-align: center; color: #666; font-size: 14px;">
            O copia y pega este enlace en tu navegador:
          </p>

          <div class="link-box">
            ${resetUrl}
          </div>

          <div class="warning">
            <strong>âš ï¸ Importante:</strong>
            <ul>
              <li>Este enlace expira en <strong>1 hora</strong></li>
              <li>Solo puedes usar este enlace una vez</li>
              <li>Si no solicitaste este cambio, ignora este email</li>
              <li>Tu contraseÃ±a actual permanece segura hasta que la cambies</li>
            </ul>
          </div>

          <p style="margin-top: 30px;">
            Si no solicitaste restablecer tu contraseÃ±a, puedes ignorar este correo.
            Tu cuenta permanece segura.
          </p>

          <div class="footer">
            <p>Este es un email automÃ¡tico, por favor no respondas a este mensaje.</p>
            <p>Si tienes problemas, contacta a nuestro equipo de soporte.</p>
            <p>&copy; 2025 Aprende y Aplica. Todos los derechos reservados.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Genera el template de texto plano para el email de recuperaciÃ³n
   */
  private generatePasswordResetText(resetUrl: string, username: string): string {
    return `
RecuperaciÃ³n de ContraseÃ±a - Aprende y Aplica

Hola ${username},

Recibimos una solicitud para restablecer la contraseÃ±a de tu cuenta.

Para crear una nueva contraseÃ±a, haz clic en el siguiente enlace:
${resetUrl}

IMPORTANTE:
- Este enlace expira en 1 hora
- Solo puedes usar este enlace una vez
- Si no solicitaste este cambio, ignora este email

Si tienes problemas con el enlace, copia y pega la URL completa en tu navegador.

Saludos,
Equipo Aprende y Aplica

---
Este es un email automÃ¡tico, por favor no respondas a este mensaje.
    `.trim();
  }

  // ============================================================================
  // EMAILS DE INVITACIÃ“N A ORGANIZACIÃ“N
  // ============================================================================

  /**
   * EnvÃ­a email de invitaciÃ³n a una organizaciÃ³n
   *
   * @param to - Email del destinatario
   * @param invitationToken - Token de invitaciÃ³n (64 chars hex)
   * @param organizationName - Nombre de la organizaciÃ³n
   * @param organizationSlug - Slug para la URL de registro
   * @param customMessage - Mensaje personalizado opcional del admin
   * @param organizationLogoUrl - URL del logo de la organizaciÃ³n (opcional)
   * @returns Objeto con success y messageId
   */
  async sendOrganizationInvitationEmail(
    to: string,
    invitationToken: string,
    organizationName: string,
    organizationSlug: string,
    customMessage?: string,
    organizationLogoUrl?: string
  ): Promise<{ success: boolean; messageId?: string }> {
    if (!this.transporter) {
      throw new Error('Email service not configured');
    }

    const frontendUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const registerUrl = `${frontendUrl}/auth/${organizationSlug}/register?token=${invitationToken}`;

    const htmlContent = this.generateInvitationHTML(registerUrl, organizationName, customMessage, organizationLogoUrl);
    const textContent = this.generateInvitationText(registerUrl, organizationName, customMessage);

    try {
      const info = await this.transporter.sendMail({
        from: `"${organizationName}" <noreply@soflia.com>`,
        to,
        subject: `InvitaciÃ³n a ${organizationName}`,
        text: textContent,
        html: htmlContent,
      });

      logger.info('Organization invitation email sent', {
        messageId: info.messageId,
        organization: organizationName,
        to,
        timestamp: new Date().toISOString(),
      });

      return { success: true, messageId: info.messageId };
    } catch (error) {
      logger.error('Error sending organization invitation email', error);
      throw new Error('Error sending organization invitation email');
    }
  }

  /**
   * Genera el template HTML para el email de invitaciÃ³n
   * DiseÃ±o minimalista y formal sin emojis
   */
  private generateInvitationHTML(
    registerUrl: string,
    organizationName: string,
    customMessage?: string,
    organizationLogoUrl?: string
  ): string {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const SOFLIALogoUrl = `${appUrl}/Logo.png`;

    return `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>InvitaciÃ³n - ${organizationName}</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.7;
            color: #1a1a1a;
            max-width: 580px;
            margin: 0 auto;
            padding: 0;
            background-color: #f5f5f5;
          }
          .container {
            background-color: #ffffff;
            margin: 40px auto;
            border-radius: 4px;
            overflow: hidden;
          }
          .header {
            background-color: #0A2540;
            padding: 28px 40px;
            text-align: center;
          }
          .SOFLIA-logo {
            height: 60px;
            width: auto;
            margin-bottom: 0;
          }
          .org-section {
            text-align: center;
            padding: 32px 40px 24px;
            border-bottom: 1px solid #e5e5e5;
          }
          .org-logo {
            max-height: 60px;
            max-width: 200px;
            width: auto;
            margin-bottom: 12px;
          }
          .org-name {
            color: #0A2540;
            font-size: 18px;
            font-weight: 600;
            letter-spacing: 0.3px;
            margin: 0;
          }
          .content {
            padding: 32px 40px 40px;
          }
          .title {
            color: #0A2540;
            font-size: 22px;
            font-weight: 600;
            margin: 0 0 24px 0;
          }
          .text {
            color: #4a4a4a;
            font-size: 15px;
            margin: 0 0 16px 0;
          }
          .custom-message {
            background-color: #f9fafb;
            border-left: 3px solid #0A2540;
            padding: 16px 20px;
            margin: 24px 0;
            color: #4a4a4a;
            font-size: 14px;
          }
          .button-container {
            text-align: center;
            margin: 32px 0;
          }
          .button {
            display: inline-block;
            background-color: #0A2540;
            color: #ffffff !important;
            padding: 14px 32px;
            text-decoration: none;
            border-radius: 4px;
            font-weight: 500;
            font-size: 15px;
            letter-spacing: 0.3px;
            }
          .divider {
            height: 1px;
            background-color: #e5e5e5;
            margin: 32px 0;
          }
          .link-section {
            text-align: center;
          }
          .link-label {
            color: #6b6b6b;
            font-size: 13px;
            margin: 0 0 12px 0;
          }
          .link-box {
            background-color: #f9fafb;
            border: 1px solid #e5e5e5;
            padding: 14px 16px;
            border-radius: 4px;
            font-family: 'SF Mono', Monaco, 'Courier New', monospace;
            font-size: 12px;
            word-break: break-all;
            color: #0A2540;
          }
          .info-section {
            background-color: #f9fafb;
            border-radius: 4px;
            padding: 20px 24px;
            margin: 32px 0 0 0;
          }
          .info-title {
            color: #1a1a1a;
            font-size: 14px;
            font-weight: 600;
            margin: 0 0 12px 0;
          }
          .info-list {
            margin: 0;
            padding: 0 0 0 18px;
            color: #4a4a4a;
            font-size: 14px;
          }
          .info-list li {
            margin-bottom: 6px;
          }
          .info-list li:last-child {
            margin-bottom: 0;
          }
          .footer {
            background-color: #f9fafb;
            padding: 24px 40px;
            text-align: center;
            border-top: 1px solid #e5e5e5;
          }
          .footer-logo {
            height: 24px;
            width: auto;
            margin-bottom: 12px;
            opacity: 0.7;
          }
          .footer-text {
            color: #6b6b6b;
            font-size: 12px;
            margin: 0 0 8px 0;
          }
          .footer-copyright {
            color: #9a9a9a;
            font-size: 11px;
            margin: 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <img src="${SOFLIALogoUrl}" alt="SOFLIA" class="SOFLIA-logo" />
          </div>

          <div class="org-section">
            ${organizationLogoUrl ? `<img src="${organizationLogoUrl}" alt="${organizationName}" class="org-logo" /><br/>` : ''}
            <p class="org-name">${organizationName}</p>
          </div>

          <div class="content">
            <h1 class="title">InvitaciÃ³n a la plataforma</h1>
            
            <p class="text">Estimado/a usuario,</p>

            <p class="text">Ha sido invitado/a a formar parte de <strong>${organizationName}</strong> en nuestra plataforma de capacitaciÃ³n y desarrollo profesional.</p>

            ${customMessage ? `
            <div class="custom-message">
              ${customMessage}
            </div>
            ` : ''}

            <div class="button-container">
              <a href="${registerUrl}" class="button">Aceptar invitaciÃ³n</a>
            </div>

            <div class="divider"></div>

            <div class="link-section">
              <p class="link-label">Si el botÃ³n no funciona, copie y pegue el siguiente enlace en su navegador:</p>
              <div class="link-box">${registerUrl}</div>
            </div>

            <div class="info-section">
              <p class="info-title">InformaciÃ³n importante</p>
              <ul class="info-list">
                <li>Esta invitaciÃ³n tiene una validez de 7 dÃ­as.</li>
                <li>El enlace es de uso Ãºnico.</li>
                <li>Su correo electrÃ³nico ha sido pre-registrado en el sistema.</li>
              </ul>
            </div>
          </div>

          <div class="footer">
            <img src="${SOFLIALogoUrl}" alt="SOFLIA" class="footer-logo" />
            <p class="footer-text">Este es un mensaje automÃ¡tico. Por favor, no responda a este correo.</p>
            <p class="footer-copyright">&copy; ${new Date().getFullYear()} SOFLIA. Todos los derechos reservados.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Genera el template de texto plano para el email de invitaciÃ³n
   * VersiÃ³n formal y minimalista
   */
  private generateInvitationText(
    registerUrl: string,
    organizationName: string,
    customMessage?: string
  ): string {
    return `
${organizationName}
InvitaciÃ³n a la plataforma

Estimado/a usuario,

Ha sido invitado/a a formar parte de ${organizationName} en nuestra plataforma de capacitaciÃ³n y desarrollo profesional.

${customMessage ? `Mensaje del administrador:\n${customMessage}\n` : ''}
Para completar su registro, acceda al siguiente enlace:
${registerUrl}

INFORMACIÃ“N IMPORTANTE:
- Esta invitaciÃ³n tiene una validez de 7 dÃ­as.
- El enlace es de uso Ãºnico.
- Su correo electrÃ³nico ha sido pre-registrado en el sistema.

Atentamente,
Equipo de ${organizationName}

---
Este es un mensaje automÃ¡tico. Por favor, no responda a este correo.
    `.trim();
  }
}

// Exportar instancia Ãºnica (singleton)
export const emailService = new EmailService();
