import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { InvoiceForm } from "../_components/invoice-form";
import { getCustomers } from "@/lib/actions";
import type { Customer } from "@/lib/definitions";

export default async function NewInvoicePage() {
  const customers: Customer[] = await getCustomers();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Crear Nueva Factura</h1>
      <Card>
        <CardHeader>
          <CardTitle>Detalles de la Factura</CardTitle>
          <CardDescription>
            Completa la información para generar una nueva factura.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <InvoiceForm customers={customers} />
        </CardContent>
      </Card>
    </div>
  );
}
