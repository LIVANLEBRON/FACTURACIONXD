import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { getInvoiceById } from "@/lib/actions";
import type { Invoice } from '@/lib/definitions';
import { ncfTypeDescriptions } from '@/lib/definitions';
import AuthGuard from "@/components/auth/auth-guard";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from '@/components/ui/separator';
import { formatCurrencyRD, formatDate } from '@/lib/utils';
import { ArrowLeft, Pencil, Download, Send } from 'lucide-react';
import { Badge } from '@/components/ui/badge'; // Import Badge

const statusVariantMap: Record<Invoice['status'], "default" | "secondary" | "outline" | "destructive"> = {
    draft: "secondary",
    sent: "outline",
    paid: "default",
    cancelled: "destructive",
};

const statusTextMap: Record<Invoice['status'], string> = {
    draft: "Borrador",
    sent: "Enviada",
    paid: "Pagada",
    cancelled: "Cancelada",
};


interface ViewInvoicePageProps {
  params: { id: string };
}

export default async function ViewInvoicePage({ params }: ViewInvoicePageProps) {
  const id = params.id;
  const invoice: Invoice | null = await getInvoiceById(id);

  if (!invoice) {
    notFound();
  }

  return (
    <AuthGuard>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
           <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" asChild>
                     <Link href="/invoices">
                         <ArrowLeft className="h-4 w-4" />
                         <span className="sr-only">Volver a Facturas</span>
                     </Link>
                </Button>
                 <h1 className="text-2xl font-bold">Factura #{invoice.invoiceNumber}</h1>
                 <Badge variant={statusVariantMap[invoice.status]}>
                     {statusTextMap[invoice.status]}
                 </Badge>
           </div>

          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href={`/invoices/${invoice.id}/edit`}>
                <Pencil className="mr-2 h-4 w-4" /> Editar
              </Link>
            </Button>
            <Button variant="outline"> {/* TODO: Add onClick handler for download */}
              <Download className="mr-2 h-4 w-4" /> Descargar PDF
            </Button>
             <Button variant="outline"> {/* TODO: Add onClick handler for send */}
               <Send className="mr-2 h-4 w-4" /> Enviar
             </Button>
          </div>
        </div>

        <Card className="overflow-hidden">
          <CardHeader className="bg-muted/50 px-6 py-4 border-b">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
               <div>
                 <div className="font-medium text-muted-foreground">Cliente</div>
                 <div>{invoice.customerName}</div>
                 {invoice.customerCedulaRnc && <div className="text-xs">{invoice.customerCedulaRnc}</div>}
               </div>
                <div>
                    <div className="font-medium text-muted-foreground">Nº Factura</div>
                    <div>{invoice.invoiceNumber}</div>
                </div>
                <div>
                    <div className="font-medium text-muted-foreground">Fecha Emisión</div>
                    <div>{formatDate(invoice.issueDate)}</div>
                </div>
                <div>
                    <div className="font-medium text-muted-foreground">Fecha Vencimiento</div>
                    <div>{formatDate(invoice.dueDate)}</div>
                </div>
                {invoice.ncfType && invoice.ncf && (
                    <>
                        <div>
                            <div className="font-medium text-muted-foreground">Tipo NCF</div>
                            <div>{invoice.ncfType} - {ncfTypeDescriptions[invoice.ncfType]}</div>
                        </div>
                        <div>
                            <div className="font-medium text-muted-foreground">NCF</div>
                            <div>{invoice.ncf}</div>
                        </div>
                    </>
                 )}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[60%]">Descripción</TableHead>
                  <TableHead className="text-center">Cantidad</TableHead>
                  <TableHead className="text-right">Precio Unit.</TableHead>
                  <TableHead className="text-right">Subtotal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoice.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.description}</TableCell>
                    <TableCell className="text-center">{item.quantity}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatCurrencyRD(item.unitPrice)}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatCurrencyRD(item.quantity * item.unitPrice)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
           <CardFooter className="flex flex-col items-end bg-muted/50 px-6 py-4 border-t text-sm">
                <div className="w-full max-w-xs space-y-1">
                     <div className="flex justify-between">
                         <span>Subtotal:</span>
                         <span className="font-medium tabular-nums">{formatCurrencyRD(invoice.subTotal)}</span>
                     </div>
                     <div className="flex justify-between">
                         <span>ITBIS ({invoice.itbisRate * 100}%):</span>
                         <span className="font-medium tabular-nums">{formatCurrencyRD(invoice.itbisAmount)}</span>
                     </div>
                      <Separator className="my-1" />
                     <div className="flex justify-between text-base font-semibold">
                         <span>Total:</span>
                         <span className="tabular-nums">{formatCurrencyRD(invoice.totalAmount)}</span>
                     </div>
                </div>
           </CardFooter>
           {invoice.notes && (
               <div className="px-6 py-4 border-t text-sm text-muted-foreground">
                   <h4 className="font-medium mb-1 text-foreground">Notas:</h4>
                   <p className="whitespace-pre-wrap">{invoice.notes}</p>
               </div>
           )}
        </Card>
      </div>
    </AuthGuard>
  );
}
