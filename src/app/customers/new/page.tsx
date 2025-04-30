import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { CustomerForm } from "../_components/customer-form";
import AuthGuard from "@/components/auth/auth-guard"; // Import AuthGuard

export default function NewCustomerPage() {
  return (
     <AuthGuard>
        <div className="space-y-6">
          <h1 className="text-2xl font-bold">Añadir Nuevo Cliente</h1>
          <Card>
            <CardHeader>
              <CardTitle>Información del Cliente</CardTitle>
              <CardDescription>
                Complete los detalles del nuevo cliente. El nombre es obligatorio. Cédula/RNC es opcional.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CustomerForm />
            </CardContent>
          </Card>
        </div>
     </AuthGuard>
  );
}
