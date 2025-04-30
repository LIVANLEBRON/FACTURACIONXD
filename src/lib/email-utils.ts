import nodemailer from 'nodemailer';
import { Invoice } from './definitions';

// Función para formatear fechas
const formatDate = (date: any): string => {
  if (date instanceof Date) {
    return date.toLocaleDateString('es-DO');
  }
  return new Date(date).toLocaleDateString('es-DO');
};

// Configuración del transportador de correo
// En producción, se recomienda usar servicios como SendGrid, Mailgun, etc.
// Para desarrollo, podemos usar un servicio SMTP o ethereal.email para pruebas
const createTransporter = async () => {
  // Para producción, usar variables de entorno para las credenciales
  if (process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }
  
  // Para desarrollo/pruebas, usar ethereal.email (servicio de prueba)
  const testAccount = await nodemailer.createTestAccount();
  return nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });
};

/**
 * Envía un correo electrónico con la factura adjunta
 * @param invoice Datos de la factura
 * @param recipientEmail Correo electrónico del destinatario
 * @param pdfBuffer Buffer del PDF de la factura
 * @param senderName Nombre del remitente (opcional)
 */
export async function sendInvoiceEmail(
  invoice: Invoice,
  recipientEmail: string,
  pdfBuffer: Buffer,
  senderName?: string
): Promise<{ success: boolean; previewUrl?: string; error?: string }> {
  try {
    const transporter = await createTransporter();
    
    const mailOptions = {
      from: `"${senderName || 'Sistema de Facturación'}" <${process.env.EMAIL_USER || 'facturacion@invoicify.com'}>`,
      to: recipientEmail,
      subject: `Factura ${invoice.invoiceNumber}`,
      text: `Estimado cliente,\n\nAdjunto encontrará la factura ${invoice.invoiceNumber} por un monto de ${invoice.totalAmount.toFixed(2)} RD$.\n\nGracias por su preferencia.\n\nAtentamente,\n${senderName || 'Sistema de Facturación Invoicify'}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #003366;">Factura ${invoice.invoiceNumber}</h2>
          <p>Estimado cliente,</p>
          <p>Adjunto encontrará la factura <strong>${invoice.invoiceNumber}</strong> por un monto de <strong>${invoice.totalAmount.toFixed(2)} RD$</strong>.</p>
          <p>Fecha de emisión: ${formatDate(invoice.issueDate)}</p>
          <p>Fecha de vencimiento: ${formatDate(invoice.dueDate)}</p>
          <p>Gracias por su preferencia.</p>
          <p>Atentamente,<br>${senderName || 'Sistema de Facturación Invoicify'}</p>
        </div>
      `,
      attachments: [
        {
          filename: `Factura_${invoice.invoiceNumber}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    };
    
    const info = await transporter.sendMail(mailOptions);
    
    // Si estamos usando ethereal.email para pruebas, devolver la URL de vista previa
    if (info.messageId) {
      // Ethereal proporciona una URL de vista previa, pero no está en los tipos oficiales
      // Por lo que accedemos a ella como una propiedad dinámica
      const previewUrl = (info as any).previewURL || '';
      return {
        success: true,
        previewUrl,
      };
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error al enviar correo electrónico:', error);
    return {
      success: false,
      error: 'Error al enviar el correo electrónico. Por favor, inténtelo de nuevo más tarde.',
    };
  }
}
