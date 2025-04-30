import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { Customer, Invoice, NcfType } from './definitions';
import { ncfTypeDescriptions } from './definitions';
import { formatCurrencyRD } from './utils';

// ITBIS Rate for Dominican Republic
const ITBIS_RATE = 0.18;

/**
 * Generates a PDF for an invoice
 * @param invoice The invoice data
 * @param customer The customer data
 * @returns PDF document as a Blob
 */
export function generateInvoicePdf(invoice: Invoice, customer: Customer): Blob {
  // Create a new PDF document
  const doc = new jsPDF();
  
  // Add company info
  doc.setFontSize(20);
  doc.setTextColor(0, 51, 102);
  doc.text("INVOICIFY", 105, 20, { align: "center" });
  
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text("Sistema de Facturación", 105, 28, { align: "center" });
  
  // Add invoice header
  doc.setFontSize(14);
  doc.text(`FACTURA: ${invoice.invoiceNumber}`, 14, 45);
  
  // Add NCF if available
  if (invoice.ncf && invoice.ncfType) {
    doc.text(`NCF: ${invoice.ncf}`, 14, 53);
    doc.text(`Tipo de Comprobante: ${ncfTypeDescriptions[invoice.ncfType as NcfType]}`, 14, 61);
  }
  
  // Add dates
  const formatDate = (date: Date | any) => {
    if (date instanceof Date) {
      return date.toLocaleDateString('es-DO');
    }
    return new Date(date).toLocaleDateString('es-DO');
  };
  
  doc.text(`Fecha de Emisión: ${formatDate(invoice.issueDate)}`, 140, 45, { align: "right" });
  doc.text(`Fecha de Vencimiento: ${formatDate(invoice.dueDate)}`, 140, 53, { align: "right" });
  
  // Add customer info
  doc.setFontSize(12);
  doc.text("CLIENTE:", 14, 75);
  doc.text(`${customer.name}`, 14, 83);
  if (customer.cedula_rnc) doc.text(`RNC/Cédula: ${customer.cedula_rnc}`, 14, 91);
  if (customer.address) doc.text(`Dirección: ${customer.address}`, 14, 99);
  if (customer.phone) doc.text(`Teléfono: ${customer.phone}`, 14, 107);
  if (customer.email) doc.text(`Email: ${customer.email}`, 14, 115);
  
  // Add items table
  const tableColumn = ["Descripción", "Cantidad", "Precio Unitario", "ITBIS", "Total"];
  const tableRows = invoice.items.map(item => {
    const unitPrice = item.unitPrice;
    const quantity = item.quantity;
    const subtotal = unitPrice * quantity;
    const itbis = subtotal * ITBIS_RATE;
    const total = subtotal + itbis;
    
    return [
      item.description,
      quantity.toFixed(2),
      formatCurrencyRD(unitPrice),
      formatCurrencyRD(itbis),
      formatCurrencyRD(total)
    ];
  });
  
  // @ts-ignore - jspdf-autotable extends jsPDF prototype
  doc.autoTable({
    head: [tableColumn],
    body: tableRows,
    startY: 125,
    theme: 'grid',
    styles: { fontSize: 10, cellPadding: 3 },
    headStyles: { fillColor: [0, 51, 102], textColor: 255 },
    margin: { top: 125 }
  });
  
  // Add totals
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  
  doc.text("Subtotal:", 120, finalY);
  doc.text(formatCurrencyRD(invoice.subTotal), 170, finalY, { align: "right" });
  
  doc.text("ITBIS (18%):", 120, finalY + 8);
  doc.text(formatCurrencyRD(invoice.itbisAmount), 170, finalY + 8, { align: "right" });
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text("TOTAL:", 120, finalY + 18);
  doc.text(formatCurrencyRD(invoice.totalAmount), 170, finalY + 18, { align: "right" });
  
  // Add notes if available
  if (invoice.notes) {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text("Notas:", 14, finalY + 30);
    doc.setFontSize(10);
    doc.text(invoice.notes || '', 14, finalY + 38);
  }
  
  // Add footer
  doc.setFontSize(9);
  doc.text("Gracias por su preferencia", 105, 280, { align: "center" });
  
  // Generate PDF blob
  return doc.output('blob');
}
