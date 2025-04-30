import type { Timestamp } from 'firebase/firestore';

export type Customer = {
  id: string;
  name: string;
  cedula_rnc?: string; // Cédula / RNC (optional)
  email?: string;
  address?: string;
  phone?: string;
  createdAt: Timestamp | Date; // Use Firestore Timestamp or Date
  updatedAt: Timestamp | Date;
};

export type InvoiceItem = {
  id?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  price: number; // Precio unitario (alias para compatibilidad)
};

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'cancelled' | 'pending' | 'overdue';

// NCF Types for Dominican Republic
export type NcfType =
  | 'B01' // Crédito Fiscal
  | 'B02' // Consumo
  | 'B14' // Régimen Especial de Tributación
  | 'B15' // Gubernamental
  | 'B16' // Exportaciones
  | 'E31' // Compras al Exterior
  | 'E41'; // Pagos al Exterior

export const ncfTypeDescriptions: Record<NcfType, string> = {
    'B01': 'Crédito Fiscal',
    'B02': 'Consumo',
    'B14': 'Régimen Especial de Tributación',
    'B15': 'Gubernamental',
    'B16': 'Exportaciones',
    'E31': 'Compras al Exterior',
    'E41': 'Pagos al Exterior',
};


export type Invoice = {
  id: string;
  customerId: string;
  customerName?: string; // Denormalized for display
  customerCedulaRnc?: string; // Denormalized
  invoiceNumber: string;
  issueDate: Timestamp | Date; // Use Firestore Timestamp or Date
  dueDate: Timestamp | Date; // Use Firestore Timestamp or Date
  items: InvoiceItem[];
  subTotal?: number; // Sum of items before tax
  itbisRate?: number; // e.g., 0.18
  itbisAmount?: number; // Calculated ITBIS
  totalAmount?: number; // subTotal + itbisAmount
  taxRate?: number; // Tasa de impuesto (alias para compatibilidad)
  status: InvoiceStatus;
  notes?: string;
  ncfType?: NcfType; // Optional NCF Type
  ncf?: string; // Optional NCF Number (corresponds to ncfType)
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
  userId: string; // Link invoice to the user who created it
};

// Tipo para la respuesta de getInvoiceById
export type InvoiceWithCustomer = {
  invoice: Invoice;
  customer: Customer | null;
  error?: string;
};

// Tipo para respuestas de error
export type ErrorResponse = {
  error: string;
};
