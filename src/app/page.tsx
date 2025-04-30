import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Users, FileText } from "lucide-react";

export default function Home() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Bienvenido a Invoicify</CardTitle>
          <CardDescription>
            Tu solución simple y eficiente para la gestión de clientes y facturas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Comienza a organizar tus finanzas de manera profesional. Gestiona tus clientes y crea facturas fácilmente.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row gap-4">
            <Button asChild>
              <Link href="/customers">
                <Users className="mr-2 h-4 w-4" /> Gestionar Clientes
              </Link>
            </Button>
            <Button variant="secondary" asChild>
              <Link href="/invoices">
                <FileText className="mr-2 h-4 w-4" /> Ver Facturas
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
         <Card>
           <CardHeader>
             <CardTitle>Gestión de Clientes</CardTitle>
           </CardHeader>
           <CardContent>
             <p className="text-muted-foreground">Añade, edita y visualiza la información de contacto de tus clientes de forma centralizada.</p>
              <Button variant="link" className="p-0 h-auto mt-2" asChild>
               <Link href="/customers">Ir a Clientes →</Link>
             </Button>
           </CardContent>
         </Card>
         <Card>
           <CardHeader>
             <CardTitle>Creación de Facturas</CardTitle>
           </CardHeader>
           <CardContent>
             <p className="text-muted-foreground">Genera facturas profesionales detallando items, cantidades y precios en pocos clics.</p>
              <Button variant="link" className="p-0 h-auto mt-2" asChild>
               <Link href="/invoices/new">Crear Factura →</Link>
             </Button>
           </CardContent>
         </Card>
      </div>
    </div>
  );
}
