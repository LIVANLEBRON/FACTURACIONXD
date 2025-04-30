import Link from 'next/link';
import { PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { getInvoices } from '@/lib/actions';
import { InvoicesTable } from './_components/invoices-table';
import type { Invoice } from '@/lib/definitions';

export default async function InvoicesPage() {
  const invoices: Invoice[] = await getInvoices();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Gestión de Facturas</h1>
          <p className="text-muted-foreground">
            Crea, visualiza, edita o elimina tus facturas.
          </p>
        </div>
        <Button asChild>
          <Link href="/invoices/new">
            <PlusCircle className="mr-2 h-4 w-4" /> Crear Factura
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Facturas</CardTitle>
           <CardDescription>
             {invoices.length > 0
               ? `Tienes ${invoices.length} factura${invoices.length === 1 ? '' : 's'} registrada${invoices.length === 1 ? '' : 's'}.`
               : 'Aún no has creado ninguna factura.'}
           </CardDescription>
        </CardHeader>
        <CardContent>
          <InvoicesTable invoices={invoices} />
        </CardContent>
      </Card>
    </div>
  );
}
