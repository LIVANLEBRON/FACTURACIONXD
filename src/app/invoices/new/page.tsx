import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { InvoiceForm } from "../_components/invoice-form";
import { getCustomers } from "@/lib/actions";
import type { Customer } from "@/lib/definitions";
import AuthGuard from "@/components/auth/auth-guard"; // Import AuthGuard

export default async function NewInvoicePage() {
  // Fetching inside AuthGuard might be better if getCustomers needs user context
  const customers: Customer[] = await getCustomers();

  return (
    <AuthGuard>
        <div className="space-y-6">
          <h1 className="text-2xl font-bold">Crear Nueva Factura</h1>
          <Card>
            <CardHeader>
              <CardTitle>Detalles de la Factura</CardTitle>
              <CardDescription>
                Completa la información para generar una nueva factura. El ITBIS (18%) se calculará automáticamente.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <InvoiceForm customers={customers} />
            </CardContent>
          </Card>
        </div>
    </AuthGuard>
  );
}
