export type Customer = {
  id: string;
  name: string;
  email?: string;
  address?: string;
  phone?: string;
  createdAt: Date;
  updatedAt: Date;
};

export type InvoiceItem = {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
};

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'cancelled';

export type Invoice = {
  id: string;
  customerId: string;
  customerName?: string; // Denormalized for display
  invoiceNumber: string;
  issueDate: Date;
  dueDate: Date;
  items: InvoiceItem[];
  totalAmount: number;
  status: InvoiceStatus;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
};
