import { notFound } from 'next/navigation';
import { getInvoiceById } from '@/lib/actions';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { InvoiceActions } from '@/components/invoices/invoice-actions';
import AuthGuard from '@/components/auth/auth-guard';
import { Invoice, InvoiceItem } from '@/lib/definitions';

export default async function InvoiceDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const invoiceData = await getInvoiceById(id);
  
  if (!invoiceData || 'error' in invoiceData) {
    return notFound();
  }
  
  const { invoice, customer } = invoiceData as { invoice: Invoice, customer: any };
  
  // Calcular el total de la factura
  const total = invoice.items.reduce((sum: number, item: InvoiceItem) => {
    // Usar price o unitPrice según lo que esté disponible
    const itemPrice = item.price || item.unitPrice;
    return sum + (item.quantity * itemPrice);
  }, 0);
  
  const tax = total * (invoice.taxRate || invoice.itbisRate || 0) / 100;
  const grandTotal = total + tax;
  
  // Determinar el estado de la factura con un color
  const getStatusBadge = () => {
    switch (invoice.status) {
      case 'paid':
        return <Badge className="bg-green-500">Pagada</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500">Pendiente</Badge>;
      case 'overdue':
        return <Badge className="bg-red-500">Vencida</Badge>;
      default:
        return <Badge>{invoice.status}</Badge>;
    }
  };

  return (
    <AuthGuard>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Factura #{invoice.invoiceNumber}</h1>
          <InvoiceActions 
            invoiceId={id} 
            customerEmail={customer?.email} 
            invoiceNumber={invoice.invoiceNumber} 
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Información del cliente */}
          <Card>
            <CardHeader>
              <CardTitle>Cliente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="font-medium">{customer?.name}</p>
              <p>{customer?.address}</p>
              <p>RNC/Cédula: {customer?.rnc}</p>
              {customer?.email && <p>Email: {customer?.email}</p>}
              {customer?.phone && <p>Teléfono: {customer?.phone}</p>}
            </CardContent>
          </Card>
          
          {/* Información de la factura */}
          <Card>
            <CardHeader>
              <CardTitle>Detalles de Factura</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span>Estado:</span>
                {getStatusBadge()}
              </div>
              <div className="flex justify-between">
                <span>Fecha de emisión:</span>
                <span>{formatDate(invoice.issueDate)}</span>
              </div>
              <div className="flex justify-between">
                <span>Fecha de vencimiento:</span>
                <span>{formatDate(invoice.dueDate)}</span>
              </div>
              {invoice.ncfType && (
                <div className="flex justify-between">
                  <span>Tipo de NCF:</span>
                  <span>{invoice.ncfType}</span>
                </div>
              )}
              {invoice.ncf && (
                <div className="flex justify-between">
                  <span>NCF:</span>
                  <span>{invoice.ncf}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Tabla de items */}
        <Card>
          <CardHeader>
            <CardTitle>Productos y Servicios</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Descripción</th>
                    <th className="text-right py-3 px-4">Cantidad</th>
                    <th className="text-right py-3 px-4">Precio</th>
                    <th className="text-right py-3 px-4">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items.map((item: InvoiceItem, index: number) => {
                    const itemPrice = item.price || item.unitPrice;
                    return (
                      <tr key={index} className="border-b">
                        <td className="py-3 px-4">{item.description}</td>
                        <td className="text-right py-3 px-4">{item.quantity}</td>
                        <td className="text-right py-3 px-4">{formatCurrency(itemPrice)}</td>
                        <td className="text-right py-3 px-4">{formatCurrency(item.quantity * itemPrice)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
          <CardFooter>
            <div className="ml-auto w-full md:w-1/3 space-y-2">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{formatCurrency(total)}</span>
              </div>
              <div className="flex justify-between">
                <span>ITBIS ({invoice.taxRate || invoice.itbisRate || 0}%):</span>
                <span>{formatCurrency(tax)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-bold">
                <span>Total:</span>
                <span>{formatCurrency(grandTotal)}</span>
              </div>
            </div>
          </CardFooter>
        </Card>
        
        {/* Notas */}
        {invoice.notes && (
          <Card>
            <CardHeader>
              <CardTitle>Notas</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-line">{invoice.notes}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </AuthGuard>
  );
}
