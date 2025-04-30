import { notFound } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { InvoiceForm } from "../../_components/invoice-form";
import { getInvoiceById, getCustomers } from "@/lib/actions";
import type { Invoice, Customer } from '@/lib/definitions';

interface EditInvoicePageProps {
  params: { id: string };
}

export default async function EditInvoicePage({ params }: EditInvoicePageProps) {
  const id = params.id;
  const [invoice, customers]: [Invoice | null, Customer[]] = await Promise.all([
     getInvoiceById(id),
     getCustomers()
   ]);

  if (!invoice) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Editar Factura #{invoice.invoiceNumber}</h1>
      <Card>
        <CardHeader>
          <CardTitle>Detalles de la Factura</CardTitle>
          <CardDescription>
            Actualice la información de la factura.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <InvoiceForm invoice={invoice} customers={customers} />
        </CardContent>
      </Card>
    </div>
  );
}
