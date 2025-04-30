import { notFound } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { getCustomerById, getInvoicesByCustomerId } from "@/lib/actions";
import type { Customer, Invoice } from '@/lib/definitions';
import { InvoicesTable } from '@/app/invoices/_components/invoices-table'; // Reuse invoices table
import AuthGuard from "@/components/auth/auth-guard";
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

interface CustomerHistoryPageProps {
  params: { id: string };
}

export default async function CustomerHistoryPage({ params }: CustomerHistoryPageProps) {
  const id = params.id;
  const [customer, invoices]: [Customer | null, Invoice[]] = await Promise.all([
     getCustomerById(id),
     getInvoicesByCustomerId(id)
   ]);

  if (!customer) {
    notFound();
  }

  return (
    <AuthGuard>
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                 <Button variant="outline" size="icon" asChild>
                     <Link href="/customers">
                         <ArrowLeft className="h-4 w-4" />
                         <span className="sr-only">Volver a Clientes</span>
                     </Link>
                 </Button>
                 <h1 className="text-2xl font-bold">Historial de Facturas: {customer.name}</h1>
            </div>

          <Card>
            <CardHeader>
              <CardTitle>Facturas Asociadas</CardTitle>
              <CardDescription>
                {invoices.length > 0
                  ? `Este cliente tiene ${invoices.length} factura${invoices.length === 1 ? '' : 's'} registrada${invoices.length === 1 ? '' : 's'}.`
                  : 'Este cliente aún no tiene facturas asociadas.'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {invoices.length > 0 ? (
                 <InvoicesTable invoices={invoices} />
              ) : (
                 <p className="text-muted-foreground text-center">No hay facturas para mostrar para este cliente.</p>
              )}
            </CardContent>
          </Card>
        </div>
    </AuthGuard>
  );
}
